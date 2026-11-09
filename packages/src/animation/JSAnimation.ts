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
  noop,
  isInstance,
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
  AnimationCallback,
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
  onStart?: AnimationCallback;
  onFinish?: AnimationCallback;
  onLoop?: AnimationCallback;
  onPause?: AnimationCallback;
} & Record<string, any>;

export type keyframeProps = {
  previousTween?: JSAnimation;
  chainable: boolean;
  _from: boolean;
} & JSAnimationProps;

export type JSAnimationParameter = FlowableParameter & JSAnimationProps;

export class JSAnimation extends Flowable {
  _progress = 0;
  _targets: Array<RocketTarget>;
  _init = false;
  _overwrite = true;
  _animate = false;
  _from = false;

  _props: JSAnimationProps;
  _properties: TransformPropertyRecord = {};

  constructor(
    target: TargetElement,
    params: JSAnimationParameter,
    parent: Parent,
  ) {
    let {
      duration,
      delay,
      from,
      play,
      loop,
      alternate,
      loopDelay,
      onFinish,
      onLoop,
      onPause,
      onStart,
      ...objs
    } = params;

    super(parent, {
      duration,
      delay,
      from,
      play,
      loop,
      alternate,
      loopDelay,
      onFinish,
      onLoop,
      onPause,
      onStart,
    });

    this.setDuration(this._duration);

    this._from = !isUnd(from) && isBoolean(from) && from === true;
    this._targets = getTargets(target);
    this._play = !play ? true : play;

    this._props = objs;
  }

  start() {
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

  render(time: number, isSeek: boolean, forceAnimate = false) {
    const duration = this._duration;
    const reversing = this._isReverse;
    const prevTime = this._time;

    const isBackWord = prevTime > time || reversing;

    const elapsedProgress = invert(isBackWord, time, duration);

    if (!this._animating && (prevTime === 0 || prevTime === duration)) {
      this.start();
      this._animating = true;
      this._onStart(this);
    }

    const shouldRender = (this._animating || isSeek) && prevTime !== time;

    if (shouldRender || forceAnimate) {
      const iterationTime = this._calculateIterationTime(time);
      if (!isUnd(this._head)) {
        this._renderChildren(iterationTime, isSeek, reversing);
      }

      this._updateTargets(iterationTime);
    }

    if (this._paused) {
      Container.cancelAnimation(this._parent);
      this._onPause(this);
    }

    const isCompleted =
      this._animating && elapsedProgress >= duration && !forceAnimate;

    if (isCompleted) {
      this.reset();
      this._onFinish(this);
      if (this._parent && isInstance(this._parent, Container)) {
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

  private _updateTargets(iterationTime: number) {
    const prevTime = this._iterationTime;
    if (prevTime === iterationTime) return;

    const iterationDuration = this._iterationDuration;
    this._iterationTime = iterationTime;
    const properties = this._properties ?? {};

    const progressNormalized = processProgress(
      clamp(iterationTime, iterationDuration, 0),
      iterationDuration,
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
