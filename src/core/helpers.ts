import { Flowable, Parent } from "../flow/Flowable";

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
