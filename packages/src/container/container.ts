import { clamp, isInstance, isUnd, now, round } from "../core/helpers";
import { calculateFactor, startFrame } from "../core/tick";
import { Flowable } from "../flow/Flowable";

export class Container {
  _rafId?: number;
  _head?: Flowable;
  _tail?: Flowable;
  _fps = 0;

  static startAnimation(container: Container) {
    let lastUpdate: number;

    function tick() {
      const currentTime = now();

      let factor = calculateFactor(currentTime, lastUpdate);

      if (factor >= 100) {
        factor = container._fps;
      }

      lastUpdate = currentTime;
      container._fps = factor;

      container._rafId = startFrame(tick);
      container.shake && container.shake(factor);
    }

    if (container && container._rafId == null) {
      container._rafId = startFrame(tick);
    }
  }

  static cancelAnimation(parent: any) {
    if (isInstance(parent, Container)) {
      cancelAnimationFrame(parent._rafId);
      parent._rafId = null;
    }
  }

  update(current: Flowable, factor: number) {
    let reverse = current._isReverse;
    const duration = current._duration;
    factor = reverse ? -1 * factor : factor;

    const time = clamp(current._time + factor, duration, 0);
    current.render(round(time));
  }

  shake(factor: number) {
    const head = this._head;
    let current = head;
    while (current) {
      const next = current._next;
      this.update(current, factor);
      current = next;
    }

    if (isUnd(head)) {
      Container.cancelAnimation(this);
    }
  }

  // Function for starting the animation
  init() {
    Container.startAnimation(this);
  }
}

const container = new Container();
export const getContainer = () => container;
