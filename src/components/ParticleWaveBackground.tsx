import { useEffect, useRef } from 'react';

type Dot = { x: number; depth: number; phase: number; size: number; tint: number };
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function ParticleWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !host || !ctx) return;

    let width = 1, height = 1, dpr = 1, raf = 0, last = 0, time = 0;
    let pointerX = 0.5, pointerY = 0.5, targetX = 0.5, targetY = 0.5;
    let grainPattern: CanvasPattern | null = null;

    const makeDots = (count: number, seed: number): Dot[] => {
      let s = seed;
      const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      return Array.from({ length: count }, () => ({ x: rand(), depth: rand(), phase: rand() * TAU, size: 0.45 + rand() * 0.7, tint: rand() }));
    };
    const frontDots = makeDots(16000, 7841);
    const backDots = makeDots(6200, 1827);
    const orbs = Array.from({ length: 42 }, (_, i) => ({
      x: (i * 0.61803398875) % 1,
      y: 0.48 + ((i * 0.754877666) % 1) * 0.48,
      r: 2 + ((i * 7) % 22) / 1.2,
      speed: 0.008 + ((i * 13) % 9) * 0.0015,
      phase: i * 1.71,
      hue: i % 3,
    }));

    const createGrain = () => {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 160;
      const g = tile.getContext('2d');
      if (!g) return;
      const data = g.createImageData(160, 160);
      for (let i = 0; i < data.data.length; i += 4) {
        const n = Math.random() * 255;
        data.data[i] = data.data[i + 1] = data.data[i + 2] = n;
        data.data[i + 3] = 20;
      }
      g.putImageData(data, 0, 0);
      grainPattern = ctx.createPattern(tile, 'repeat');
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createGrain();
    };
    const onPointer = (event: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      targetY = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    };
    const onLeave = () => { targetX = 0.5; targetY = 0.5; };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener('mousemove', onPointer, { passive: true });
    window.addEventListener('blur', onLeave);
    resize();

    const waveY = (x: number, depth: number, phase: number, t: number, layer: number) => {
      const base = height * (layer === 0 ? 0.79 : 0.69);
      const amp = height * (layer === 0 ? 0.115 : 0.09) * (0.45 + depth * 0.75);
      const parallax = (pointerY - 0.5) * height * (layer === 0 ? 0.025 : 0.014);
      const tilt = (pointerX - 0.5) * (x - 0.5) * height * 0.045;
      return base + depth * height * (layer === 0 ? 0.07 : 0.02)
        + Math.sin(x * 9.2 + t * 0.52 + phase) * amp
        + Math.sin(x * 17.5 - t * 0.31 + phase * 0.55) * amp * 0.23
        + Math.sin(x * 4.1 - t * 0.22) * height * 0.018 + parallax + tilt;
    };

    const drawWave = (dots: Dot[], layer: number, t: number) => {
      const isBack = layer === 1;
      ctx.save();
      if (isBack) ctx.filter = 'blur(5px)';
      for (const p of dots) {
        const y = waveY(p.x, p.depth, p.phase, t, layer);
        const yy = y + (p.depth - 0.5) * height * (isBack ? 0.19 : 0.205);
        if (yy < height * 0.43 || yy > height + 8) continue;
        const ridge = 0.5 + 0.5 * Math.sin(p.x * 9.2 + t * 0.52 + p.phase);
        const alpha = (isBack ? 0.12 : 0.26 + ridge * 0.43) * (0.28 + p.depth * 0.72);
        const color = p.tint > 0.82 ? '168,85,247' : p.tint > 0.55 ? '129,140,248' : p.tint > 0.2 ? '56,189,248' : '224,242,254';
        ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x * width, yy, p.size * (isBack ? 1.35 : 0.85), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    };

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const dt = Math.min(0.04, (now - (last || now)) / 1000);
      last = now;
      time += dt;
      pointerX += (targetX - pointerX) * (1 - Math.exp(-dt * 3.2));
      pointerY += (targetY - pointerY) * (1 - Math.exp(-dt * 3.2));

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#02040a');
      gradient.addColorStop(0.55, '#02040a');
      gradient.addColorStop(1, '#07132c');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const aura = ctx.createRadialGradient(width * (0.48 + (pointerX - 0.5) * 0.08), height * 0.82, 0, width * 0.5, height * 0.82, width * 0.72);
      aura.addColorStop(0, 'rgba(56,189,248,0.13)');
      aura.addColorStop(0.48, 'rgba(59,130,246,0.07)');
      aura.addColorStop(1, 'rgba(7,19,44,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, height * 0.43, width, height * 0.57);

      drawWave(backDots, 1, time);
      drawWave(frontDots, 0, time);

      for (const orb of orbs) {
        const y = height * (orb.y - ((time * orb.speed) % 0.42));
        const pulse = 0.55 + 0.45 * Math.sin(time * 0.7 + orb.phase);
        const x = width * orb.x + Math.sin(time * 0.18 + orb.phase) * 12 + (pointerX - 0.5) * 10;
        const color = orb.hue === 0 ? '56,189,248' : orb.hue === 1 ? '129,140,248' : '168,85,247';
        const glow = ctx.createRadialGradient(x, y, 0, x, y, orb.r * 2.6);
        glow.addColorStop(0, 'rgba(' + color + ',' + (0.20 * pulse) + ')');
        glow.addColorStop(1, 'rgba(' + color + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, orb.r * 2.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(' + color + ',' + (0.22 * pulse) + ')';
        ctx.beginPath();
        ctx.arc(x, y, orb.r * 0.42, 0, TAU);
        ctx.fill();
      }

      if (grainPattern) {
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) render(0);
    else raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('mousemove', onPointer);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 h-full w-full overflow-hidden pointer-events-none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
