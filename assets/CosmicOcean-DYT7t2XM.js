var g=Object.defineProperty;var w=(r,e,t)=>e in r?g(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var o=(r,e,t)=>w(r,typeof e!="symbol"?e+"":e,t);import{r as d,j as h}from"./index-DiYtV0st.js";const y=`
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,f=6;function x(r){return`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define NEBULA_OCTAVES ${r===0?3:r===1?4:5}
#define STAR_LAYERS ${r===0?2:3}
#define QUALITY ${r}
#define MAX_RIPPLES ${f}

uniform vec2  uRes;       // canvas size in pixels
uniform float uTime;      // seconds
uniform vec2  uMouse;     // smoothed pointer, -1..1 (y up)
uniform float uHorizon;   // horizon height in screen UV (0 bottom .. 1 top)
uniform float uDim;       // 0..1, darkens the scene while scrolling for legibility
uniform vec4  uRipples[MAX_RIPPLES]; // xy = centre in screen UV, z = start time, w = strength

// ---------- palette ----------
const vec3 SKY_TOP    = vec3(0.006, 0.010, 0.028);
const vec3 SKY_LOW    = vec3(0.030, 0.070, 0.130);
const vec3 INDIGO     = vec3(0.110, 0.130, 0.420);
const vec3 VIOLET     = vec3(0.300, 0.170, 0.500);
const vec3 CYAN       = vec3(0.250, 0.800, 0.900);
const vec3 DEEP_WATER = vec3(0.006, 0.030, 0.055);
const vec3 TEAL_WATER = vec3(0.020, 0.200, 0.250);

// ---------- noise helpers ----------
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < NEBULA_OCTAVES; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}

// ---------- stars ----------
// One layer = a grid of cells; each cell may hold one star at a random spot.
// Different grid scales + different parallax per layer give the sense of depth.
vec3 starLayer(vec2 uv, float scale, float seed, float sizeMul, float t) {
  vec2 q = uv * scale;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash21(id + seed);
  float present = step(0.80, h);
  vec2 off = (vec2(hash21(id + seed + 7.1), hash21(id + seed + 13.7)) - 0.5) * 0.72;
  float d = length(f - off);
  float mag = pow(hash21(id + seed + 3.3), 5.0);   // few bright stars, many faint ones
  float size = (0.05 + 0.10 * mag) * sizeMul;
  float twinkle = 0.78 + 0.22 * sin(t * (0.8 + 2.4 * h) + h * 60.0);
  float core = smoothstep(size, 0.0, d);
  float glow = mag * smoothstep(0.35, 0.0, d) * 0.22;
  float tint = hash21(id + seed + 21.3);
  vec3 col = mix(vec3(0.72, 0.86, 1.0), vec3(1.0, 0.93, 0.82), step(0.85, tint));
  return col * (core + glow) * present * twinkle * (0.35 + mag * 1.7);
}

