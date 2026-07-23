import * as THREE from "three";

/**
 * Third-person chase camera with light look-ahead & shake on hit.
 */
export class ChaseCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 3.2, 6.5);
    this.lookOffset = new THREE.Vector3(0, 1.2, -6);
    this._current = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._shake = 0;
  }

  reset(playerPos) {
    this._shake = 0;
    this._current.copy(playerPos).add(this.offset);
    this.camera.position.copy(this._current);
    this._look.copy(playerPos).add(this.lookOffset);
    this.camera.lookAt(this._look);
  }

  shake(amount = 0.45) {
    this._shake = Math.max(this._shake, amount);
  }

  update(dt, playerPos, laneX) {
    const desired = this._current;
    desired.set(
      laneX * 0.35,
      playerPos.y + this.offset.y,
      playerPos.z + this.offset.z
    );

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desired.x, 4.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desired.y, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desired.z, 8, dt);

    if (this._shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this._shake;
      this.camera.position.y += (Math.random() - 0.5) * this._shake * 0.6;
      this._shake = THREE.MathUtils.damp(this._shake, 0, 8, dt);
    }

    this._look.set(playerPos.x * 0.4, playerPos.y + 1.1, playerPos.z - 8);
    this.camera.lookAt(this._look);
  }
}
