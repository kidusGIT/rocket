import { Container, getContainer } from "../container/container";
import { hold, isBoolean, isInstance, isUnd } from "../core/helpers";

export type Parent = Flowable | Container;
type FlowableParameter = {
  duration: number;
  delay: number;
};

export abstract class Flowable {
  _currentDuration = 0;
  _prevElapsedTime = 0;
  _duration = 0;
  _time = 0;
  _id = 0;

  _isReverse = false;
  _isInited = false;
  _play = true;

  _parent?: Parent;
  _next?: Flowable;
  _prev?: Flowable;
  _head?: Flowable;
  _tail?: Flowable;

  constructor(parent: Container, param: FlowableParameter) {
    this._parent = parent;
  }

  setParent(parent: Flowable) {
    this._parent = parent;
  }

  animation(factor?: number) {
    if (!isUnd(factor)) {
      this.render(factor);
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

  abstract render(time?: number): void;
}
