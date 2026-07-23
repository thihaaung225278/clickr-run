/**
 * Keyboard + touch swipe input for lane / jump / slide.
 */
export class Input {
  constructor(target = window) {
    this.queue = [];
    this._touchStart = null;
    this._onKey = this._onKey.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this.target = target;
  }

  attach() {
    this.target.addEventListener("keydown", this._onKey);
    this.target.addEventListener("touchstart", this._onTouchStart, { passive: true });
    this.target.addEventListener("touchend", this._onTouchEnd, { passive: true });
  }

  detach() {
    this.target.removeEventListener("keydown", this._onKey);
    this.target.removeEventListener("touchstart", this._onTouchStart);
    this.target.removeEventListener("touchend", this._onTouchEnd);
  }

  consume() {
    return this.queue.shift() ?? null;
  }

  clear() {
    this.queue.length = 0;
  }

  _push(action) {
    if (this.queue.length < 3) this.queue.push(action);
  }

  _onKey(e) {
    const map = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      ArrowUp: "jump",
      KeyW: "jump",
      Space: "jump",
      ArrowDown: "slide",
      KeyS: "slide",
    };
    const action = map[e.code];
    if (!action) return;
    e.preventDefault();
    this._push(action);
  }

  _onTouchStart(e) {
    const t = e.changedTouches[0];
    this._touchStart = { x: t.clientX, y: t.clientY, t: performance.now() };
  }

  _onTouchEnd(e) {
    if (!this._touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this._touchStart.x;
    const dy = t.clientY - this._touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const min = 28;
    this._touchStart = null;
    if (absX < min && absY < min) return;
    if (absX > absY) this._push(dx > 0 ? "right" : "left");
    else this._push(dy > 0 ? "slide" : "jump");
  }
}
