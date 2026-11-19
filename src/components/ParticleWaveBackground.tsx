import { useEffect, useRef } from 'react';

type StarPoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  twinkleSpeed: number;
  alpha: number;
  hasTwin: boolean;
  twinDx: number;
  twinDy: number;
  tint: string;
};

type ShootingStar = {
  startX: number;
  startY: number;
  dirX: number;
  dirY: number;
  travelFrac: number;
  tailPx: number;
  durationSec: number;
  ageSec: number;
  delaySec: number;
  colorRgb: string;
  thickness: number;
};

const TAU = Math.PI * 2;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const wrap01 = (v: number) => ((v % 1) + 1) % 1;

/**
 * Cosmic sky starfield backdrop with densely moving particles, binary star pairs,
 * and randomly streaking shooting stars with glowing tapered tails.
 */
export function ParticleWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: true });
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

    const starTints = [
      'rgba(255,255,255,',
      'rgba(226,232,255,',
      'rgba(216,204,255,',
      'rgba(191,219,254,',
      'rgba(254,243,199,',
    ];

    // Dense moving sky particles across upper & mid sky
    const stars: StarPoint[] = Array.from({ length: 340 }, (_, i) => {
      const speedLayer = 0.4 + random() * 1.1;
      const angle = random() * TAU;
      return {
        x: random(),
        y: random(),
        vx: Math.cos(angle) * 0.0042 * speedLayer,
        vy: (Math.sin(angle) * 0.0026 - 0.0022) * speedLayer,
        radius: 0.6 + random() * 1.15,
        phase: random() * TAU,
        twinkleSpeed: 0.9 + random() * 1.9,
        alpha: 0.32 + random() * 0.6,
        hasTwin: i % 5 === 0,
        twinDx: (random() > 0.5 ? 1 : -1) * (5 + random() * 9),
        twinDy: (random() - 0.5) * 9,
        tint: starTints[i % starTints.length],
      };
    });

    // Rare, delicate shooting stars gliding strictly across the upper sky (L->R or R->L, never downward)
    const meteorPalette = [
      '255, 255, 255',
      '196, 228, 255',
      '224, 202, 255',
      '255, 242, 216',
    ];

    const createShootingStar = (initialDelay: number): ShootingStar => {
      // Sweep horizontally or gently upward left-to-right or right-to-left (never downward)
      const goingRight = random() > 0.5;
      const slightUpAngle = 0.015 + random() * 0.13; // ~1deg to 8.5deg gently upward/flat
      const angleRad = goingRight
        ? -slightUpAngle
        : Math.PI + slightUpAngle;

      const startX = goingRight
        ? 0.04 + random() * 0.48
        : 0.48 + random() * 0.48;
      // Keep trajectories strictly in the upper sky above the orbital rings
      const startY = 0.08 + random() * 0.28;

      return {
        startX,
        startY,
        dirX: Math.cos(angleRad),
        dirY: Math.sin(angleRad),
        travelFrac: 0.24 + random() * 0.22,
        tailPx: 105 + random() * 115,
        durationSec: 0.9 + random() * 0.55,
        ageSec: -initialDelay,
        delaySec: 2.8 + random() * 4.2,
        colorRgb: meteorPalette[Math.floor(random() * meteorPalette.length)],
        thickness: 0.62 + random() * 0.34,
      };
    };

    // ~30% of prior frequency: only 2 calm staggered slots with generous random cooldowns
    const shootingStars: ShootingStar[] = [
      createShootingStar(0.35),
      createShootingStar(3.6),
    ];

    const respawnShootingStar = (m: ShootingStar) => {
      const next = createShootingStar(2.6 + random() * 4.4);
      m.startX = next.startX;
      m.startY = next.startY;
      m.dirX = next.dirX;
      m.dirY = next.dirY;
      m.travelFrac = next.travelFrac;
      m.tailPx = next.tailPx;
      m.durationSec = next.durationSec;
      m.ageSec = next.ageSec;
      m.delaySec = next.delaySec;
      m.colorRgb = next.colorRgb;
      m.thickness = next.thickness;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0, 0);
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

    const drawShootingStar = (
      hx: number,
      hy: number,
      dirX: number,
      dirY: number,
      tailLen: number,
      alpha: number,
      rgb: string,
      thickness: number
    ) => {
      if (alpha <= 0.015 || tailLen < 4) return;
      const tx = hx - dirX * tailLen;
      const ty = hy - dirY * tailLen;
      const perpX = -dirY;
      const perpY = dirX;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // 1. Wide luminous outer bloom haze along the fine shooting star trail
      const outerHaze = ctx.createLinearGradient(tx, ty, hx, hy);
      outerHaze.addColorStop(0, `rgba(${rgb}, 0)`);
      outerHaze.addColorStop(0.45, `rgba(${rgb}, ${(0.18 * alpha).toFixed(3)})`);
      outerHaze.addColorStop(0.85, `rgba(${rgb}, ${(0.46 * alpha).toFixed(3)})`);
      outerHaze.addColorStop(1, `rgba(255, 255, 255, ${(0.65 * alpha).toFixed(3)})`);
      ctx.strokeStyle = outerHaze;
      ctx.lineWidth = thickness * 6.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // 2. Concentrated inner glow sheath
      const midGlow = ctx.createLinearGradient(tx, ty, hx, hy);
      midGlow.addColorStop(0, `rgba(${rgb}, 0)`);
      midGlow.addColorStop(0.5, `rgba(${rgb}, ${(0.34 * alpha).toFixed(3)})`);
      midGlow.addColorStop(1, `rgba(255, 255, 255, ${(0.88 * alpha).toFixed(3)})`);
      ctx.strokeStyle = midGlow;
      ctx.lineWidth = thickness * 2.8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // 3. Razor-thin incandescent tapered tail core
      const tailGrad = ctx.createLinearGradient(tx, ty, hx, hy);
      tailGrad.addColorStop(0, `rgba(${rgb}, 0)`);
      tailGrad.addColorStop(0.42, `rgba(${rgb}, ${(0.42 * alpha).toFixed(3)})`);
      tailGrad.addColorStop(0.82, `rgba(255, 255, 255, ${(0.92 * alpha).toFixed(3)})`);
      tailGrad.addColorStop(1, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
      const halfW = thickness * 0.65;
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx + perpX * halfW, hy + perpY * halfW);
      ctx.lineTo(hx + dirX * (thickness * 1.8), hy + dirY * (thickness * 1.8));
      ctx.lineTo(hx - perpX * halfW, hy - perpY * halfW);
      ctx.closePath();
      ctx.fill();

      // 4. Radiant luminous head bloom halo
      const headAuraR = thickness * 11.5;
      const headHalo = ctx.createRadialGradient(hx, hy, 0, hx, hy, headAuraR);
      headHalo.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, 0.98 * alpha).toFixed(3)})`);
      headHalo.addColorStop(0.22, `rgba(${rgb}, ${(0.56 * alpha).toFixed(3)})`);
      headHalo.addColorStop(0.55, `rgba(${rgb}, ${(0.18 * alpha).toFixed(3)})`);
      headHalo.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = headHalo;
      ctx.beginPath();
      ctx.arc(hx, hy, headAuraR, 0, TAU);
      ctx.fill();

      // 5. Crisp bright pinpoint star core
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(hx, hy, Math.max(0.95, thickness * 1.25), 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    const draw = (time: number, dt: number) => {
      ctx.clearRect(0, 0, width, height);

      // Interactive pointer aura
      if (pointerInside) {
        const px = targetX * width;
        const py = targetY * height;
        const cursorRadius = Math.min(width, height) * 0.2;
        const cursorGlow = ctx.createRadialGradient(px, py, 0, px, py, cursorRadius);
        cursorGlow.addColorStop(0, 'rgba(167, 139, 250, 0.12)');
        cursorGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.045)');
        cursorGlow.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(px - cursorRadius, py - cursorRadius, cursorRadius * 2, cursorRadius * 2);
      }

      const parallaxX = (pointerX - 0.5) * 16;
      const parallaxY = (pointerY - 0.5) * 11;
      const isCompact = width < 640;

      // 1. Moving sky stardust particles + binary star pairs
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const nx = reducedMotion ? s.x : wrap01(s.x + s.vx * time + Math.sin(time * 0.25 + s.phase) * 0.0025);
        const ny = reducedMotion ? s.y : wrap01(s.y + s.vy * time + Math.cos(time * 0.22 + s.phase) * 0.002);

        const inTextSafeZone = ny > 0.12 && ny < 0.40 && Math.abs(nx - 0.5) < (isCompact ? 0.42 : 0.30);
        const zoneDim = inTextSafeZone ? 0.34 : 1.0;
        const twinkle = reducedMotion ? 1 : 0.52 + 0.48 * Math.sin(time * s.twinkleSpeed + s.phase);
        const sx = nx * width + parallaxX * (0.35 + s.radius * 0.55);
        const sy = ny * height + parallaxY * (0.35 + s.radius * 0.55);

        ctx.fillStyle = `${s.tint}${(s.alpha * twinkle * zoneDim).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.radius, 0, TAU);
        ctx.fill();

        if (s.hasTwin) {
          ctx.fillStyle = `${s.tint}${(s.alpha * 0.72 * twinkle * zoneDim).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx + s.twinDx, sy + s.twinDy, Math.max(0.55, s.radius * 0.74), 0, TAU);
          ctx.fill();
        }
      }

      // 2. Sparse, thin, extra-glowing shooting stars gliding across the upper sky
      const travelScale = Math.max(width, height);
      const mobileTailMult = isCompact ? 0.65 : 1.0;

      if (reducedMotion) {
        drawShootingStar(width * 0.24, height * 0.16, 0.99, -0.07, 115 * mobileTailMult, 0.62, '208, 232, 255', 0.8);
        return;
      }

      for (let i = 0; i < shootingStars.length; i++) {
        const m = shootingStars[i];
        m.ageSec += dt;

        if (m.ageSec < 0) continue;
        if (m.ageSec > m.durationSec) {
          respawnShootingStar(m);
          continue;
        }

        const p = clamp(m.ageSec / m.durationSec, 0, 1);
        const easeP = 1 - Math.pow(1 - p, 1.4);
        const distPx = m.travelFrac * travelScale * easeP;

        const hx = m.startX * width + m.dirX * distPx + parallaxX * 0.8;
        const hy = m.startY * height + m.dirY * distPx + parallaxY * 0.8;

        const fadeIn = clamp(p / 0.14, 0, 1);
        const fadeOut = clamp((1 - p) / 0.30, 0, 1);
        const lifeAlpha = fadeIn * fadeOut;

        // Softly attenuate only if crossing directly behind hero headline text
        const nx = hx / Math.max(1, width);
        const ny = hy / Math.max(1, height);
        const behindHeadline = ny > 0.14 && ny < 0.34 && Math.abs(nx - 0.5) < (isCompact ? 0.38 : 0.22);
        const textSafeMult = behindHeadline ? 0.5 : 1.0;

        const tailEnvelope = clamp(p / 0.18, 0.25, 1) * (0.48 + 0.52 * fadeOut);
        const tailLen = m.tailPx * mobileTailMult * tailEnvelope;

        drawShootingStar(
          hx,
          hy,
          m.dirX,
          m.dirY,
          tailLen,
          lifeAlpha * 0.98 * textSafeMult,
          m.colorRgb,
          m.thickness * (isCompact ? 0.88 : 1.0)
        );
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
      draw(elapsed, dt);
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
