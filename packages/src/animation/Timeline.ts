import { Container, getContainer } from "../container/container.js";
import {
  clamp,
  discard,
  hold,
  invert,
  isUnd,
  max,
  processPosition,
} from "../core/helpers.js";
import {
  Flowable,
  FlowableParameter,
  NumberString,
  Parent,
  TargetElement,
} from "../flow/Flowable.js";
import { JSAnimation, JSAnimationParameter } from "./JSAnimation.js";

export class Timeline extends Flowable {
  _animationStarted = false;
  _status = 0;
  _progress = 0;
  _lock = false;
  _defaultDuration;
  _defaultDelay;
  _defaultEase;

  constructor(defaults: FlowableParameter, parent: Parent) {
    super(parent, defaults);
    this._defaultDuration = defaults.duration;
    this._defaultDelay = defaults.delay;
    this._defaultEase = defaults.ease;
  }

  addToTimeline(animation: JSAnimation, startTime: number) {
    if (isUnd(startTime)) {
      startTime = this._endTime;
    }

    animation._startTime = startTime;
    animation._endTime = animation._startTime + animation._duration;
    this._iterationDuration = max(animation._endTime, this._iterationDuration);

    this.setDuration(this._iterationDuration);
    hold(this, animation);
    return this;
  }

  add(
    target: TargetElement,
    params: JSAnimationParameter,
    position?: NumberString,
  ) {
    params.duration = isUnd(params.duration)
      ? this._defaultDuration
      : params.duration;
    params.delay = isUnd(params.delay) ? this._defaultDelay : params.delay;
    params.ease = isUnd(params.ease) ? this._defaultEase : params.ease;

    const animation = new JSAnimation(target, params, this);

    if (animation._from) {
      animation.render(0, false, true);
    }

    const pos = processPosition(position, this._tail) + animation._delay;
    const canSeek = pos < 0;
    this.addToTimeline(animation, canSeek ? 0 : pos);

    this.init();

    if (canSeek) {
      animation.seek(Math.abs(pos));
    }

    return this;
  }

  render(time: number, isSeek = false, skip = false) {
    const duration = this._duration;
    if (!this._animating) {
      console.log("Timeline start...");
      this._animating = true;
    }

    const reverse = this._isReverse;
    const paused = this._paused;

    let isBackWord = reverse;
    const prevIterationTime = this._iterationTime;

    const progress = invert(reverse, time, this._duration);
    let forceAnimate = false;

    let iterationTime = (this._iterationTime = skip
      ? time
      : this._calculateIterationTime(time, isSeek, true));

    let current = isBackWord ? this._tail : this._head;
    while (current && this._time != time && current._play) {
      const next = isBackWord ? current._prev : current._next;

      const time = iterationTime;

      if (isSeek) {
        current.seek(time);
      } else {
        let clampedTime = clamp(
          time - current._startTime,
          current._duration,
          0,
        );
        if (
          (time >= current._startTime && time >= prevIterationTime) ||
          (time <= current._endTime && time <= prevIterationTime)
        ) {
          if (clampedTime !== current._time) {
            current.render(clampedTime, isSeek, forceAnimate);
            current.time = clampedTime;
          }
        }
      }

      current = next;
    }

    if (paused) {
      Container.cancelAnimation(this._parent);
      return;
    }

    if (progress >= duration && this._animating && !skip) {
      this.reset();
      console.log("Timeline end.... ", this._time, " progress: ", progress);

      if (this._parent instanceof Container) {
        discard(this._parent, this);
      }
    }
  }
}

export const createTimeline = (vars: FlowableParameter) =>
  new Timeline(vars, getContainer());
