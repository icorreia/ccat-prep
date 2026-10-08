import { useId } from 'react';
import { describeFigure, type FigureSpec } from './figure';

const SIZE = 100;

/** Centres for 1–6 copies inside the panel. */
const LAYOUTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 50], [70, 50]],
  3: [[50, 30], [30, 68], [70, 68]],
  4: [[32, 32], [68, 32], [32, 68], [68, 68]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[25, 35], [50, 35], [75, 35], [25, 68], [50, 68], [75, 68]],
};

const CORNERS: [number, number][] = [[10, 10], [90, 10], [90, 90], [10, 90]];

/** Regular polygon: odd-sided ones point up, even-sided ones sit on a flat edge (a square, not a diamond). */
function polygonPoints(sides: number, r: number): string {
  const offset = sides % 2 === 0 ? Math.PI / sides : 0;
  return Array.from({ length: sides }, (_, i) => {
    const a = (2 * Math.PI * i) / sides - Math.PI / 2 + offset;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function ShapeAt({ f, r, fill }: { f: FigureSpec; r: number; fill: string }) {
  const common = { fill, stroke: 'currentColor', strokeWidth: 2.5, vectorEffect: 'non-scaling-stroke' as const };
  if (f.shape === 'circle') return <circle r={r} {...common} />;
  if (f.shape === 'arrow') {
    // Points up at rotation 0.
    const w = r * 0.45;
    return <polygon points={`0,${-r} ${r * 0.8},${-r * 0.1} ${w},${-r * 0.1} ${w},${r} ${-w},${r} ${-w},${-r * 0.1} ${-r * 0.8},${-r * 0.1}`} {...common} />;
  }
  return <polygon points={polygonPoints(f.sides ?? 4, r)} {...common} />;
}

/** Renders a FigureSpec as a square SVG panel. */
export function Figure({ figure, size = 88 }: { figure: FigureSpec; size?: number }) {
  const patternId = useId();
  const centres = LAYOUTS[figure.count] ?? LAYOUTS[1]!;
  const r = figure.count === 1 ? 30 : figure.count <= 2 ? 17 : figure.count <= 4 ? 14 : 11;
  const fill = figure.fill === 'solid' ? 'currentColor' : figure.fill === 'striped' ? `url(#${patternId})` : 'none';
  return (
    <svg className="figure" viewBox={`0 0 ${SIZE} ${SIZE}`} width={size} height={size} role="img" aria-label={describeFigure(figure)}>
      <defs>
        <pattern id={patternId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="2" />
        </pattern>
      </defs>
      {centres.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${figure.rotation})`}>
          <ShapeAt f={figure} r={r} fill={fill} />
        </g>
      ))}
      {figure.dot !== undefined && <circle cx={CORNERS[figure.dot]![0]} cy={CORNERS[figure.dot]![1]} r={5} fill="currentColor" />}
    </svg>
  );
}
