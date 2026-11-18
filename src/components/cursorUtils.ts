export interface CursorTargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export type CursorTargetKind = 'default' | 'compact' | 'card';

export interface CursorStateOptions {
  defaultSize?: number;
  cardReticleSize?: number;
  compactMaxWidth?: number;
  compactMaxHeight?: number;
  compactPaddingX?: number;
  compactPaddingY?: number;
  isPressed?: boolean;
  reducedMotion?: boolean;
}

export interface CursorComputedState {
  ringX: number;
  ringY: number;
  dotX: number;
  dotY: number;
  width: number;
  height: number;
  borderRadius: number;
  isMagnetic: boolean;
  targetKind: CursorTargetKind;
  ringScale: number;
}

export function parseBorderRadiusPx(raw: string | null | undefined, fallback = 10): number {
  if (!raw) return fallback;
  const match = raw.trim().match(/^([0-9]+(?:\.[0-9]+)?)px/);
  if (!match) return fallback;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Computes spring target coordinates, morph dimensions, and magnetic state
 * for the dual-layer custom cursor (outer magnetic halo + precision core dot).
 */
export function computeCursorState(
  pointerX: number,
  pointerY: number,
  targetRect: CursorTargetRect | null,
  options: CursorStateOptions = {}
): CursorComputedState {
  const {
    defaultSize = 34,
    cardReticleSize = 54,
    compactMaxWidth = 220,
    compactMaxHeight = 76,
    compactPaddingX = 14,
    compactPaddingY = 8,
    isPressed = false,
    reducedMotion = false,
  } = options;

  const safeX = Number.isFinite(pointerX) ? pointerX : 0;
  const safeY = Number.isFinite(pointerY) ? pointerY : 0;

  if (
    reducedMotion ||
    !targetRect ||
    targetRect.width <= 0 ||
    targetRect.height <= 0
  ) {
    return {
      ringX: safeX,
      ringY: safeY,
      dotX: safeX,
      dotY: safeY,
      width: defaultSize,
      height: defaultSize,
      borderRadius: defaultSize / 2,
      isMagnetic: false,
      targetKind: 'default',
      ringScale: isPressed ? 0.85 : 1,
    };
  }

  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;
  const isCompact =
    targetRect.width <= compactMaxWidth && targetRect.height <= compactMaxHeight;

  if (isCompact) {
    const width = targetRect.width + compactPaddingX;
    const height = targetRect.height + compactPaddingY;
    const baseRadius = targetRect.borderRadius ?? 10;
    const borderRadius = Math.min(Math.max(baseRadius + 4, 8), Math.min(width, height) / 2);

    return {
      ringX: centerX + (safeX - centerX) * 0.22,
      ringY: centerY + (safeY - centerY) * 0.22,
      dotX: centerX + (safeX - centerX) * 0.65,
      dotY: centerY + (safeY - centerY) * 0.65,
      width,
      height,
      borderRadius,
      isMagnetic: true,
      targetKind: 'compact',
      ringScale: isPressed ? 0.94 : 1,
    };
  }

  return {
    ringX: safeX + (centerX - safeX) * 0.14,
    ringY: safeY + (centerY - safeY) * 0.14,
    dotX: safeX,
    dotY: safeY,
    width: cardReticleSize,
    height: cardReticleSize,
    borderRadius: cardReticleSize / 2,
    isMagnetic: true,
    targetKind: 'card',
    ringScale: isPressed ? 0.88 : 1,
  };
}
