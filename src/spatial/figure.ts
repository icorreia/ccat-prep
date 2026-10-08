/** A spatial-reasoning figure: what is drawn in one panel or answer choice. */
export interface FigureSpec {
  shape: 'circle' | 'arrow' | 'polygon';
  /** Number of sides, for polygons (3–8). */
  sides?: number;
  fill: Fill;
  /** Degrees clockwise. */
  rotation: number;
  /** How many copies of the shape (1–6). */
  count: number;
  /** Corner marker: 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left (clockwise). */
  dot?: number;
}

export type Fill = 'empty' | 'striped' | 'solid';
export const FILLS: readonly Fill[] = ['empty', 'striped', 'solid'];

/** Rotation that leaves the shape looking the same (a square looks identical after 90°). */
export function symmetryPeriod(f: FigureSpec): number {
  if (f.shape === 'circle') return 1;
  if (f.shape === 'arrow') return 360;
  return 360 / (f.sides ?? 4);
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Rotation as it looks: 0 ≤ r < symmetry period. */
export const visibleRotation = (f: FigureSpec) => mod(Math.round(f.rotation), symmetryPeriod(f));

/** Two figures with the same key look identical. */
export function figureKey(f: FigureSpec): string {
  const shape = f.shape === 'polygon' ? `polygon${f.sides}` : f.shape;
  return [shape, f.fill, visibleRotation(f), f.count, f.dot ?? '-'].join('|');
}

const SHAPE_NAMES: Record<number, string> = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };

export function shapeName(f: FigureSpec): string {
  return f.shape === 'polygon' ? SHAPE_NAMES[f.sides ?? 4]! : f.shape;
}

const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

/** Plain-language description, used for screen readers, explanations and samples. */
export function describeFigure(f: FigureSpec): string {
  const name = shapeName(f);
  const article = f.fill === 'empty' ? 'an' : 'a';
  const parts = [`${f.count === 1 ? `${article} ${f.fill} ${name}` : `${f.count} ${f.fill} ${name}s`}`];
  const rotation = visibleRotation(f);
  if (f.shape !== 'circle' && rotation !== 0) parts.push(`rotated ${rotation}°`);
  if (f.dot !== undefined) parts.push(`dot ${CORNERS[f.dot]}`);
  return parts.join(', ');
}
