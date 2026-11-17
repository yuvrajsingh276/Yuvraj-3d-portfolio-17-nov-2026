import { useEffect, useRef } from 'react';

type Particle = { x: number; depth: number; phase: number; size: number; hue: number };
const TAU = Math.PI * 2;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Lightweight 2D hero background. It is intentionally independent from WebGL:
 * capped at 30fps, <= 1.25 DPR, pauses off-screen/in hidden tabs, and uses
 * a fixed particle pool with no per-particle gradients or blur filters.
 */
export function ParticleWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !host || !ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = true;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let seed = 92741;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const particles: Particle[] = Array.from({ length: 1450 }, () => ({
      x: random(),
      depth: random(),
      phase: random() * TAU,
      size: 0.55 + random() * 0.75,
      hue: random(),
    }));

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    };

    const onPointer = (event: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      targetY = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    };
    const resetPointer = () => { targetX = 0.5; targetY = 0.5; };

    const draw = (time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#02040a');
      gradient.addColorStop(0.56, '#02040a');
      gradient.addColorStop(1, '#07132c');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const centerX = width * (0.5 + (pointerX - 0.5) * 0.07);
      const centerY = height * 0.82;
      const aura = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.72);
      aura.addColorStop(0, 'rgba(56,189,248,0.12)');
      aura.addColorStop(0.5, 'rgba(99,102,241,0.055)');
      aura.addColorStop(1, 'rgba(7,19,44,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, height * 0.4, width, height * 0.6);

      // Three restrained color batches keep the draw loop inexpensive.
      const colors = ['rgba(56,189,248,', 'rgba(129,140,248,', 'rgba(168,85,247,'];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const x = p.x * width;
        const base = height * (0.72 + p.depth * 0.075);
        const amplitude = height * (0.045 + p.depth * 0.065);
        const wave = Math.sin(p.x * 9.2 + time * 0.52 + p.phase) * amplitude
          + Math.sin(p.x * 17.5 - time * 0.31 + p.phase * 0.55) * amplitude * 0.2;
        const y = base + wave + (pointerY - 0.5) * height * 0.018
          + (pointerX - 0.5) * (p.x - 0.5) * height * 0.028;
        if (y < height * 0.43 || y > height + 5) continue;
        const ridge = 0.5 + 0.5 * Math.sin(p.x * 9.2 + time * 0.52 + p.phase);
        const alpha = 0.14 + ridge * 0.32 * (0.35 + p.depth * 0.65);
        const colorIndex = p.hue > 0.82 ? 2 : p.hue > 0.52 ? 1 : 0;
        ctx.fillStyle = colors[colorIndex] + alpha.toFixed(3) + ')';
        const radius = p.size * (0.7 + p.depth * 0.35);
        ctx.fillRect(x, y, radius, radius);
      }

      // Small, soft bokeh points; no canvas blur or expensive shadow effects.
      for (let i = 0; i < 18; i++) {
        const phase = i * 1.71;
        const x = ((i * 0.61803398875) % 1) * width + Math.sin(time * 0.12 + phase) * 9;
        const y = height * (0.52 + ((i * 0.754877666) % 1) * 0.44)
          - ((time * (0.008 + (i % 4) * 0.002)) % 0.16) * height;
        const radius = 1.2 + (i % 4) * 0.8;
        const hue = i % 3 === 0 ? '56,189,248' : i % 3 === 1 ? '129,140,248' : '168,85,247';
        ctx.fillStyle = 'rgba(' + hue + ',0.22)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const schedule = () => {
      if (!visible || document.hidden || reducedMotion || raf) return;
      raf = requestAnimationFrame(frame);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - lastFrame < 32) {
        schedule();
        return;
      }
      const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
      lastFrame = now;
      elapsed += dt;
      pointerX += (targetX - pointerX) * (1 - Math.exp(-dt * 2.8));
      pointerY += (targetY - pointerY) * (1 - Math.exp(-dt * 2.8));
      draw(elapsed);
      schedule();
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        lastFrame = 0;
        schedule();
      } else {
        stop();
      }
    });
    observer.observe(host);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('mousemove', onPointer, { passive: true });
    window.addEventListener('blur', resetPointer);
    resize();

    if (!reducedMotion) schedule();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('mousemove', onPointer);
      window.removeEventListener('blur', resetPointer);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
