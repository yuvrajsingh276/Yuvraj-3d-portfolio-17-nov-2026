import { useEffect, useRef } from 'react';

type StarPoint = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  alpha: number;
  hasTwin: boolean;
  twinDx: number;
  twinDy: number;
  tint: string;
};

const TAU = Math.PI * 2;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Cosmic indigo-violet starfield backdrop with star doublets and lower planetary horizon aura
 * matching the Earth orbital reference aesthetic.
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
    let pointerInside = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let seed = 64219;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const starTints = ['rgba(255,255,255,', 'rgba(226,232,255,', 'rgba(216,204,255,'];
    const stars: StarPoint[] = Array.from({ length: 165 }, (_, i) => ({
      x: random(),
      y: random(),
      radius: 0.75 + random() * 0.95,
      phase: random() * TAU,
      alpha: 0.42 + random() * 0.48,
      hasTwin: i % 3 === 0,
      twinDx: (random() > 0.5 ? 1 : -1) * (5 + random() * 9),
      twinDy: (random() - 0.5) * 9,
      tint: starTints[i % starTints.length],
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
      pointerInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
    };
    const resetPointer = () => {
      targetX = 0.5;
      targetY = 0.5;
      pointerInside = false;
    };

    const draw = (time: number) => {
      // Deep cosmic indigo-violet midnight gradient matching attached planet orbit reference
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0a091d');
      skyGrad.addColorStop(0.32, '#100f2e');
      skyGrad.addColorStop(0.68, '#171342');
      skyGrad.addColorStop(1, '#080718');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle violet-indigo atmospheric sky bloom rising behind Earth horizon
      const shiftX = (pointerX - 0.5) * width * 0.035;
      const horizonAura = ctx.createRadialGradient(
        width * 0.5 + shiftX,
        height * 0.72,
        width * 0.04,
        width * 0.5 + shiftX,
        height * 0.72,
        Math.max(width, height) * 0.58
      );
      horizonAura.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
      horizonAura.addColorStop(0.36, 'rgba(99, 76, 214, 0.14)');
      horizonAura.addColorStop(0.7, 'rgba(34, 28, 86, 0.06)');
      horizonAura.addColorStop(1, 'rgba(10, 9, 29, 0)');
      ctx.fillStyle = horizonAura;
      ctx.fillRect(0, 0, width, height);

      // Gentle upper subtle indigo sheen behind hero headline
      const topGlow = ctx.createRadialGradient(
        width * 0.5 + shiftX * 0.6,
        height * 0.18,
        0,
        width * 0.5,
        height * 0.22,
        Math.max(width, height) * 0.55
      );
      topGlow.addColorStop(0, 'rgba(86, 75, 196, 0.16)');
      topGlow.addColorStop(0.55, 'rgba(38, 32, 98, 0.06)');
      topGlow.addColorStop(1, 'rgba(10, 9, 29, 0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      // Interactive pointer aura
      if (pointerInside) {
        const px = targetX * width;
        const py = targetY * height;
        const cursorRadius = Math.min(width, height) * 0.2;
        const cursorGlow = ctx.createRadialGradient(px, py, 0, px, py, cursorRadius);
        cursorGlow.addColorStop(0, 'rgba(167, 139, 250, 0.13)');
        cursorGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)');
        cursorGlow.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(px - cursorRadius, py - cursorRadius, cursorRadius * 2, cursorRadius * 2);
      }

      // Crisp pinpoint stars + binary star pairs (softened inside upper text reading zone)
      const parallaxX = (pointerX - 0.5) * 14;
      const parallaxY = (pointerY - 0.5) * 10;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const inTextSafeZone = s.y < 0.37 && Math.abs(s.x - 0.5) < 0.34;
        const zoneDim = inTextSafeZone ? 0.34 : 1.0;
        const twinkle = reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(time * 1.15 + s.phase);
        const sx = s.x * width + parallaxX * (0.4 + s.radius * 0.5);
        const sy = s.y * height + parallaxY * (0.4 + s.radius * 0.5);

        ctx.fillStyle = `${s.tint}${(s.alpha * twinkle * zoneDim).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.radius, 0, TAU);
        ctx.fill();

        if (s.hasTwin) {
          ctx.fillStyle = `${s.tint}${(s.alpha * 0.78 * twinkle * zoneDim).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx + s.twinDx, sy + s.twinDy, Math.max(0.65, s.radius * 0.78), 0, TAU);
          ctx.fill();
        }
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

    const updateScrollVisibility = () => {
      const nextVisible = window.scrollY < (window.innerHeight || 900) * 1.05;
      if (nextVisible === visible) return;
      visible = nextVisible;
      if (visible) {
        lastFrame = 0;
        schedule();
      } else {
        stop();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && window.scrollY < (window.innerHeight || 900) * 1.05;
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
    window.addEventListener('scroll', updateScrollVisibility, { passive: true });
    window.addEventListener('mousemove', onPointer, { passive: true });
    window.addEventListener('blur', resetPointer);
    resize();

    if (!reducedMotion && visible) schedule();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('scroll', updateScrollVisibility);
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
