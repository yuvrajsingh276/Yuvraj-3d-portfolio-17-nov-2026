import * as THREE from 'three';

/**
 * Rounded rectangle THREE.Shape centered at (0, 0).
 */
export function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);

  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

/**
 * Hollow rounded-rectangle bezel frame centered at (0, 0).
 */
export function createRoundedFrameShape(
  width: number,
  height: number,
  radius: number,
  thickness: number
): THREE.Shape {
  const outer = createRoundedRectShape(width, height, radius);
  const iw = width - thickness * 2;
  const ih = height - thickness * 2;
  const ir = Math.max(0.02, radius - thickness * 0.7);
  const hw = iw / 2;
  const hh = ih / 2;

  const hole = new THREE.Path();
  // Clockwise winding for hole
  hole.moveTo(-hw + ir, -hh);
  hole.quadraticCurveTo(-hw, -hh, -hw, -hh + ir);
  hole.lineTo(-hw, hh - ir);
  hole.quadraticCurveTo(-hw, hh, -hw + ir, hh);
  hole.lineTo(hw - ir, hh);
  hole.quadraticCurveTo(hw, hh, hw, hh - ir);
  hole.lineTo(hw, -hh + ir);
  hole.quadraticCurveTo(hw, -hh, hw - ir, -hh);
  hole.lineTo(-hw + ir, -hh);

  outer.holes.push(hole);
  return outer;
}

/**
 * Iconic 4-point concave astroid star for Google Gemini.
 */
export function createGeminiStarShape(outerR = 0.78, curvePinch = 0.14): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, outerR);
  s.bezierCurveTo(curvePinch * 0.35, curvePinch * 1.4, curvePinch * 1.4, curvePinch * 0.35, outerR, 0);
  s.bezierCurveTo(curvePinch * 1.4, -curvePinch * 0.35, curvePinch * 0.35, -curvePinch * 1.4, 0, -outerR);
  s.bezierCurveTo(-curvePinch * 0.35, -curvePinch * 1.4, -curvePinch * 1.4, -curvePinch * 0.35, -outerR, 0);
  s.bezierCurveTo(-curvePinch * 1.4, curvePinch * 0.35, -curvePinch * 0.35, curvePinch * 1.4, 0, outerR);
  return s;
}

/**
 * Geometric uppercase 'A' glyph centered around x=0, baseline y=-0.34, top y=0.36.
 */
export function createGlyphA(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.31, -0.34);
  s.lineTo(-0.18, -0.34);
  s.lineTo(-0.12, -0.14);
  s.lineTo(0.12, -0.14);
  s.lineTo(0.18, -0.34);
  s.lineTo(0.31, -0.34);
  s.lineTo(0.075, 0.36);
  s.lineTo(-0.075, 0.36);
  s.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-0.085, -0.02);
  hole.lineTo(0.085, -0.02);
  hole.lineTo(0.0, 0.22);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

/**
 * Geometric uppercase 'P' glyph with counter hole.
 */
export function createGlyphP(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.24, -0.34);
  s.lineTo(-0.10, -0.34);
  s.lineTo(-0.10, -0.04);
  s.lineTo(0.06, -0.04);
  s.bezierCurveTo(0.24, -0.04, 0.29, 0.06, 0.29, 0.16);
  s.bezierCurveTo(0.29, 0.28, 0.22, 0.36, 0.05, 0.36);
  s.lineTo(-0.24, 0.36);
  s.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-0.10, 0.07);
  hole.lineTo(-0.10, 0.25);
  hole.lineTo(0.04, 0.25);
  hole.bezierCurveTo(0.13, 0.25, 0.16, 0.21, 0.16, 0.16);
  hole.bezierCurveTo(0.16, 0.11, 0.13, 0.07, 0.04, 0.07);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

/**
 * Geometric lowercase 'e' glyph with top counter hole.
 */
export function createGlyphE(): THREE.Shape {
  const s = new THREE.Shape();
  // Clean geometric rounded e
  s.moveTo(0.21, -0.01);
  s.lineTo(-0.11, -0.01);
  s.bezierCurveTo(-0.10, -0.14, -0.04, -0.22, 0.05, -0.22);
  s.bezierCurveTo(0.11, -0.22, 0.15, -0.20, 0.19, -0.16);
  s.lineTo(0.23, -0.26);
  s.bezierCurveTo(0.17, -0.32, 0.10, -0.35, 0.02, -0.35);
  s.bezierCurveTo(-0.16, -0.35, -0.26, -0.21, -0.26, -0.04);
  s.bezierCurveTo(-0.26, 0.14, -0.15, 0.26, 0.01, 0.26);
  s.bezierCurveTo(0.17, 0.26, 0.25, 0.14, 0.25, -0.01);
  s.lineTo(0.21, -0.01);
  s.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-0.11, 0.07);
  hole.lineTo(0.12, 0.07);
  hole.bezierCurveTo(0.11, 0.14, 0.07, 0.17, 0.01, 0.17);
  hole.bezierCurveTo(-0.06, 0.17, -0.10, 0.13, -0.11, 0.07);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

/**
 * Geometric lowercase 'r' glyph.
 */