// ---------- the sky (also sampled for the water reflection) ----------
vec3 sky(vec2 uv, float horizon, float aspect, float t) {
  float dy = uv.y - horizon;                       // height above horizon
  float up = clamp(dy / max(1.0 - horizon, 0.001), 0.0, 1.0);

  // base gradient + warm-cool horizon haze
  vec3 col = mix(SKY_LOW, SKY_TOP, pow(up, 0.55));
  col += vec3(0.05, 0.22, 0.28) * exp(-dy * 9.0) * 0.55;

  vec2 p = vec2(uv.x * aspect, uv.y);

  // nebula + faint milky-way band (slow parallax, different rate to stars)
  vec2 nPar = uMouse * vec2(0.010, 0.006);
  vec2 np = (p + nPar) * 1.5;
  float ca = cos(-0.42);
  float sa = sin(-0.42);
  vec2 r = vec2(ca * np.x - sa * np.y, sa * np.x + ca * np.y);
  float band = exp(-pow((r.y - 0.55) / 0.40, 2.0));
  float n1 = fbm(np * 1.7 + vec2(t * 0.004, 0.0));
  float n2 = fbm(np * 2.9 + vec2(5.2, -t * 0.003));
  float cloud = smoothstep(0.36, 0.86, n1) * (0.25 + 0.75 * band);
  vec3 neb = mix(INDIGO, VIOLET, smoothstep(0.3, 0.8, n2));
  neb = mix(neb, CYAN * 0.55, smoothstep(0.62, 0.95, n1 * n2 * 1.9) * 0.45);
  col += neb * cloud * 0.55 * smoothstep(0.0, 0.18, up + 0.04);
  col += vec3(0.20, 0.24, 0.40) * band * smoothstep(0.45, 0.8, n2) * 0.10;

  // stars: far (slow) -> near (faster) parallax
  vec3 stars = vec3(0.0);
  stars += starLayer(p + uMouse * 0.004, 38.0, 1.0, 0.70, t);
  stars += starLayer(p + uMouse * 0.009 + vec2(3.1, 1.7), 22.0, 2.0, 0.95, t) * 0.9;
#if STAR_LAYERS > 2
  stars += starLayer(p + uMouse * 0.017 + vec2(8.3, 4.1), 11.0, 3.0, 1.25, t) * 0.8;
#endif
  // fade stars into the horizon haze, and thin them where the nebula is dense
  stars *= smoothstep(0.0, 0.12, dy) * (1.0 - cloud * 0.35);
  col += stars;

  // distant luminous planet with a faint ring: the hero's dimensional centrepiece
  // (on tall phone screens it sits low, just above the horizon, clear of the hero text)
  vec2 pc = vec2((aspect > 1.0 ? 0.72 : 0.70) * aspect, horizon + (aspect > 1.0 ? 0.20 : 0.085));
  pc += uMouse * 0.012;
  float pr = aspect > 1.0 ? 0.075 : 0.048;
  vec2 q = p - pc;
  float dist = length(q);
  float halo = exp(-max(dist - pr, 0.0) * 14.0);
  col += vec3(0.10, 0.45, 0.55) * halo * 0.20;
  if (dist < pr) {
    vec2 s = q / pr;
    float zc = sqrt(max(1.0 - dot(s, s), 0.0));
    vec3 nrm = vec3(s, zc);
    vec3 L = normalize(vec3(-0.55, 0.45, 0.70));
    float diff = max(dot(nrm, L), 0.0);
    float rim = pow(1.0 - zc, 2.5);
    float bands = 0.5 + 0.5 * sin(s.y * 9.0 + fbm(s * 2.5 + 4.0) * 3.0);
    vec3 base = mix(vec3(0.05, 0.12, 0.22), vec3(0.12, 0.34, 0.42), bands);
    vec3 planet = base * (0.12 + 1.15 * diff) + CYAN * rim * (0.15 + 0.5 * diff);
    col = mix(col, planet, smoothstep(pr, pr - 0.004, dist));
  }
  // ring: tilted ellipse, hidden behind the planet disc where it passes behind
  {
    float tilt = -0.28;
    vec2 rq = vec2(cos(tilt) * q.x - sin(tilt) * q.y, sin(tilt) * q.x + cos(tilt) * q.y);
    float e = length(vec2(rq.x, rq.y / 0.24));
    float ring = smoothstep(0.012, 0.0, abs(e - pr * 1.75)) * 0.55
               + smoothstep(0.030, 0.0, abs(e - pr * 2.15)) * 0.18;
    float behind = step(0.0, rq.y) * step(dist, pr);
    col += mix(vec3(0.35, 0.65, 0.80), vec3(0.6, 0.8, 0.95), 0.3) * ring * (1.0 - behind) * 0.55;
  }

  return col;
}

