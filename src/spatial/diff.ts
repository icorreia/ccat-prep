import { shapeName, visibleRotation, type FigureSpec } from './figure';

/** What a figure can differ in, as a test-taker sees it. */
export type Attribute = 'shape' | 'fill' | 'count' | 'rotation' | 'dot';

const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

export const ATTRIBUTE_NAMES: Record<Attribute, string> = {
  shape: 'shape',
  fill: 'fill',
  count: 'number of shapes',
  rotation: 'angle',
  dot: 'dot',
};

/** How one attribute of a figure reads: "a pentagon", "striped", "3 shapes", "turned 90°", "dot top-left". */
export function attributeValue(f: FigureSpec, attribute: Attribute): string {
  switch (attribute) {
    case 'shape':
      return `${/^[aeiou]/.test(shapeName(f)) ? 'an' : 'a'} ${shapeName(f)}`;
    case 'fill':
      return f.fill;
    case 'count':
      return `${f.count} shape${f.count === 1 ? '' : 's'}`;
    case 'rotation':
      return `turned ${visibleRotation(f)}°`;
    case 'dot':
      return f.dot === undefined ? 'no dot' : `the dot ${CORNERS[f.dot]}`;
  }
}

/** The attributes in which two figures look different. */
export function differences(a: FigureSpec, b: FigureSpec): Attribute[] {
  const out: Attribute[] = [];
  if (shapeName(a) !== shapeName(b)) out.push('shape');
  if (a.fill !== b.fill) out.push('fill');
  if (a.count !== b.count) out.push('count');
  if (a.shape !== 'circle' && b.shape !== 'circle' && visibleRotation(a) !== visibleRotation(b)) out.push('rotation');
  if (a.dot !== b.dot) out.push('dot');
  return out;
}
