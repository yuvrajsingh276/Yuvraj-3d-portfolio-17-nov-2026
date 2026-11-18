import { useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { computeMagneticOffset } from './magneticUtils';

interface MagneticNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  accentHex?: string;
  onClick: (e: ReactMouseEvent<HTMLAnchorElement>) => void;
}

const MAGNETIC_SPRING = { stiffness: 320, damping: 22, mass: 0.35 };

export function MagneticNavLink({
  href,
  label,
  isActive,
  accentHex = '#a78bfa',
  onClick,
}: MagneticNavLinkProps) {
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, MAGNETIC_SPRING);
  const springY = useSpring(targetY, MAGNETIC_SPRING);

  const handlePointerMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (reducedMotion || e.pointerType === 'touch') return;
    const node = linkRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const { x, y } = computeMagneticOffset(e.clientX, e.clientY, rect, {
      strength: 0.38,
      maxX: 11,
      maxY: 7,
      reducedMotion,
    });
    targetX.set(x);
    targetY.set(y);
  };

  const resetOffset = () => {
    targetX.set(0);
    targetY.set(0);
  };

  return (
    <a
      ref={linkRef}
      href={href}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetOffset}
      onPointerCancel={resetOffset}
      onBlur={resetOffset}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative inline-flex min-h-[40px] shrink-0 items-center px-2 whitespace-nowrap portfolio-meta font-medium tracking-[0.04em] transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-[#9aa5bd] hover:text-white'
      }`}
    >
      <motion.span
        style={{ x: springX, y: springY }}
        className="relative inline-flex items-center py-2 will-change-transform"
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          style={{ backgroundColor: accentHex }}
          className={`absolute inset-x-0 bottom-0.5 h-[1.5px] rounded-full transition-all duration-200 ${
            isActive
              ? 'scale-x-100 opacity-100'
              : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-65'
          }`}
        />
      </motion.span>
    </a>
  );
}