// ---------- water ----------
// Perspective-ish mapping from screen to the water plane. Nearer pixels (further
// below the horizon) cover less world distance than far pixels, which is what
// makes waves shrink toward the horizon.
vec2 waterPlane(vec2 uv, float horizon, float aspect, out float z) {
  float dy = max(horizon - uv.y, 0.002);
  z = 0.20 / (dy + 0.018);
  return vec2((uv.x - 0.5) * aspect * z * 6.0, z * 6.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime;

  // The horizon tilts a hair with the pointer, which sells the 3D feel.
  float horizon = uHorizon + uMouse.y * 0.006;

  vec3 col;

  if (uv.y >= horizon) {
    col = sky(uv, horizon, aspect, t);
  } else {
    float z;
    vec2 wp = waterPlane(uv, horizon, aspect, z);
    vec2 wpAnim = wp + vec2(uMouse.x * 0.9, t * 0.35);   // water drifts + follows pointer at its own rate
    float fade = 1.0 / (1.0 + z * z * 0.09);              // flatten far waves to avoid shimmer/aliasing

    // Sum of directional waves; gradient is computed analytically (cheap normals).
    vec2 g = vec2(0.0);
    float hgt = 0.0;
    {
      vec2 d1 = vec2(0.90, 0.43);
      float p1 = dot(wpAnim, d1) * 1.15 + t * 0.55;
      g += d1 * cos(p1) * 1.15 * 0.50;  hgt += sin(p1) * 0.50;
      vec2 d2 = vec2(-0.52, 0.85);
      float p2 = dot(wpAnim, d2) * 1.9 + t * 0.80;
      g += d2 * cos(p2) * 1.9 * 0.30;   hgt += sin(p2) * 0.30;
      vec2 d3 = vec2(0.20, -0.98);
      float p3 = dot(wpAnim, d3) * 3.6 + t * 1.15;
      g += d3 * cos(p3) * 3.6 * 0.16;   hgt += sin(p3) * 0.16;
#if QUALITY > 0
      vec2 d4 = vec2(-0.85, -0.30);
      float p4 = dot(wpAnim, d4) * 7.1 + t * 1.6;
      g += d4 * cos(p4) * 7.1 * 0.07;   hgt += sin(p4) * 0.07;
#endif
    }
    g *= fade;
    hgt *= fade;

    // Pointer / tap ripples: concentric rings in WATER-PLANE space, so they are
    // correctly foreshortened by perspective and distort the reflection below.
    vec3 rippleGlow = vec3(0.0);
    for (int i = 0; i < MAX_RIPPLES; i++) {
      vec4 rp = uRipples[i];
      float age = t - rp.z;
      if (rp.w > 0.0 && age > 0.0 && age < 4.2) {
        float zc;
        vec2 wc = waterPlane(rp.xy, horizon, aspect, zc);
        vec2 dv = wp - wc;
        float dist = length(dv) + 1e-4;
        float radius = age * 3.2;
        float x = dist - radius;
        float env = exp(-x * x * 0.55) * exp(-age * 0.95) * rp.w * smoothstep(0.0, 0.12, age);
        float k = 4.2;                                    // ring spacing
        float s = sin(x * k);
        float c = cos(x * k);
        g += (dv / dist) * c * k * env * 0.22;
        hgt += s * env * 0.25;
        rippleGlow += vec3(0.45, 0.90, 1.0) * pow(max(s, 0.0), 3.0) * env * 0.33;
      }
    }

    // Surface normal from the gradient
    vec3 nrm = normalize(vec3(-g.x * 0.055, 1.0, -g.y * 0.055));

    float dy = horizon - uv.y;
    // Reflection: mirror around the horizon, offset by the surface normal.
    vec2 ruv = vec2(
      uv.x + nrm.x * (0.055 + 0.04 * fade) + uMouse.x * 0.004,
      2.0 * horizon - uv.y + nrm.z * 0.045 * (0.4 + fade)
    );
    ruv.y = min(ruv.y, 0.999);
    vec3 refl = sky(ruv, horizon, aspect, t);

    // Fresnel-ish: water mirrors more at grazing angles (near the horizon).
    float graze = 1.0 - clamp(dy * 1.9, 0.0, 1.0);
    float fres = mix(0.22, 0.95, pow(graze, 1.7));

    // Dark body colour with subtle teal scattering in wave crests.
    float crest = smoothstep(-0.2, 0.8, hgt);
    vec3 body = mix(DEEP_WATER, TEAL_WATER, crest * (0.35 + 0.65 * graze) + 0.10);
    body *= 0.75 + 0.25 * smoothstep(0.0, 0.5, dy);

    col = mix(body, refl * vec3(0.92, 1.0, 1.05), fres);

    // Specular glints picking up the bright cyan sky + soft horizon mist.
    vec3 V = normalize(vec3(0.0, 0.35, 1.0));
    vec3 Lh = normalize(vec3(-0.2, 0.7, 0.5) + V);
    float spec = pow(max(dot(nrm, Lh), 0.0), 90.0);
    col += CYAN * spec * 0.30 * (0.3 + graze);
    col += vec3(0.04, 0.20, 0.26) * exp(-dy * 22.0) * 0.8;
    col += rippleGlow;

    // Soft line where sky meets water
    col += vec3(0.25, 0.75, 0.85) * exp(-dy * 260.0) * 0.20;
  }

  // Vignette, scroll dim, and a touch of dithering to avoid colour banding.
  vec2 vc = uv - 0.5;
  col *= 1.0 - dot(vc, vc) * 0.55;
  col *= 1.0 - uDim * 0.42;
  col += (hash21(frag + fract(t)) - 0.5) / 160.0;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`}const b='a, button, input, textarea, select, summary, label, dialog, [role="dialog"], [data-no-ripple]';function z(){const r=navigator,e=window.matchMedia("(pointer: coarse)").matches,t=r.hardwareConcurrency??4,s=r.deviceMemory??4;return e||t<=4||s<=4?e&&(t<=4||s<=2)?0:1:2}function u(r,e,t){const s=e/t<.9,i=s?.78:.64,a=s?.4:.34,n=Math.min(Math.max(r/(t*1.1),0),1),c=n*n*(3-2*n);return i+(a-i)*c}class E{constructor(e,t={}){o(this,"canvas");o(this,"gl");o(this,"program",null);o(this,"buffer",null);o(this,"uniforms",{});o(this,"quality");o(this,"resolutionScale");o(this,"reducedMotion");o(this,"raf",0);o(this,"running",!1);o(this,"startMs",performance.now());o(this,"lastMs",performance.now());o(this,"frameEma",1/60);o(this,"frameCount",0);o(this,"lastAdapt",0);o(this,"targetX",0);o(this,"targetY",0);o(this,"curX",0);o(this,"curY",0);o(this,"lastRippleX",-999);o(this,"lastRippleY",-999);o(this,"lastRippleMs",0);o(this,"ripples",new Float32Array(f*4));o(this,"rippleIndex",0);o(this,"scrollY",window.scrollY);o(this,"dim",0);o(this,"cleanup",[]);o(this,"contextLost",!1);o(this,"onFirstFrame");o(this,"onPointerMove",e=>{if(this.reducedMotion)return;(e.pointerType==="mouse"||e.pointerType==="pen")&&(this.targetX=e.clientX/window.innerWidth*2-1,this.targetY=-(e.clientY/window.innerHeight*2-1));const t=performance.now(),s=e.clientX-this.lastRippleX,i=e.clientY-this.lastRippleY;t-this.lastRippleMs<110||s*s+i*i<34*34||this.trySpawnRipple(e,.55)});o(this,"onPointerDown",e=>{this.reducedMotion||this.trySpawnRipple(e,1)});o(this,"onScroll",()=>{this.scrollY=window.scrollY,this.reducedMotion&&this.renderOnce()});o(this,"onVisibility",()=>{document.hidden?this.stop():this.reducedMotion||this.start()});o(this,"frame",e=>{if(!this.running)return;const t=Math.min((e-this.lastMs)/1e3,.1);this.lastMs=e;const s=1-Math.exp(-t*2.6);this.curX+=(this.targetX-this.curX)*s,this.curY+=(this.targetY-this.curY)*s,this.draw(e),this.adaptQuality(t,e),this.raf=requestAnimationFrame(this.frame)});this.canvas=e,this.onFirstFrame=t.onFirstFrame;const s=e.getContext("webgl",{antialias:!1,alpha:!1,depth:!1,stencil:!1,powerPreference:"default"});if(!s)throw new Error("WebGL is not available");this.gl=s,this.quality=z(),this.resolutionScale=this.quality===2?1:this.quality===1?.8:.6,this.reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.initGL(),this.bindEvents(),this.resize()}compile(e,t){const s=this.gl,i=s.createShader(e);if(s.shaderSource(i,t),s.compileShader(i),!s.getShaderParameter(i,s.COMPILE_STATUS)){const a=s.getShaderInfoLog(i);throw s.deleteShader(i),new Error("Shader compile error: "+a)}return i}initGL(){const e=this.gl,t=this.compile(e.VERTEX_SHADER,y),s=this.compile(e.FRAGMENT_SHADER,x(this.quality)),i=e.createProgram();if(e.attachShader(i,t),e.attachShader(i,s),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw new Error("Program link error: "+e.getProgramInfoLog(i));e.deleteShader(t),e.deleteShader(s),this.program=i,this.buffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.buffer),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.useProgram(i);const a=e.getAttribLocation(i,"aPos");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0);for(const n of["uRes","uTime","uMouse","uHorizon","uDim","uRipples"])this.uniforms[n]=e.getUniformLocation(i,n)}bindEvents(){const e=(n,c,l)=>{window.addEventListener(n,c,l),this.cleanup.push(()=>window.removeEventListener(n,c,l))};e("pointermove",this.onPointerMove,{passive:!0}),e("pointerdown",this.onPointerDown,{passive:!0}),e("scroll",this.onScroll,{passive:!0}),e("resize",()=>this.resize(),{passive:!0}),document.addEventListener("visibilitychange",this.onVisibility),this.cleanup.push(()=>document.removeEventListener("visibilitychange",this.onVisibility));const t=n=>{n.preventDefault(),this.contextLost=!0,this.stop()},s=()=>{this.contextLost=!1;try{this.uniforms={},this.initGL(),this.resize(),this.start()}catch{}};this.canvas.addEventListener("webglcontextlost",t),this.canvas.addEventListener("webglcontextrestored",s),this.cleanup.push(()=>{this.canvas.removeEventListener("webglcontextlost",t),this.canvas.removeEventListener("webglcontextrestored",s)});const i=window.matchMedia("(prefers-reduced-motion: reduce)"),a=()=>{this.reducedMotion=i.matches,this.reducedMotion?(this.stop(),this.renderOnce()):this.start()};i.addEventListener("change",a),this.cleanup.push(()=>i.removeEventListener("change",a))}trySpawnRipple(e,t){const s=e.target;if(s&&s.closest&&s.closest(b))return;const i=window.innerWidth,a=window.innerHeight,n=u(this.scrollY,i,a)*a;if(e.clientY<n+6)return;const c=performance.now();this.lastRippleX=e.clientX,this.lastRippleY=e.clientY,this.lastRippleMs=c;const l=this.rippleIndex*4;this.ripples[l]=e.clientX/i,this.ripples[l+1]=1-e.clientY/a,this.ripples[l+2]=(c-this.startMs)/1e3,this.ripples[l+3]=t,this.rippleIndex=(this.rippleIndex+1)%f}resize(){const t=Math.min(window.devicePixelRatio||1,1.5)*this.resolutionScale,s=Math.max(1,Math.floor(window.innerWidth*t)),i=Math.max(1,Math.floor(window.innerHeight*t));(this.canvas.width!==s||this.canvas.height!==i)&&(this.canvas.width=s,this.canvas.height=i),this.gl.viewport(0,0,s,i),this.running||this.renderOnce()}start(){if(!(this.running||this.contextLost)){if(this.reducedMotion){this.renderOnce();return}this.running=!0,this.lastMs=performance.now(),this.raf=requestAnimationFrame(this.frame)}}stop(){this.running=!1,cancelAnimationFrame(this.raf)}adaptQuality(e,t){this.frameCount++,this.frameEma+=(e-this.frameEma)*.08,!(this.frameCount<90||t-this.lastAdapt<2e3)&&this.frameEma>1/36&&this.resolutionScale>.5&&(this.resolutionScale*=.85,this.lastAdapt=t,this.resize())}renderOnce(){this.contextLost||this.draw(this.startMs+12e3)}draw(e){const t=this.gl,s=this.uniforms,i=window.innerWidth,a=window.innerHeight,n=this.reducedMotion?12:(e-this.startMs)/1e3,c=this.reducedMotion?0:1,l=this.curX+Math.sin(n*.07)*.18*c,v=this.curY+Math.cos(n*.09)*.1*c,m=1-u(this.scrollY,i,a),p=Math.min(Math.max(this.scrollY/(a*.9),0),1);this.dim+=(p-this.dim)*.15,t.uniform2f(s.uRes,this.canvas.width,this.canvas.height),t.uniform1f(s.uTime,n),t.uniform2f(s.uMouse,this.reducedMotion?0:l,this.reducedMotion?0:v),t.uniform1f(s.uHorizon,m),t.uniform1f(s.uDim,this.reducedMotion?p:this.dim),t.uniform4fv(s.uRipples,this.ripples),t.drawArrays(t.TRIANGLES,0,3),this.onFirstFrame&&(this.onFirstFrame(),this.onFirstFrame=void 0)}dispose(){this.stop(),this.cleanup.forEach(t=>t()),this.cleanup=[];const e=this.gl;this.buffer&&e.deleteBuffer(this.buffer),this.program&&e.deleteProgram(this.program),this.buffer=null,this.program=null}}function M(){return h.jsx("div",{className:"ocean-fallback","aria-hidden":"true"})}function A({onFail:r}){const e=d.useRef(null),[t,s]=d.useState(!1);return d.useEffect(()=>{const i=e.current;if(!i)return;let a=null;try{a=new E(i,{onFirstFrame:()=>s(!0)}),a.start()}catch(n){console.warn("[CosmicOcean] WebGL unavailable, using CSS fallback.",n),r()}return()=>a==null?void 0:a.dispose()},[r]),h.jsx("canvas",{ref:e,className:`ocean-canvas${t?" is-ready":""}`,"aria-hidden":"true",tabIndex:-1})}class L extends d.Component{constructor(){super(...arguments);o(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}render(){return this.state.failed?this.props.fallback:this.props.children}}function P(){const[r,e]=d.useState(!1);return h.jsxs("div",{className:"ocean","aria-hidden":"true",children:[h.jsx(M,{}),!r&&h.jsx(L,{fallback:null,children:h.jsx(A,{onFail:()=>e(!0)})})]})}export{P as default};
