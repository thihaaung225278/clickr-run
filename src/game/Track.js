import * as THREE from "three";
import { COLORS, LANE_WIDTH } from "./constants.js";

const SEGMENT_LEN = 20;
const SEGMENT_COUNT = 10;

/**
 * Endless path: white runway & walls, black pillars, Clickr logos on side walls.
 */
export class Track {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "Track";
    scene.add(this.group);

    this.segments = [];
    this._nextZ = 0;

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0,
    });
    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.02,
    });
    // Side / arch pillars — black
    this.darkMat = new THREE.MeshStandardMaterial({
      color: COLORS.clickrDark,
      roughness: 0.88,
      metalness: 0.05,
    });
    // Clickr theme center stripe
    this.stripeMat = new THREE.MeshStandardMaterial({
      color: COLORS.clickrOrange,
      emissive: COLORS.clickrOrange,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.logoWallMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this._loadBrandTextures();

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      this._spawnSegment(this._nextZ);
      this._nextZ -= SEGMENT_LEN;
    }
  }

  _loadBrandTextures() {
    const loader = new THREE.TextureLoader();
    loader.load(
      "/textures/clickr-logo-wall.png",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        this.logoWallMat.map = tex;
        this.logoWallMat.needsUpdate = true;
      },
      undefined,
      () => {
        console.warn("[Track] Failed to load clickr-logo-wall.png");
      }
    );
  }

  reset() {
    while (this.segments.length) {
      const seg = this.segments.pop();
      this.group.remove(seg);
      seg.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    }
    this._nextZ = 0;
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      this._spawnSegment(this._nextZ);
      this._nextZ -= SEGMENT_LEN;
    }
  }

  update(playerZ) {
    while (this.segments.length && this.segments[0].position.z > playerZ + 25) {
      const old = this.segments.shift();
      this.group.remove(old);
      old.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      this._spawnSegment(this._nextZ);
      this._nextZ -= SEGMENT_LEN;
    }
  }

  _spawnSegment(z) {
    const seg = new THREE.Group();
    seg.position.z = z;

    const pathW = LANE_WIDTH * 3 + 1.2;
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(pathW, 0.35, SEGMENT_LEN),
      this.floorMat
    );
    floor.position.y = -0.175;
    floor.receiveShadow = true;
    seg.add(floor);

    // Clickr orange center line
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.06, SEGMENT_LEN * 0.98),
      this.stripeMat
    );
    stripe.position.y = 0.02;
    stripe.receiveShadow = true;
    seg.add(stripe);

    // White side walls + black pillars; logo in EVERY gap between consecutive pillars
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 3.2, SEGMENT_LEN),
        this.wallMat
      );
      wall.position.set(side * (pathW * 0.5 + 1.1), 1.4, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      seg.add(wall);

      // Two pillars per side
      const pillarZs = [-SEGMENT_LEN * 0.25, SEGMENT_LEN * 0.25];
      for (const pz of pillarZs) {
        const pillar = this._pillar();
        pillar.position.set(side * (pathW * 0.5 - 0.2), 0, pz);
        seg.add(pillar);
      }

      // Mid between this segment's two pillars
      this._addWallLogo(seg, side, pathW, 0);
      // Mid between this segment's front pillar and the next segment's back pillar
      this._addWallLogo(seg, side, pathW, -SEGMENT_LEN * 0.5);
    });

    this.group.add(seg);
    this.segments.push(seg);
  }

  /** One logo on the corridor wall, centered between a pillar pair. */
  _addWallLogo(seg, side, pathW, midZ) {
    const wallHalf = 1.1;
    const wallCenterX = side * (pathW * 0.5 + wallHalf);
    const innerFaceX = wallCenterX - side * wallHalf;
    const x = innerFaceX - side * 0.12;
    const face = side > 0 ? -Math.PI / 2 : Math.PI / 2;

    // Texture ~864×293 — keep aspect so "clickr" stays centered on white
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 1.36),
      this.logoWallMat
    );
    panel.position.set(x, 1.75, midZ);
    panel.rotation.y = face;
    panel.renderOrder = 2;
    seg.add(panel);
  }

  _pillar() {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 2.8, 8),
      this.darkMat
    );
    shaft.position.y = 1.4;
    shaft.castShadow = true;
    g.add(shaft);
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.22, 0.9),
      this.darkMat
    );
    cap.position.y = 2.9;
    g.add(cap);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.25, 0.85),
      this.darkMat
    );
    base.position.y = 0.12;
    g.add(base);
    return g;
  }
}
