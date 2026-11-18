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
    let pointerInside = false;
    const glowTrail: { x: number; y: number; born: number; hue: number }[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let seed = 92741;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const gridCellSize = 34;
    let gridCols = 1;
    let gridRows = 1;
    const rebuildGrid = () => {
      gridCols = Math.ceil(width / gridCellSize);
      gridRows = Math.ceil(height / gridCellSize);
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
      pointerInside = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (pointerInside) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const last = glowTrail[glowTrail.length - 1];
        if (!last || Math.hypot(x - last.x, y - last.y) > 12) {
          glowTrail.push({ x, y, born: elapsed, hue: glowTrail.length % 3 });
          if (glowTrail.length > 18) glowTrail.shift();
        }
      }
    };
    const resetPointer = () => { targetX = 0.5; targetY = 0.5; pointerInside = false; };

    const draw = (time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#010207');
      gradient.addColorStop(0.32, '#01040b');
      gradient.addColorStop(0.68, '#020510');
      gradient.addColorStop(1, '#010207');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const centerX = width * (0.5 + (pointerX - 0.5) * 0.07);
      const centerY = height * 0.62;
      const aura = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.9);
      aura.addColorStop(0, 'rgba(56,189,248,0.055)');
      aura.addColorStop(0.5, 'rgba(139,92,246,0.032)');
      aura.addColorStop(1, 'rgba(1,2,7,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // Fine static purple-tinted micro grid
      const cellW = width / Math.max(1, gridCols);
      const cellH = height / Math.max(1, gridRows);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(148,136,210,0.052)';
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

      // Prune expired hover trail points
      for (let i = glowTrail.length - 1; i >= 0; i--) {
        if (time - glowTrail[i].born > 1.9) {
          glowTrail.splice(i, 1);
        }
      }

      // Small purple cubic grid highlight & glowing borders around cursor + fading trail
      const activeSources: { x: number; y: number; weight: number; hue: number }[] = [];
      if (pointerInside) {
        activeSources.push({ x: targetX * width, y: targetY * height, weight: 1.0, hue: 0 });
      }
      for (let i = 0; i < glowTrail.length; i++) {
        const point = glowTrail[i];
        const age = time - point.born;
        const fade = Math.pow(Math.max(0, 1 - age / 1.9), 1.45);
        if (fade > 0.02) {
          activeSources.push({ x: point.x, y: point.y, weight: fade * 0.85, hue: point.hue });
        }
      }

      if (activeSources.length > 0) {
        const influenceRadius = Math.max(cellW, cellH) * 4.4;
        const padCols = Math.ceil(influenceRadius / Math.max(1, cellW));
        const padRows = Math.ceil(influenceRadius / Math.max(1, cellH));
        let minCol = gridCols - 1;
        let maxCol = 0;
        let minRow = gridRows - 1;
        let maxRow = 0;
        for (let i = 0; i < activeSources.length; i++) {
          const sc = Math.floor(activeSources[i].x / Math.max(1, cellW));
          const sr = Math.floor(activeSources[i].y / Math.max(1, cellH));
          if (sc - padCols < minCol) minCol = sc - padCols;
          if (sc + padCols > maxCol) maxCol = sc + padCols;
          if (sr - padRows < minRow) minRow = sr - padRows;
          if (sr + padRows > maxRow) maxRow = sr + padRows;
        }
        minCol = Math.max(0, minCol);
        maxCol = Math.min(gridCols - 1, maxCol);
        minRow = Math.max(0, minRow);
        maxRow = Math.min(gridRows - 1, maxRow);

        const cellColors = ['168,85,247', '139,92,246', '192,132,252'];
        ctx.lineWidth = 1;
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            const cx = (col + 0.5) * cellW;
            const cy = (row + 0.5) * cellH;
            let glow = 0;
            let hue = 0;
            for (let i = 0; i < activeSources.length; i++) {
              const src = activeSources[i];
              const distance = Math.hypot(cx - src.x, cy - src.y);
              if (distance >= influenceRadius) continue;
              const falloff = 1 - distance / influenceRadius;
              const strength = falloff * falloff * src.weight;
              if (strength > glow) {
                glow = strength;
                hue = src.hue;
              }
            }
            if (glow > 0.015) {
              const rgb = cellColors[hue % cellColors.length];
              const x0 = col * cellW + 0.75;
              const y0 = row * cellH + 0.75;
              const cw = Math.max(1, cellW - 1.5);
              const ch = Math.max(1, cellH - 1.5);
              ctx.fillStyle = `rgba(${rgb},${(glow * 0.24).toFixed(3)})`;
              ctx.fillRect(x0, y0, cw, ch);
              ctx.strokeStyle = `rgba(216,180,254,${(glow * 0.42).toFixed(3)})`;
              ctx.strokeRect(x0, y0, cw, ch);
            }
          }
        }
      }

      // Soft purple glow halo under active pointer and recent trail
      if (pointerInside) {
        const px = targetX * width;
        const py = targetY * height;
        const cursorRadius = Math.min(width, height) * 0.2;
        const cursorGlow = ctx.createRadialGradient(px, py, 0, px, py, cursorRadius);
        cursorGlow.addColorStop(0, 'rgba(168,85,247,0.22)');
        cursorGlow.addColorStop(0.45, 'rgba(139,92,246,0.095)');
        cursorGlow.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(px - cursorRadius, py - cursorRadius, cursorRadius * 2, cursorRadius * 2);
      }

      for (let i = 0; i < glowTrail.length; i++) {
        const point = glowTrail[i];
        const age = time - point.born;
        const fade = Math.pow(Math.max(0, 1 - age / 1.9), 1.4);
        if (fade <= 0.02) continue;
        const radius = Math.min(width, height) * (0.11 + age * 0.028);
        const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        const color = point.hue === 1 ? '139,92,246' : '168,85,247';
        glow.addColorStop(0, `rgba(${color},${(0.14 * fade).toFixed(3)})`);
        glow.addColorStop(0.45, `rgba(${color},${(0.06 * fade).toFixed(3)})`);
        glow.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      }

      // Three restrained color batches keep the draw loop inexpensive.
      const colors = ['rgba(56,189,248,', 'rgba(129,140,248,', 'rgba(168,85,247,'];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Each particle travels from the distant horizon toward the viewer,
        // expanding outward and growing as its simulated Z-depth approaches camera.
        const depthFlow = (p.depth + time * (0.035 + p.depth * 0.025)) % 1;
        const depthScale = 0.38 + depthFlow * 1.55;
        const perspectiveSpread = 0.18 + depthFlow * 1.42;
        const drift = Math.sin(time * (0.16 + depthFlow * 0.12) + p.phase) * (2 + depthFlow * 8);
        let x = width * 0.5 + (p.x - 0.5) * width * perspectiveSpread + drift;
        const base = height * (0.16 + depthFlow * 0.78);
        const amplitude = height * (0.006 + depthFlow * 0.032);
        const wave = Math.sin(p.x * 9.2 + time * (0.52 + depthFlow * 0.18) + p.phase) * amplitude
          + Math.sin(p.x * 17.5 - time * 0.31 + p.phase * 0.55) * amplitude * 0.2;
        let y = base + wave
          + (pointerY - 0.5) * height * 0.025 * depthScale
          + (pointerX - 0.5) * (p.x - 0.5) * height * 0.035 * depthScale;
        // Cursor repulsion: particles smoothly scatter away from the pointer's local sector.
        if (pointerInside) {
          const dx = x - pointerX * width;
          const dy = y - pointerY * height;
          const distance = Math.hypot(dx, dy);
          const repelRadius = Math.min(width, height) * 0.22;
          if (distance < repelRadius && distance > 0.001) {
            const falloff = 1 - distance / repelRadius;
            const force = falloff * falloff * 54;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
          }
        }
        if (y < height * 0.04 || y > height * 0.98) continue;
        const ridge = 0.5 + 0.5 * Math.sin(p.x * 9.2 + time * 0.52 + p.phase);
        const alpha = 0.07 + ridge * 0.28 * (0.25 + depthFlow * 0.75);
        const colorIndex = p.hue > 0.82 ? 2 : p.hue > 0.52 ? 1 : 0;
        ctx.fillStyle = colors[colorIndex] + alpha.toFixed(3) + ')';
        const radius = p.size * depthScale;
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
