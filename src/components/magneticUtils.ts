export interface MagneticRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MagneticOptions {
  strength?: number;
  maxX?: number;
  maxY?: number;
  reducedMotion?: boolean;
}

export interface MagneticOffset {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Calculates damped cursor-attraction displacement relative to an element's center.
 */
export function computeMagneticOffset(
  cursorX: number,
  cursorY: number,
  rect: MagneticRect,
  options: MagneticOptions = {}
): MagneticOffset {
  const {
    strength = 0.36,
    maxX = 11,
    maxY = 7,
    reducedMotion = false,
  } = options;

  if (
    reducedMotion ||
    !Number.isFinite(cursorX) ||
    !Number.isFinite(cursorY) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return { x: 0, y: 0 };
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const rawX = (cursorX - centerX) * strength;
  const rawY = (cursorY - centerY) * strength;

  return {
    x: clamp(rawX, -maxX, maxX),
    y: clamp(rawY, -maxY, maxY),
  };
}
