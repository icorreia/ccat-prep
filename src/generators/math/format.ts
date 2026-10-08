/** Display helpers shared by the math generators. */

export const money = (n: number) => `$${n}`;
export const percent = (n: number) => `${n}%`;

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

/** A fraction in lowest terms, e.g. fraction(6, 8) -> "3/4". */
export function fraction(numerator: number, denominator: number): string {
  const g = gcd(numerator, denominator);
  return `${numerator / g}/${denominator / g}`;
}
