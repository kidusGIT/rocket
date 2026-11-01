import { Container, getContainer } from "../container/container";
import {
  hold,
  isBoolean,
  isInstance,
  isNumber,
  isUnd,
  max,
  maxNumber,
} from "../core/helpers";

export type Parent = Flowable | Container;
export type TargetElement = string | HTMLElement;
export type FlowableParameter = {
  duration?: number;
  delay?: number;
  loop?: number | boolean;
  from?: boolean;
  play?: boolean;
  alternate?: boolean;
};

export abstract class Flowable {
  _currentDuration = 0;
  _prevElapsedTime = 0;
  _duration = 0;
  _time = 0;
  _id = 0;
  _loop: number | boolean = 0;
  _delay = 0;
  _iterationDuration = 0;
  _previousIterationCount = 0;
  _startTime = 0;
  _endTime = 0;
  _prevTime = 0;

  _animating = false;
  _paused = false;
  _alternate = false;
  _isReverse = false;
  _isInited = false;
  _play = true;

  _parent?: Parent;
  _next?: Flowable;
  _prev?: Flowable;
  _head?: Flowable;
  _tail?: Flowable;

  _ease = (t: number, p = 2) => 1 - t ** p;

  constructor(parent: Parent, param: FlowableParameter) {
    this._parent = parent;
    let { duration, delay, loop, alternate } = param;

    this._loop = loop || 0;
    this._alternate = isBoolean(alternate) && alternate === true;

    this._delay = delay || 0;
    this._duration = duration ? duration : 500;
    this._iterationDuration = this._duration;
  }

  setDuration(duration: number, forceDuration = false) {
    const maxDuration = forceDuration
      ? duration
      : max(duration, this._iterationDuration);
    let loop = isNumber(this._loop) ? this._loop + 1 : 1;

    if (this._loop === true || this._loop === Infinity) {
      loop = maxNumber;
    }

    this._iterationDuration = maxDuration;
    this._duration = this._endTime = maxDuration * loop;
  }

  setParent(parent: Flowable) {
    this._parent = parent;
  }

  animation(factor?: number) {
    if (!isUnd(factor)) {
      this.render(factor || 0);
    } else {
      if (isUnd(this._parent)) {
        this._parent = getContainer();
        hold(this._parent, this);
      }
      Container.startAnimation(this._parent as Container);
    }

    return this;
  }

  init() {
    if (isBoolean(this._play) && this._play === true && !this._isInited) {
      this._parent && hold(this._parent, this);
      if (isInstance(this._parent, Container) && this._parent) {
        this._parent.init();
      }
    }

    this._isInited = true;
    return this;
  }

  reset() {
    this._animating = false;
  }

  abstract render(t: number, isSeek?: boolean, forceAnimate?: boolean): void;
}
