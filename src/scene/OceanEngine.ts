import { MAX_RIPPLES, VERTEX_SHADER, buildFragmentShader } from './shaders';

/**
 * OceanEngine owns the WebGL canvas, the render loop and all pointer input for the
 * background. It deliberately lives OUTSIDE React: pointer moves happen dozens of
 * times per second and must not trigger React re-renders.
 */

type Quality = 0 | 1 | 2;

/** Elements that must keep normal behaviour: no ripple is spawned over them. */
const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, summary, label, dialog, [role="dialog"], [data-no-ripple]';

export function detectQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  if (coarse || cores <= 4 || mem <= 4) return coarse && (cores <= 4 || mem <= 2) ? 0 : 1;
  return 2;
}

/** Fraction of the viewport height (from the top) where the horizon sits. */
function horizonFromTop(scrollY: number, vw: number, vh: number): number {
  const portrait = vw / vh < 0.9;
  const start = portrait ? 0.78 : 0.64; // phones: more sky so the hero text sits above the water
  const end = portrait ? 0.40 : 0.34;
  const p = Math.min(Math.max(scrollY / (vh * 1.1), 0), 1);
  const eased = p * p * (3 - 2 * p);
  return start + (end - start) * eased;
}

export class OceanEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  private quality: Quality;
  private resolutionScale: number;
  private reducedMotion: boolean;

  private raf = 0;
  private running = false;
  private startMs = performance.now();
  private lastMs = performance.now();
  private frameEma = 1 / 60;
  private frameCount = 0;
  private lastAdapt = 0;

  // pointer state (plain numbers, no React)
  private targetX = 0;
  private targetY = 0;
  private curX = 0;
  private curY = 0;
  private lastRippleX = -999;
  private lastRippleY = -999;
  private lastRippleMs = 0;

  private ripples = new Float32Array(MAX_RIPPLES * 4); // ring buffer, filled with zeros
  private rippleIndex = 0;

  private scrollY = window.scrollY;
  private dim = 0;
  private cleanup: Array<() => void> = [];
  private contextLost = false;
  private onFirstFrame?: () => void;

  constructor(canvas: HTMLCanvasElement, opts: { onFirstFrame?: () => void } = {}) {
    this.canvas = canvas;
    this.onFirstFrame = opts.onFirstFrame;
    const gl = canvas.getContext('webgl', {
      antialias: false, // the scene is soft; MSAA would be wasted GPU work
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'default', // battery-friendly
    });
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;

    this.quality = detectQuality();
    this.resolutionScale = this.quality === 2 ? 1 : this.quality === 1 ? 0.8 : 0.6;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initGL();
    this.bindEvents();
    this.resize();
  }

  // ------------------------------------------------------------------ setup

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error('Shader compile error: ' + log);
    }
    return sh;
  }

  private initGL() {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compile(gl.FRAGMENT_SHADER, buildFragmentShader(this.quality));
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;

    // One oversized triangle covers the screen (cheaper than a quad).
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    gl.useProgram(program);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const name of ['uRes', 'uTime', 'uMouse', 'uHorizon', 'uDim', 'uRipples']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  private bindEvents() {
    const on = <K extends keyof WindowEventMap>(
      type: K,
      fn: (e: WindowEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      window.addEventListener(type, fn, opts);
      this.cleanup.push(() => window.removeEventListener(type, fn, opts));
    };

    on('pointermove', this.onPointerMove, { passive: true });
    on('pointerdown', this.onPointerDown, { passive: true });
    on('scroll', this.onScroll, { passive: true });
    on('resize', () => this.resize(), { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', this.onVisibility));

    const onLost = (e: Event) => {
      e.preventDefault(); // allows the browser to restore the context
      this.contextLost = true;
      this.stop();
    };
    const onRestored = () => {
      this.contextLost = false;
      try {
        this.uniforms = {};
        this.initGL();
        this.resize();
        this.start();
      } catch {
        /* if restoring fails, the CSS fallback behind the canvas remains visible */
      }
    };
    this.canvas.addEventListener('webglcontextlost', onLost);
    this.canvas.addEventListener('webglcontextrestored', onRestored);
    this.cleanup.push(() => {
      this.canvas.removeEventListener('webglcontextlost', onLost);
      this.canvas.removeEventListener('webglcontextrestored', onRestored);
    });

    // Live-update if the user toggles reduced motion in their OS while the page is open.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => {
      this.reducedMotion = mq.matches;
      if (this.reducedMotion) {
        this.stop();
        this.renderOnce();
      } else {
        this.start();
      }
    };
    mq.addEventListener('change', onMq);
    this.cleanup.push(() => mq.removeEventListener('change', onMq));
  }

  // ------------------------------------------------------------------ input

  private onPointerMove = (e: PointerEvent) => {
    if (this.reducedMotion) return;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      this.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetY = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    // Throttle: only spawn when moved far enough AND enough time has passed.
    const now = performance.now();
    const dx = e.clientX - this.lastRippleX;
    const dy = e.clientY - this.lastRippleY;
    if (now - this.lastRippleMs < 110 || dx * dx + dy * dy < 34 * 34) return;
    this.trySpawnRipple(e, 0.55);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.reducedMotion) return;
    this.trySpawnRipple(e, 1.0); // taps (and clicks) make a stronger ripple
  };

  private trySpawnRipple(e: PointerEvent, strength: number) {
    const target = e.target as Element | null;
    if (target && target.closest && target.closest(INTERACTIVE_SELECTOR)) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const horizonY = horizonFromTop(this.scrollY, vw, vh) * vh; // px from top
    if (e.clientY < horizonY + 6) return; // only on the water
    const now = performance.now();
    this.lastRippleX = e.clientX;
    this.lastRippleY = e.clientY;
    this.lastRippleMs = now;
    const i = this.rippleIndex * 4;
    this.ripples[i] = e.clientX / vw;
    this.ripples[i + 1] = 1 - e.clientY / vh;
    this.ripples[i + 2] = (now - this.startMs) / 1000;
    this.ripples[i + 3] = strength;
    this.rippleIndex = (this.rippleIndex + 1) % MAX_RIPPLES; // pool: oldest is overwritten
  }

  private onScroll = () => {
    this.scrollY = window.scrollY;
    if (this.reducedMotion) this.renderOnce(); // static mode still follows scroll
  };

  private onVisibility = () => {
    if (document.hidden) this.stop();
    else if (!this.reducedMotion) this.start();
  };

  // ------------------------------------------------------------------ sizing

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap pixel ratio
    const scale = dpr * this.resolutionScale;
    const w = Math.max(1, Math.floor(window.innerWidth * scale));
    const h = Math.max(1, Math.floor(window.innerHeight * scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    if (!this.running) this.renderOnce();
  }

  // ------------------------------------------------------------------ loop

  start() {
    if (this.running || this.contextLost) return;
    if (this.reducedMotion) {
      this.renderOnce();
      return;
    }
    this.running = true;
    this.lastMs = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame = (nowMs: number) => {
    if (!this.running) return;
    const dt = Math.min((nowMs - this.lastMs) / 1000, 0.1);
    this.lastMs = nowMs;

    // Damped follow: smooth, with a sense of inertia.
    const k = 1 - Math.exp(-dt * 2.6);
    this.curX += (this.targetX - this.curX) * k;
    this.curY += (this.targetY - this.curY) * k;

    this.draw(nowMs);
    this.adaptQuality(dt, nowMs);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** If frames are consistently slow, quietly render fewer pixels. Never scales back up. */
  private adaptQuality(dt: number, nowMs: number) {
    this.frameCount++;
    this.frameEma += (dt - this.frameEma) * 0.08;
    if (this.frameCount < 90 || nowMs - this.lastAdapt < 2000) return;
    if (this.frameEma > 1 / 36 && this.resolutionScale > 0.5) {
      this.resolutionScale *= 0.85;
      this.lastAdapt = nowMs;
      this.resize();
    }
  }

  private renderOnce() {
    if (this.contextLost) return;
    this.draw(this.startMs + 12000); // fixed time => static, calm frame
  }

  private draw(nowMs: number) {
    const gl = this.gl;
    const u = this.uniforms;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const t = this.reducedMotion ? 12 : (nowMs - this.startMs) / 1000;

    // gentle idle drift so the scene is alive even without a mouse (e.g. on touch)
    const drift = this.reducedMotion ? 0 : 1;
    const mx = this.curX + Math.sin(t * 0.07) * 0.18 * drift;
    const my = this.curY + Math.cos(t * 0.09) * 0.10 * drift;

    const horizon = 1 - horizonFromTop(this.scrollY, vw, vh);
    const targetDim = Math.min(Math.max(this.scrollY / (vh * 0.9), 0), 1);
    this.dim += (targetDim - this.dim) * 0.15;

    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, t);
    gl.uniform2f(u.uMouse, this.reducedMotion ? 0 : mx, this.reducedMotion ? 0 : my);
    gl.uniform1f(u.uHorizon, horizon);
    gl.uniform1f(u.uDim, this.reducedMotion ? targetDim : this.dim);
    gl.uniform4fv(u.uRipples, this.ripples);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (this.onFirstFrame) {
      this.onFirstFrame();
      this.onFirstFrame = undefined;
    }
  }

  // ------------------------------------------------------------------ teardown

  dispose() {
    this.stop();
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
    const gl = this.gl;
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.program) gl.deleteProgram(this.program);
    this.buffer = null;
    this.program = null;
    // Note: we do NOT call loseContext(). A lost context cannot be re-created on the
    // same canvas, which would break React StrictMode's mount/unmount/mount cycle in dev.
  }
}
