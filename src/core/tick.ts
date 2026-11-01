import { noop } from "./helpers";

export const calculateFactor = (current: number, last: number) =>
  last ? current - last : 0;
export const startFrame = requestAnimationFrame || noop;
export const cancelFrame = cancelAnimationFrame || noop;
