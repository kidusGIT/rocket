import { Container, getContainer } from "../container/container";
import {
  clamp,
  getTargets,
  invert,
  isBoolean,
  isUnd,
  processProgress,
  lerp,
  discard,
  setTargetCache,
  isNumber,
  isKey,
} from "../core/helpers";
import type { RocketTarget } from "../core/transforms";
import {
  calculateInitialValue,
  setTransformProperties,
  applyTransformProperties,
  transforms,
  TransformType,
  TransformPropertyRecord,
} from "../core/transforms.js";
import {
  Flowable,
  FlowableParameter,
  Parent,
  TargetElement,
} from "../flow/Flowable";

export type JSAnimationProps = {
  x?: number | string;
  y?: number | string;
  rotate?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
} & Record<string, any>;

export type keyframeProps = {
  previousTween?: JSAnimation;
  chainable: boolean;
  _from: boolean;
} & JSAnimationProps;

export type JSAnimationParameter = FlowableParameter & JSAnimationProps;

export class JSAnimation extends Flowable {
  _progress = 0;
  _delay = 0;
  _targets: RocketTarget[];
  _init = false;
  _overwrite = true;
  _animate = false;
  _from = false;
  _isNegative = false;

  _props: JSAnimationProps;
  _properties: TransformPropertyRecord = {};

  constructor(
    target: TargetElement,
    params: JSAnimationParameter,
    parent: Parent,
  ) {
    let { duration, delay, from, play, loop, alternate, ...objs } = params;

    super(parent, { duration, delay, from, play, loop, alternate });

    this.setDuration(this._duration);

    this._from = !isUnd(from) && isBoolean(from) && from === true;
    this._targets = getTargets(target);
    this._play = !play ? true : play;

    this._props = objs;
  }

  startTween() {
    if (this._init) {
      return;
    }
    this._init = true;

    if (!isUnd(this._props)) {
      this._properties = setTransformProperties(
        this._props,
        this,
        this._targets,
      );
    }

    if (isUnd(this._head) && this._from) {
      this.render(0, false, true);
    }
  }

  render(t: number, isSeek: boolean, forceAnimate = false) {
    const duration = this._duration;
    const reversing = this._isReverse;

    const time = clamp(Math.max(t - this._startTime, 0), duration, 0);
    this._time = time;

    const isBackWord = this._prevTime > time || reversing;

    const elapsedProgress = invert(isBackWord, time, duration);

    const isNegative = isBackWord
      ? this._startTime - t < 0
      : this._endTime - t < 0;

    const isInTimeFrame = t >= this._startTime && t <= this._endTime;

    if (!this._animating && isInTimeFrame) {
      console.log("Tween start ", this._targets, " at time ", time);
      this.startTween();
      this._animating = true;
    }

    const shouldRender =
      (this._animating || isSeek) &&
      (isInTimeFrame || this._isNegative != isNegative) &&
      this._prevTime !== time;

    this._isNegative = isNegative;
    if (shouldRender || forceAnimate) {
      this._prevTime = time;
      const iterationTime = this._calculateIterationTime(time);

      if (!isUnd(this._head)) {
        this._renderChildren(iterationTime, isSeek, reversing);
      }

      this._updateTargets(iterationTime, reversing);
    }

    if (this._paused) {
      Container.cancelAnimation(this._parent);
    }

    const isCompleted =
      elapsedProgress >= duration &&
      this._animating &&
      this._prevTime === time &&
      !forceAnimate;

    if (isCompleted) {
      this.reset();

      if (this._parent instanceof Container) {
        discard(this._parent, this);
      }
    }
  }

  private _renderChildren(time: number, isSeek: boolean, reversing: boolean) {
    let current = this._head;
    while (current) {
      const next = current._next;
      current._isReverse = reversing;
      current._paused = this._paused;

      if (!isSeek) {
        if (current._startTime <= time) {
          current.render(time - current._startTime);
        }
      } else {
        current.render(time, true);
      }
      current = next;
    }
  }

  private _calculateIterationTime(time: number) {
    const duration = this._duration;
    const iterationDuration = this._iterationDuration;

    if (isNumber(this._loop) && this._loop <= 0) return time;

    const prevIterationCount = this._previousIterationCount;
    const iterationCount = Math.floor(time / iterationDuration);

    const lastIterationCount = duration / iterationDuration;
    let computedTime = time;

    if (iterationCount < lastIterationCount || this._alternate) {
      computedTime = time % iterationDuration;
    }

    if (this._alternate) {
      const isOddIteration = iterationCount % 2 !== 0;
      computedTime = isOddIteration
        ? iterationDuration - computedTime
        : computedTime;
    }

    if (prevIterationCount !== iterationCount) {
      console.log(
        "iteration change ",
        prevIterationCount,
        " -> ",
        iterationCount,
      );
    }

    this._previousIterationCount = iterationCount;

    return computedTime;
  }

  private _updateTargets(iterationTime: number, reversing: boolean) {
    const iterationDuration = this._iterationDuration;
    const properties = this._properties ?? {};

    const progressNormalized = processProgress(
      clamp(iterationTime, iterationDuration, 0),
      iterationDuration,
      this._delay,
      reversing,
    );

    const t = this._ease(
      this._from ? 1 - progressNormalized : progressNormalized,
    );
    this._targets.forEach((target) => {
      const cache = target.rocketCache || {};

      for (const [key, value] of Object.entries(properties)) {
        const isTransform = transforms.has(key);
        let from = value.from;
        let originalState = 0;

        if (from === Infinity && isTransform) {
          from = value.from = isKey(key, cache)
            ? cache[key].currentState
            : value.currentState;
        }

        if (!isTransform) {
          const hasCachedKey = isKey(key, cache);

          if (!hasCachedKey) {
            const initialValue = calculateInitialValue(target, key, value.unit);
            if (from === Infinity) {
              from = value.from = initialValue;
            }
          } else if (hasCachedKey && isKey("from", cache[key])) {
            if (from === Infinity) {
              from = value.from = cache[key].currentState;
            }
          }
        }

        const easePosition = lerp(from, value.to, t);
        value.currentState = easePosition;

        setTargetCache(
          key,
          target,
          easePosition,
          value.to,
          value.unit,
          from,
          originalState,
        );
      }

      applyTransformProperties(target);
    });
  }
}

// Define the callable object type
type Animate = {
  (target: TargetElement, param: JSAnimationParameter): JSAnimation;
  from: (target: TargetElement, param: JSAnimationParameter) => JSAnimation;
  to: (target: TargetElement, param: JSAnimationParameter) => JSAnimation;
};

// Implement the function
const animateImplementation = function (
  target: TargetElement,
  param: JSAnimationParameter,
) {
  return new JSAnimation(target, param, getContainer()).init();
} as Animate;

// Attach the sub-function
animateImplementation.from = function (
  target: TargetElement,
  param: JSAnimationParameter,
) {
  return animateImplementation(target, { ...param, from: true });
};

animateImplementation.to = function (
  target: TargetElement,
  param: JSAnimationParameter,
) {
  return animateImplementation(target, param);
};

// Export it as a named export (or default export)
export const animate = animateImplementation;
