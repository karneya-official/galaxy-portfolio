/**
 * GLSL source for the Cosmic Ocean.
 *
 * The whole scene (stars, nebula, planet, horizon, water, ripples) is drawn by ONE
 * fragment shader on ONE full-screen triangle. That is the lightest possible WebGL
 * setup: no models, no textures, no post-processing, almost no JavaScript per frame.
 *
 * `quality` (0 = low, 1 = medium, 2 = high) is baked in at compile time so
 * weaker devices run a genuinely cheaper shader instead of a branchy one.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const MAX_RIPPLES = 6;

export function buildFragmentShader(quality: 0 | 1 | 2): string {
  const nebulaOctaves = quality === 0 ? 3 : quality === 1 ? 4 : 5;
  const starLayers = quality === 0 ? 2 : 3;
  return /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define NEBULA_OCTAVES ${nebulaOctaves}
#define STAR_LAYERS ${starLayers}
#define QUALITY ${quality}
#define MAX_RIPPLES ${MAX_RIPPLES}

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
`;
}