export function createGlyphR(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.14, -0.34);
  s.lineTo(-0.01, -0.34);
  s.lineTo(-0.01, -0.02);
  s.bezierCurveTo(-0.01, 0.09, 0.05, 0.14, 0.15, 0.13);
  s.lineTo(0.16, 0.25);
  s.bezierCurveTo(0.06, 0.26, 0.00, 0.21, -0.03, 0.14);
  s.lineTo(-0.04, 0.24);
  s.lineTo(-0.14, 0.24);
  s.closePath();
  return s;
}

/**
 * Geometric lowercase 's' glyph.
 */
export function createGlyphS(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.19, -0.22);
  s.bezierCurveTo(-0.14, -0.29, -0.06, -0.35, 0.04, -0.35);
  s.bezierCurveTo(0.17, -0.35, 0.24, -0.27, 0.24, -0.16);
  s.bezierCurveTo(0.24, -0.05, 0.16, 0.00, 0.03, 0.03);
  s.bezierCurveTo(-0.05, 0.05, -0.08, 0.08, -0.08, 0.11);
  s.bezierCurveTo(-0.08, 0.15, -0.04, 0.17, 0.02, 0.17);
  s.bezierCurveTo(0.08, 0.17, 0.13, 0.15, 0.17, 0.11);
  s.lineTo(0.22, 0.20);
  s.bezierCurveTo(0.16, 0.25, 0.09, 0.27, 0.01, 0.27);
  s.bezierCurveTo(-0.12, 0.27, -0.20, 0.19, -0.20, 0.09);
  s.bezierCurveTo(-0.20, -0.01, -0.13, -0.06, 0.01, -0.09);
  s.bezierCurveTo(0.09, -0.11, 0.12, -0.13, 0.12, -0.17);
  s.bezierCurveTo(0.12, -0.22, 0.07, -0.25, 0.01, -0.25);
  s.bezierCurveTo(-0.06, -0.25, -0.11, -0.22, -0.15, -0.16);
  s.closePath();
  return s;
}

/**
 * Lowercase 'i' stem shape (dot added separately as cylinder/sphere).
 */
export function createGlyphIStem(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.065, -0.34);
  s.lineTo(0.065, -0.34);
  s.lineTo(0.065, 0.15);
  s.lineTo(-0.065, 0.15);
  s.closePath();
  return s;
}

/**
 * Figma tile shape variants:
 * - leftRounded: top-left / mid-left capsule half (left side circular, right side slightly rounded)
 * - rightRounded: top-right capsule half
 * - teardrop: bottom-left drop (rounded top-left, bottom-left, bottom-right; sharp top-right)
 */
export function createFigmaTileShape(
  variant: 'leftCap' | 'rightCap' | 'teardrop',
  size = 0.34
): THREE.Shape {
  const r = size / 2;
  const s = new THREE.Shape();

  if (variant === 'leftCap') {
    s.moveTo(0, -r);
    s.lineTo(r, -r);
    s.lineTo(r, r);
    s.lineTo(0, r);
    s.absarc(0, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
  } else if (variant === 'rightCap') {
    s.moveTo(-r, -r);
    s.lineTo(0, -r);
    s.absarc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(-r, r);
    s.lineTo(-r, -r);
  } else {
    // Teardrop: top-right corner is sharp (r, r), other 3 corners are rounded
    s.moveTo(0, -r);
    s.absarc(0, 0, r, -Math.PI / 2, Math.PI, true); //Wait: let's trace cleanly CCW
    const drop = new THREE.Shape();
    drop.moveTo(0, -r);
    drop.absarc(0, 0, r, (Math.PI * 3) / 2, Math.PI, true);
    // Actually easiest & cleanest with quadratic curves:
    const td = new THREE.Shape();
    td.moveTo(0, -r);
    td.quadraticCurveTo(r, -r, r, 0);
    td.lineTo(r, r); // sharp top-right
    td.lineTo(0, r);
    td.quadraticCurveTo(-r, r, -r, 0);
    td.quadraticCurveTo(-r, -r, 0, -r);
    return td;
  }
  return s;
}

/**
 * Tapered Claude AI sunburst ray radiating upward along +Y from origin.
 */
export function createClaudeRayShape(length = 0.64, baseW = 0.045, tipW = 0.072): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-baseW / 2, 0.14);
  s.lineTo(baseW / 2, 0.14);
  s.lineTo(tipW / 2, length);
  s.quadraticCurveTo(0, length + 0.04, -tipW / 2, length);
  s.closePath();
  return s;
}

/**
 * Blender sculpted radial arm extending along +X from center ring.
 */
export function createBlenderArmShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.22, -0.075);
  s.lineTo(0.76, -0.065);
  s.quadraticCurveTo(0.86, 0, 0.76, 0.065);
  s.lineTo(0.22, 0.075);
  s.closePath();
  return s;
}

/**
 * Cinema 4D beveled C-crescent shell arc.
 */
export function createCrescentArcShape(
  outerR = 0.76,
  innerR = 0.44,
  startAngle = 0.58,
  endAngle = Math.PI * 2 - 0.58
): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(0, 0, outerR, startAngle, endAngle, false);
  s.absarc(0, 0, innerR, endAngle, startAngle, true);
  s.closePath();
  return s;
}
