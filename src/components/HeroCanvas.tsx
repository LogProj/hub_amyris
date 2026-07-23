"use client"

import { useEffect, useRef } from "react"

/**
 * Fundo 3D do hero em WebGL (ogl): um campo de "aurora molecular" — domos de luz
 * roxa que respiram e fluem, evocando biotecnologia/moléculas. Leve (um único
 * full-screen triangle + fragment shader), com:
 *  - fallback automático: se WebGL falhar, fica o gradiente CSS do contêiner pai;
 *  - prefers-reduced-motion: congela a animação (renderiza um frame estático).
 */
const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  // paleta Amyris
  const vec3 INK    = vec3(0.102, 0.043, 0.180); // #1A0B2E
  const vec3 PURPLE = vec3(0.294, 0.000, 0.522); // #4B0085
  const vec3 VIOLET = vec3(0.486, 0.227, 0.929); // #7C3AED
  const vec3 LILAC  = vec3(0.655, 0.545, 0.980); // #A78BFA
  const vec3 MIST   = vec3(0.957, 0.941, 0.984); // #F4F0FB

  // hash + value noise + fbm
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = uv;
    p.x *= aspect;

    float t = uTime * 0.06;

    // domínio deformado para um fluxo orgânico
    vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t)), fbm(p * 1.6 + vec2(5.2, -t)));
    vec2 r = vec2(fbm(p * 1.6 + q * 1.4 + vec2(1.7, 9.2) + 0.15 * t),
                  fbm(p * 1.6 + q * 1.4 + vec2(8.3, 2.8) - 0.12 * t));
    float f = fbm(p * 1.6 + r);

    // base clara -> profundidade roxa
    vec3 col = mix(MIST, LILAC, smoothstep(0.0, 0.9, f));
    col = mix(col, VIOLET, smoothstep(0.35, 1.0, length(r)));
    col = mix(col, PURPLE, smoothstep(0.55, 1.15, f + 0.25 * length(q)));
    col = mix(col, INK, smoothstep(0.85, 1.35, f) * 0.5);

    // "moléculas" — pontos de luz suaves orbitando
    float glow = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 c = vec2(
        0.5 * aspect + 0.32 * aspect * sin(t * 1.3 + fi * 1.9),
        0.5 + 0.30 * cos(t * 1.1 + fi * 2.3)
      );
      float d = length(p - c);
      glow += 0.018 / (d * d + 0.012);
    }
    col += LILAC * clamp(glow, 0.0, 0.6) * 0.5;

    // vinheta suave para dar volume
    float vig = smoothstep(1.35, 0.2, length((uv - 0.5) * vec2(aspect, 1.0)));
    col = mix(col, col * 0.92 + INK * 0.04, 1.0 - vig);

    // leve grão para não bandar
    float grain = (hash(uv * uResolution + uTime) - 0.5) * 0.015;
    col += grain;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function HeroCanvas({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let raf = 0
    let cleanup: (() => void) | null = null
    let cancelled = false

    // import dinâmico para não pesar o bundle inicial e isolar falhas de WebGL
    import("ogl")
      .then(({ Renderer, Triangle, Program, Mesh }) => {
        if (cancelled) return

        let renderer
        try {
          renderer = new Renderer({
            alpha: true,
            antialias: true,
            dpr: Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1),
          })
        } catch {
          return // sem WebGL: mantém o gradiente CSS do pai
        }

        const gl = renderer.gl
        const canvas = gl.canvas as HTMLCanvasElement
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.display = "block"
        container.appendChild(canvas)

        const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            uTime: { value: 0 },
            uResolution: { value: [1, 1] },
          },
        })
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

        const resize = () => {
          const w = container.clientWidth || 1
          const h = container.clientHeight || 1
          renderer.setSize(w, h)
          program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight]
        }
        resize()
        window.addEventListener("resize", resize)

        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        const start = performance.now()
        const render = (now: number) => {
          program.uniforms.uTime.value = reduced ? 8 : (now - start) / 1000
          renderer.render({ scene: mesh })
          if (!reduced) raf = requestAnimationFrame(render)
        }
        raf = requestAnimationFrame(render)

        cleanup = () => {
          cancelAnimationFrame(raf)
          window.removeEventListener("resize", resize)
          const ext = gl.getExtension("WEBGL_lose_context")
          ext?.loseContext()
          if (canvas.parentNode === container) container.removeChild(canvas)
        }
      })
      .catch(() => {
        /* mantém fallback CSS */
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      cleanup?.()
    }
  }, [])

  return <div ref={containerRef} aria-hidden className={className} />
}
