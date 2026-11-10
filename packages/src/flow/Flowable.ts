import { Container, getContainer } from "../container/container";
import {
  clamp,
  hold,
  isBoolean,
  isInstance,
  isNumber,
  isUnd,
  max,
  maxNumber,
  min,
  noop,
} from "../core/helpers";

export type NumberString = number | string;
export type AnimationCallback = (arg?: Flowable) => void;
export type Parent = Flowable | Container;
export type TargetElement = string | HTMLElement;
export type Ease = string;
export type FlowableParameter = {
  duration?: number;
  delay?: number;
  loopDelay?: number;
  loop?: number | boolean;
  from?: boolean;
  play?: boolean;
  alternate?: boolean;
  ease?: Ease;
  onFinish?: AnimationCallback;
  onLoop?: AnimationCallback;
  onPause?: AnimationCallback;
  onStart?: AnimationCallback;
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
  _loopDelay = 0;
  _parentTime = 0;
  _startAt = 0;
  _iterationTime = 0;

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

  _onStart: AnimationCallback;
  _onFinish: AnimationCallback;
  _onLoop: AnimationCallback;
  _onPause: AnimationCallback;

  _ease = (t: number, p = 2) => t ** p;

  constructor(parent: Parent, param: FlowableParameter) {
    this._parent = parent;
    let {
      duration,
      delay,
      loop,
      alternate,
      loopDelay,
      play,
      onFinish,
      onLoop,
      onPause,
      onStart,
      ease,
    } = param;

    this._loop = loop || 0;
    this._alternate = isBoolean(alternate) && alternate === true;

    this._delay = delay || 0;
    this._loopDelay = this.hasLoop ? loopDelay || 0 : 0;
    this._duration = duration ? duration : 500;
    this._iterationDuration = this._duration;
    this._play = !play ? true : play;

    this._onFinish = onFinish || noop;
    this._onLoop = onLoop || noop;
    this._onPause = onPause || noop;
    this._onStart = onStart || noop;
  }

  get hasLoop() {
    return isNumber(this._loop)
      ? this._loop > 0 || this._loop === Infinity
      : this._loop === true;
  }

  get startTime() {
    return this._startTime;
  }

  get parentTime() {
    return this._parentTime;
  }

  get startAt() {
    return this._startAt;
  }

  get time() {
    return this._time;
  }

  set parentTime(time: number) {
    this._parentTime = time;
  }

  set startAt(time: number) {
    this._startAt = time;
  }

  set time(time: number) {
    this._time = time;
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
    this._duration = maxDuration * loop + this._loopDelay * (loop - 1);
    this._startTime = this._delay;
    this._endTime = this._startTime + this._duration;
  }

  setParent(parent: Flowable) {
    this._parent = parent;
  }

  protected _calculateIterationTime(
    time: number,
    isSeek = false,
    fromTimeline = false,
  ) {
    const totalDuration = this._duration;
    const baseStep = this._iterationDuration;
    const loopDelay = this._loopDelay || 0;
    const fullIterationSpan = baseStep + loopDelay;

    if (totalDuration <= 0) return 0;

    const fullRoundsCount = Math.floor(totalDuration / baseStep);
    const lastRoundSize = totalDuration % baseStep;

    const getRoundSize = (i: number) => {
      if (i < fullRoundsCount) return baseStep;
      if (i === fullRoundsCount && lastRoundSize > 0) return lastRoundSize; // just in case
      return 0;
    };

    const totalRounds = fullRoundsCount + (lastRoundSize > 0 ? 1 : 0);
    let iterationCount = Math.floor(time / fullIterationSpan);
    if (iterationCount >= totalRounds) {
      iterationCount = totalRounds - 1;
    }

    let accumulatedTime = iterationCount * fullIterationSpan;
    if (time < accumulatedTime && iterationCount > 0) {
      iterationCount--;
      accumulatedTime = iterationCount * fullIterationSpan;
    }

    const currentRoundSize = getRoundSize(iterationCount);
    let localTimeInIteration: number = max(0, time - accumulatedTime);
    let computedTime: number = min(localTimeInIteration, currentRoundSize);
    let isOddIteration = false;

    if (this._alternate) {
      isOddIteration = iterationCount % 2 !== 0;
      computedTime = isOddIteration
        ? currentRoundSize - computedTime
        : computedTime;
    }

    const prevIterationCount = this._previousIterationCount;
    if (prevIterationCount !== iterationCount) {
      this._onLoop(this);

      if (fromTimeline) {
        const iterationTime = this._isReverse
          ? !isOddIteration
            ? fullIterationSpan
            : 0
          : isOddIteration
            ? fullIterationSpan
            : 0;

        console.log("iterationTime ", iterationTime);
        this.render(iterationTime, isSeek, true);
      }
    }

    this._previousIterationCount = iterationCount;
    return computedTime;
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

  pause() {
    if (!this._paused) {
      this._paused = true;
    }
    return this;
  }

  play(play = true) {
    this._isReverse = !play;
    const parent = getContainer();

    if (this._paused || isUnd(this._parent)) {
      this._paused = false;
      if (isUnd(this._parent)) {
        this._parent = parent;
        hold(parent, this);
      }
      this._parent instanceof Container &&
        Container.startAnimation(this._parent);
    }

    return this;
  }

  reverse() {
    return this.play(false);
  }

  resume() {
    return this.play(!this._isReverse);
  }

  seek(number: number) {
    const seek = clamp(number, this._duration, 0);
    this.render(seek, true);
    this._time = seek;

    return this._paused || !this._animating ? this : this.resume();
  }

  abstract render(t: number, isSeek?: boolean, forceAnimate?: boolean): void;
}
