import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import {
  computeCursorState,
  parseBorderRadiusPx,
  type CursorTargetKind,
  type CursorTargetRect,
} from './cursorUtils';

interface CustomCursorProps {
  accentHex: string;
  accentGlow: string;
}

const INTERACTIVE_SELECTOR =
  'a[href], button:not(:disabled), [role="button"]:not([aria-disabled="true"]), [data-magnetic-cursor]';

const RING_POS_SPRING = { stiffness: 260, damping: 24, mass: 0.48 };
const RING_SIZE_SPRING = { stiffness: 310, damping: 26, mass: 0.42 };
const DOT_POS_SPRING = { stiffness: 680, damping: 38, mass: 0.22 };

export function CustomCursor({ accentHex, accentGlow }: CustomCursorProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [magneticMeta, setMagneticMeta] = useState<{
    isMagnetic: boolean;
    targetKind: CursorTargetKind;
  }>({ isMagnetic: false, targetKind: 'default' });

  const pointerRef = useRef({ x: -100, y: -100 });
  const pressedRef = useRef(false);
  const hoveredElRef = useRef<HTMLElement | null>(null);

  const targetRingX = useMotionValue(-100);
  const targetRingY = useMotionValue(-100);
  const targetDotX = useMotionValue(-100);
  const targetDotY = useMotionValue(-100);
  const targetW = useMotionValue(34);
  const targetH = useMotionValue(34);
  const targetRadius = useMotionValue(17);
  const targetScale = useMotionValue(1);

  const ringX = useSpring(targetRingX, RING_POS_SPRING);
  const ringY = useSpring(targetRingY, RING_POS_SPRING);
  const dotX = useSpring(targetDotX, DOT_POS_SPRING);
  const dotY = useSpring(targetDotY, DOT_POS_SPRING);
  const ringW = useSpring(targetW, RING_SIZE_SPRING);
  const ringH = useSpring(targetH, RING_SIZE_SPRING);
  const ringRadius = useSpring(targetRadius, RING_SIZE_SPRING);
  const ringScale = useSpring(targetScale, RING_SIZE_SPRING);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(pointer: fine)');
    const syncPointerMode = () => setIsFinePointer(mq.matches);
    syncPointerMode();
    mq.addEventListener('change', syncPointerMode);
    return () => mq.removeEventListener('change', syncPointerMode);
  }, []);

  const enabled = isFinePointer && !reducedMotion;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (enabled && isVisible) {
      root.classList.add('custom-cursor-active');
    } else {
      root.classList.remove('custom-cursor-active');
    }
    return () => {
      root.classList.remove('custom-cursor-active');
    };
  }, [enabled, isVisible]);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      hoveredElRef.current = null;
      return;
    }

    const applyCursorTargets = (
      x: number,
      y: number,
      el: HTMLElement | null,
      pressed: boolean,
      snapImmediately = false
    ) => {
      let rect: CursorTargetRect | null = null;
      if (el && el.isConnected) {
        const domRect = el.getBoundingClientRect();
        if (domRect.width > 0 && domRect.height > 0) {
          const computedRadius = parseBorderRadiusPx(getComputedStyle(el).borderRadius, 10);
          rect = {
            left: domRect.left,
            top: domRect.top,
            width: domRect.width,
            height: domRect.height,
            borderRadius: computedRadius,
          };
        }
      }

      const next = computeCursorState(x, y, rect, {
        isPressed: pressed,
        reducedMotion: false,
      });

      if (snapImmediately) {
        ringX.jump(next.ringX);
        ringY.jump(next.ringY);
        dotX.jump(next.dotX);
        dotY.jump(next.dotY);
      }

      targetRingX.set(next.ringX);
      targetRingY.set(next.ringY);
      targetDotX.set(next.dotX);
      targetDotY.set(next.dotY);
      targetW.set(next.width);
      targetH.set(next.height);
      targetRadius.set(next.borderRadius);
      targetScale.set(next.ringScale);

      setMagneticMeta((prev) =>
        prev.isMagnetic === next.isMagnetic && prev.targetKind === next.targetKind
          ? prev
          : { isMagnetic: next.isMagnetic, targetKind: next.targetKind }
      );
    };

    const resolveInteractive = (eventTarget: EventTarget | null): HTMLElement | null => {
      if (!(eventTarget instanceof Element)) return null;
      return eventTarget.closest<HTMLElement>(INTERACTIVE_SELECTOR);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const firstAppearance = !isVisible;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      const interactiveEl = resolveInteractive(e.target);
      hoveredElRef.current = interactiveEl;
      if (firstAppearance) setIsVisible(true);
      applyCursorTargets(
        e.clientX,
        e.clientY,
        interactiveEl,
        pressedRef.current,
        firstAppearance
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pressedRef.current = true;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      const interactiveEl = resolveInteractive(e.target) ?? hoveredElRef.current;
      hoveredElRef.current = interactiveEl;
      applyCursorTargets(e.clientX, e.clientY, interactiveEl, true);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pressedRef.current = false;
      const interactiveEl = resolveInteractive(e.target) ?? hoveredElRef.current;
      hoveredElRef.current = interactiveEl;
      applyCursorTargets(pointerRef.current.x, pointerRef.current.y, interactiveEl, false);
    };

    const onScroll = () => {
      if (!hoveredElRef.current) return;
      const { x, y } = pointerRef.current;
      const underPointer = document.elementFromPoint(x, y);
      const interactiveEl = resolveInteractive(underPointer);
      hoveredElRef.current = interactiveEl;
      applyCursorTargets(x, y, interactiveEl, pressedRef.current);
    };

    const onMouseLeave = () => {
      pressedRef.current = false;
      hoveredElRef.current = null;
      setIsVisible(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('blur', onMouseLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('blur', onMouseLeave);
    };
  }, [
    enabled,
    isVisible,
    ringX,
    ringY,
    dotX,
    dotY,
    targetRingX,
    targetRingY,
    targetDotX,
    targetDotY,
    targetW,
    targetH,
    targetRadius,
    targetScale,
  ]);

  if (!enabled || typeof document === 'undefined') return null;

  const isCompact = magneticMeta.targetKind === 'compact';
  const isCard = magneticMeta.targetKind === 'card';

  return createPortal(
    <div
      aria-hidden="true"
      data-testid="custom-cursor-layer"
      data-visible={String(isVisible)}
      data-magnetic={String(magneticMeta.isMagnetic)}
      data-target-kind={magneticMeta.targetKind}
      className="pointer-events-none fixed inset-0 z-[200] overflow-hidden transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Magnetic spring-dampened outer ring / adaptive halo */}
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="pointer-events-none fixed left-0 top-0 will-change-transform"
      >
        <motion.div
          data-testid="custom-cursor-ring"
          data-magnetic={String(magneticMeta.isMagnetic)}
          data-target-kind={magneticMeta.targetKind}
          style={{
            width: ringW,
            height: ringH,
            borderRadius: ringRadius,
            scale: ringScale,
            borderColor: magneticMeta.isMagnetic ? `${accentHex}d9` : `${accentHex}99`,
            backgroundColor: isCompact
              ? `${accentHex}14`
              : isCard
                ? `${accentHex}18`
                : 'transparent',
            boxShadow: magneticMeta.isMagnetic
              ? `0 0 22px ${accentGlow}`
              : `0 0 14px ${accentGlow}`,
          }}
          className="-translate-x-1/2 -translate-y-1/2 border-[1.5px] transition-[background-color,border-color,box-shadow] duration-200"
        />
      </motion.div>

      {/* Precision core pointer dot */}
      <motion.div
        style={{ x: dotX, y: dotY }}
        className="pointer-events-none fixed left-0 top-0 will-change-transform"
      >
        <span
          data-testid="custom-cursor-dot"
          style={{
            backgroundColor: accentHex,
            boxShadow: `0 0 10px ${accentGlow}`,
            opacity: isCompact ? 0.35 : 0.95,
            transform: `translate(-50%, -50%) scale(${isCompact ? 0.72 : isCard ? 1.15 : 1})`,
          }}
          className="block h-1.5 w-1.5 rounded-full transition-[opacity,transform,background-color] duration-150"
        />
      </motion.div>
    </div>,
    document.body
  );
}
