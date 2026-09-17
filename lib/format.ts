/* Formatting helpers — identical behaviour to the approved build. */
export function n(v: unknown): number { const x = Number(v); return isFinite(x) ? x : 0 }
export function nn(v: unknown): number { return Math.max(0, n(v)) }
export function L(x: number): string { return "\u20B9" + n(x).toFixed(2) + " L" }
export function P(x: number, d?: number): string { return n(x).toFixed(d === undefined ? 2 : d) + "%" }
