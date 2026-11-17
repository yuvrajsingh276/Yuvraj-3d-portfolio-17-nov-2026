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
    const gridCellSize = 108;
    let gridCols = 1;
    let gridRows = 1;
    let gridOpacity: number[] = [];
    let gridTarget: number[] = [];
    let nextGridChange = 0;
    const gridParticles = Array.from({ length: 16 }, (_, i) => ({
      progress: (i * 0.61803398875) % 1,
      speed: 0.025 + random() * 0.045,
      row: Math.floor(random() * 12),
      horizontal: random() > 0.5,
      phase: random() * TAU,
    }));

    const rebuildGrid = () => {
      gridCols = Math.ceil(width / gridCellSize);
      gridRows = Math.ceil(height / gridCellSize);
      const count = gridCols * gridRows;
      gridOpacity = Array.from({ length: count }, () => random() * 0.018);
      gridTarget = gridOpacity.slice();
      nextGridChange = 0;
    };

    const particles: Particle[] = Array.from({ length: 3200 }, () => ({
      x: random(),
      depth: random(),
      phase: random() * TAU,
      size: 0.65 + random() * 1.05,
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
      rebuildGrid();
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
      gradient.addColorStop(0, '#07101f');
      gradient.addColorStop(0.32, '#09152b');
      gradient.addColorStop(0.68, '#0a1730');
      gradient.addColorStop(1, '#071329');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const centerX = width * (0.5 + (pointerX - 0.5) * 0.07);
      const centerY = height * 0.62;
      const aura = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.9);
      aura.addColorStop(0, 'rgba(56,189,248,0.15)');
      aura.addColorStop(0.5, 'rgba(99,102,241,0.085)');
      aura.addColorStop(1, 'rgba(7,19,44,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // Fine grid: low-contrast cells fade between filled and empty states.
      if (time >= nextGridChange) {
        for (let i = 0; i < gridTarget.length; i++) {
          gridTarget[i] = random() > 0.64 ? 0.045 + random() * 0.018 : 0.002 + random() * 0.012;
        }
        nextGridChange = time + 1.4 + random() * 1.5;
      }
      const cellW = width / Math.max(1, gridCols);
      const cellH = height / Math.max(1, gridRows);
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const index = row * gridCols + col;
          const current = gridOpacity[index] ?? 0;
          const target = gridTarget[index] ?? 0;
          const next = current + (target - current) * 0.035;
          gridOpacity[index] = next;
          if (next > 0.009) {
            ctx.fillStyle = `rgba(112,145,205,${next.toFixed(3)})`;
            ctx.fillRect(col * cellW + 1, row * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }

      // Delicate grid lines with a restrained 5% contrast shift.
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = 'rgba(135,160,205,0.052)';
      ctx.beginPath();
      for (let col = 0; col <= gridCols; col++) {
        const x = col * cellW;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let row = 0; row <= gridRows; row++) {
        const y = row * cellH;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Tiny light points glide along selected grid lines.
      for (let i = 0; i < gridParticles.length; i++) {
        const p = gridParticles[i];
        p.progress = (p.progress + p.speed / 30) % 1;
        const horizontal = p.horizontal;
        const x = horizontal ? p.progress * width : ((p.row % gridCols) + 0.5) * cellW;
        const y = horizontal ? ((p.row % gridRows) + 0.5) * cellH : p.progress * height;
        const pulse = 0.45 + 0.35 * Math.sin(time * 1.7 + p.phase);
        ctx.fillStyle = `rgba(133,190,255,${pulse.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.05, 0, TAU);
        ctx.fill();
      }

      // Three restrained color batches keep the draw loop inexpensive.
      const colors = ['rgba(56,189,248,', 'rgba(129,140,248,', 'rgba(168,85,247,'];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const x = p.x * width;
        const base = height * (0.39 + p.depth * 0.34);
        const amplitude = height * (0.035 + p.depth * 0.055);
        const wave = Math.sin(p.x * 9.2 + time * 0.52 + p.phase) * amplitude
          + Math.sin(p.x * 17.5 - time * 0.31 + p.phase * 0.55) * amplitude * 0.2;
        const y = base + wave + (pointerY - 0.5) * height * 0.018
          + (pointerX - 0.5) * (p.x - 0.5) * height * 0.028;
        if (y < height * 0.25 || y > height * 0.9) continue;
        const ridge = 0.5 + 0.5 * Math.sin(p.x * 9.2 + time * 0.52 + p.phase);
        const alpha = 0.22 + ridge * 0.42 * (0.35 + p.depth * 0.65);
        const colorIndex = p.hue > 0.82 ? 2 : p.hue > 0.52 ? 1 : 0;
        ctx.fillStyle = colors[colorIndex] + alpha.toFixed(3) + ')';
        const radius = p.size * (0.75 + p.depth * 0.5);
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
