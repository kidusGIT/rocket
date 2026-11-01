import { Flowable, Parent, TargetElement } from "../flow/Flowable";
import { RocketTarget } from "./transforms";

export const isUnd = (v: any) => typeof v === "undefined" || v === null;
export const isString = (v: any) => typeof v === "string";
export const isNumber = (v: any) => typeof v === "number";
export const isBoolean = (v: any) => typeof v === "boolean";
export const isFunction = (v: any) => typeof v === "function";
export const isInstance = (o: any, c: any) => o instanceof c;
export const isObj = (v: any) => typeof v === "object";
export const isFinite = (v: number) => Number.isFinite(v);
export const isArray = (v: any) => Array.isArray(v);
export const isKey = (key: string, obj: any) =>
  Object.prototype.hasOwnProperty.call(obj, key);
export const none = undefined;

export const noop = () => {};

export const now = Date.now;
export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;
export const clamp = (v: number, max: number, min: number) =>
  v < min ? min : v > max ? max : v;
export const max = (n1: number, n2: number) => Math.max(n1, n2);
export const min = (n1: number, n2: number) => Math.min(n1, n2);
export const cos = (n: number) => Math.cos(n);
export const sin = (n: number) => Math.sin(n);
export const atan2 = (y: number, x: number) => Math.atan2(y, x);
export const sqrt = (n: number) => Math.sqrt(n);
export const round = (v: number) => Math.round(v);
export const normalize = (p: number, t: number) => clamp(p / t, 1, 0);
export const invert = (isInvert: boolean, progress: number, factor = 1) =>
  isInvert ? factor - progress : progress;

export const minNumber = -10e10;
export const maxNumber = 10e10;

export function processElapsedProgress(
  animation: Flowable,
  reversing: boolean,
) {
  const elapsedTime = (animation._prevElapsedTime = calculateElapsedTime(
    animation._prevElapsedTime,
    animation._time,
    animation._duration,
    reversing,
  ));

  return elapsedTime;
}

export function processProgress(
  time: number,
  duration: number,
  delay: number,
  reversing: boolean,
) {
  if (duration === 0) return 0;

  if (time >= delay || reversing) {
    duration = duration - delay;

    const pr = clamp((time - delay) / duration, 1, 0);
    return pr;
  }

  return -1;
}

export function processElapsedTime(
  prev: number,
  current: number,
  animation: Flowable,
) {
  if (
    (animation._parent &&
      animation._parent instanceof Flowable &&
      animation._parent._isReverse) ||
    animation._isReverse
  ) {
    if (animation._prevElapsedTime === 0) {
      return (animation._prevElapsedTime += animation._duration);
    }
    return (animation._prevElapsedTime -= current - prev);
  }

  return (animation._prevElapsedTime += current - prev);
}

export function calculateElapsedTime(
  elapsed: number,
  factor: number,
  duration: number,
  reversing: boolean,
) {
  if (reversing) {
    return clamp(elapsed - factor, duration, 0);
  }

  return clamp(elapsed + factor, duration, 0);
}

export function hold(parent: Parent, child: Flowable) {
  let head = parent._head,
    tail = parent._tail;

  if (isUnd(head) && isUnd(tail)) {
    parent._head = child;
    parent._tail = child;

    return child;
  }

  const id = tail ? tail._id + 1 : 1;
  child._id = id;

  tail && (tail._next = child);
  child._prev = tail;
  parent._tail = child;

  return child;
}

export function discard(parent: Parent, child: Flowable) {
  let current,
    head = (current = parent._head),
    tail = parent._tail;

  if (head === tail) {
    parent._head = parent._tail = none;
  } else if (child === head) {
    parent._head = parent?._head?._next;
    child._next = none;
    parent._head && (parent._head._prev = none);
  } else if (child === tail) {
    parent._tail = parent?._tail?._prev;
    child._prev = none;
    parent._tail && (parent._tail._next = none);
  } else {
    let prev = child._prev;
    let next = child._next;

    prev && (prev._next = next);
    next && (next._prev = prev);

    child._next = child._prev = none;
  }
  child._parent = none;
  return parent;
}

export function extractUnit(value: string | number): {
  value: number | null;
  unit: string | null;
} {
  if (isNumber(value)) {
    return {
      value: value as number,
      unit: "px",
    };
  }

  const regex = /^(?<value>-?\d*\.?\d+)\s*(?<unit>[a-zA-Z%]*)$/;

  const match = value.trim().match(regex);

  if (match) {
    const { value, unit } = match.groups as any;
    return {
      value: parseFloat(value),
      unit: unit || null,
    };
  }

  return { value: null, unit: null };
}

export function convertCSSUnit(
  v: string,
  targetUnit: string,
  rootFontSize = 16,
): number | string {
  if (targetUnit === "") {
    return parseFloat(v);
  }

  const match = extractUnit(v);
  if (isUnd(match.value)) return "Invalid Input";

  let value = match.value || 0;
  if (match.unit == null) {
    return value;
  }

  const unit = match.unit.toLowerCase();

  if (unit === targetUnit) return value;

  let pxValue;
  switch (unit) {
    case "px":
      pxValue = value;
      break;
    case "rem":
      pxValue = value * rootFontSize;
      break;
    case "em":
      pxValue = value * rootFontSize;
      break;
    case "in":
      pxValue = value * 96;
      break;
    case "cm":
      pxValue = value * 37.8;
      break;
    case "mm":
      pxValue = value * 3.78;
      break;
    case "pt":
      pxValue = value * 1.33;
      break;
    case "vh":
      pxValue = value * (window.innerHeight / 100);
      break;
    case "vw":
      pxValue = value * (window.innerWidth / 100);
      break;
    default:
      return "Unsupported Unit";
  }

  let result;
  switch (targetUnit) {
    case "px":
      result = pxValue;
      break;
    case "rem":
      result = pxValue / rootFontSize;
      break;
    case "em":
      result = pxValue / rootFontSize;
      break;
    case "in":
      result = pxValue / 96;
      break;
    case "cm":
      result = pxValue / 37.8;
      break;
    case "mm":
      result = pxValue / 3.78;
      break;
    case "pt":
      result = pxValue / 1.33;
      break;
    case "vh":
      result = (pxValue / window.innerHeight) * 100;
      break;
    case "vw":
      result = (pxValue / window.innerWidth) * 100;
      break;
    default:
      return "Unsupported Target Unit";
  }

  return parseFloat(result.toFixed(3));
}

export function getTargets(target: TargetElement): Array<RocketTarget> {
  if (isArray(target)) {
    return target;
  } else if (isObj(target)) {
    return [target as RocketTarget];
  } else if (isString(target)) {
    const elements = document.querySelectorAll(target);
    const arr: RocketTarget[] = [];

    elements.forEach((el) => {
      const customEl = el as any;

      if (!isKey("rocketCache", customEl)) {
        customEl.rocketCache = {};
      }
      arr.push(customEl as RocketTarget);
    });

    return arr;
  }

  return [];
}

export function setTargetCache(
  key: string,
  target: RocketTarget,
  state: number,
  to: number,
  unit: string,
  from: number,
  originalState: number,
) {
  const cache =
    (isKey("rocketCache", target)
      ? target["rocketCache"]
      : (target["rocketCache"] = {})) || {};

  if (!isKey(key, cache)) {
    cache[key] = {
      to,
      currentState: state,
      unit,
      from,
      originalState,
    };
  } else {
    cache[key]["currentState"] = state;
  }
}
