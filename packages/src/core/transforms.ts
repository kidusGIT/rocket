import { JSAnimation, JSAnimationProps } from "../animation/JSAnimation";
import { convertCSSUnit, extractUnit, isObj, isUnd, isString } from "./helpers";

export type TransformType = {
  currentState: number;
  to: number;
  from: number;
  unit: string;
  originalState?: number;
};

export type TransformPropertiesType =
  | "x"
  | "y"
  | "rotate"
  | "scale"
  | "scaleX"
  | "scaleY"
  | string;

export type TransformPropertyRecord = Record<
  TransformPropertiesType,
  TransformType
>;

export type RocketTarget = {
  rocketCache: TransformPropertyRecord;
} & HTMLElement;

export const transforms = new Set([
  "x",
  "y",
  "rotate",
  "scale",
  "scaleX",
  "scaleY",
]);

export const isScale = (key: string) =>
  key === "scale" || key === "scaleX" || key === "scaleY";

export function setTransformProperties(
  objs: JSAnimationProps,
  animation: JSAnimation,
  targets: HTMLElement[],
): TransformPropertyRecord {
  const props: TransformPropertyRecord = {};
  const { previousTween, chainable, _from, ...parameter } = objs;

  for (const [key, value] of Object.entries(parameter)) {
    const isTransform = transforms.has(key);
    const extracted =
      key === "opacity" && !isTransform
        ? { value, unit: "" }
        : extractUnit(value as string);

    let to = extracted.value as number;
    let from = Infinity;
    let currentState = 0;

    if (isTransform) {
      const prevProps = !isUnd(previousTween)
        ? previousTween?._properties[key]
        : null;
      from = !prevProps ? (isScale(key) ? 1 : 0) : prevProps.to;
      currentState = from;
    }
    props[key] = {
      currentState,
      to,
      from: isTransform && !chainable ? Infinity : from,
      unit: getUnitForKey(key, extracted.unit as string, isTransform),
    };
  }

  return props;
}

function getUnitForKey(
  key: string,
  extractedUnit: string,
  isTransform: boolean,
) {
  if (!isTransform) return extractedUnit ?? "";
  if (isScale(key)) return "";
  if (key === "rotate") return "deg";
  return extractedUnit ?? "px";
}

export function calculateInitialValue(
  target: HTMLElement,
  key: string,
  unit: string,
): number {
  const elStyle = getComputedStyle(target);
  const attribute = elStyle[key as any] as string;

  const from = convertCSSUnit(attribute, unit);
  return isString(from) ? 0 : from;
}

export function applyTransformProperties(target: RocketTarget) {
  const { x, y, scale, scaleY, scaleX, rotate, ...attrs } = target[
    "rocketCache"
  ]
    ? target["rocketCache"]
    : (target["rocketCache"] = {});

  let transformString = "";
  if (x || y) {
    const xVal = !isUnd(x) ? x["currentState"] || 0 : 0;
    const yVal = !isUnd(y) ? y["currentState"] || 0 : 0;

    transformString += `translate(${xVal}${x?.unit || "px"}, ${yVal}${y?.unit || "px"})`;
  }

  if (!isUnd(rotate)) {
    transformString += ` rotate(${rotate.currentState || 0}${rotate?.unit})`;
  }

  if (!isUnd(scale) || !isUnd(scaleX) || !isUnd(scaleY)) {
    const key = !isUnd(scale) ? "scale" : !isUnd(scaleY) ? "scaleY" : "scaleX";

    const state = !isUnd(scale)
      ? scale.currentState
      : !isUnd(scaleY)
        ? scaleY.currentState
        : scaleX.currentState;

    const axis = key === "scale" ? "" : key.charAt(key.length - 1);
    const pro = state;

    transformString += ` scale${axis === "" ? `(${pro}, ${pro})` : `(${axis === "X" ? pro : 1}, ${axis === "Y" ? pro : 1})`}`;
  }

  target.style.transform = transformString;

  if (isObj(attrs)) {
    for (const [key, value] of Object.entries(attrs)) {
      const { unit, currentState } = value;
      target.style[key as any] = `${currentState}${unit}`;
    }
  }
}
