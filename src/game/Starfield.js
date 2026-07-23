import * as THREE from "three";

/**
 * Night sky: starry canvas background + twinkling point stars (fog-immune).
 */
export class Starfield {
  constructor(scene, count = 2200) {
    this.scene = scene;
    this._twinkle = new Float32Array(count);
    this._phases = new Float32Array(count);

    // Always-visible sky backdrop (not affected by fog)
    this._bgCanvas = document.createElement("canvas");
    this._bgCanvas.width = 1536;
    this._bgCanvas.height = 1536;
    this._bgCtx = this._bgCanvas.getContext("2d");
    this._bgCtx.imageSmoothingEnabled = true;
    this._bgDot = this._makeBgDot("255,255,255");
    this._bgDotCool = this._makeBgDot("180,205,255");
    this._bgStars = this._seedBgStars(900);
    this._paintBackground(0);
    this._bgTex = new THREE.CanvasTexture(this._bgCanvas);
    this._bgTex.colorSpace = THREE.SRGBColorSpace;
    this._bgTex.minFilter = THREE.LinearFilter;
    this._bgTex.magFilter = THREE.LinearFilter;
    this._bgTex.generateMipmaps = false;
    scene.background = this._bgTex;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - Math.random() * 0.95);
      const r = 28 + Math.random() * 55;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 6;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const tint = Math.random();
      if (tint < 0.72) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      } else if (tint < 0.9) {
        colors[i * 3] = 0.7;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 0.65;
      }

      this._phases[i] = Math.random() * Math.PI * 2;
      this._twinkle[i] = 0.35 + Math.random() * 0.85;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.25,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      map: this._makeSprite(),
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = -10;
    scene.add(this.points);

    this._baseColors = colors.slice();
    this._colorAttr = geo.getAttribute("color");
    this._t = 0;
  }

  _makeBgDot(rgb) {
    const size = 32;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.3, `rgba(${rgb},0.55)`);
    g.addColorStop(0.65, `rgba(${rgb},0.12)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return c;
  }

  _seedBgStars(n) {
    const w = this._bgCanvas.width;
    const h = this._bgCanvas.height;
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.2 + Math.random() * 3.2,
        base: 0.35 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
        // Slower pulse → smoother perceived motion
        speed: 0.35 + Math.random() * 0.9,
        cool: Math.random() > 0.78,
      });
    }
    return stars;
  }

  _paintBackground(t) {
    const ctx = this._bgCtx;
    const w = this._bgCanvas.width;
    const h = this._bgCanvas.height;
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);

    // Soft milky band
    const band = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.75);
    band.addColorStop(0, "rgba(20,28,55,0)");
    band.addColorStop(0.5, "rgba(40,55,100,0.22)");
    band.addColorStop(1, "rgba(20,28,55,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);

    for (const s of this._bgStars) {
      // Smoothstep on sine for softer twinkle
      const wave = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const tw = 0.4 + 0.6 * (wave * wave * (3 - 2 * wave));
      const size = s.r * 2 * (0.85 + tw * 0.35);
      const half = size * 0.5;
      ctx.globalAlpha = s.base * tw;
      ctx.drawImage(
        s.cool ? this._bgDotCool : this._bgDot,
        s.x - half,
        s.y - half,
        size,
        size
      );
    }
    ctx.globalAlpha = 1;
  }

  _makeSprite() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,0.85)");
    g.addColorStop(0.45, "rgba(200,220,255,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  follow(target) {
    this.points.position.x = target.x;
    this.points.position.y = Math.max(0, target.y);
    this.points.position.z = target.z;
  }

  update(t) {
    this._t = t;
    // Every-frame backdrop so twinkle stays continuous (was ~20fps → choppy)
    this._paintBackground(t);
    this._bgTex.needsUpdate = true;

    const colors = this._colorAttr.array;
    const base = this._baseColors;
    for (let i = 0; i < this._phases.length; i++) {
      const wave =
        0.5 + 0.5 * Math.sin(t * this._twinkle[i] + this._phases[i]);
      const eased = wave * wave * (3 - 2 * wave);
      const twinkle = 0.4 + 0.6 * eased;
      const i3 = i * 3;
      colors[i3] = base[i3] * twinkle;
      colors[i3 + 1] = base[i3 + 1] * twinkle;
      colors[i3 + 2] = base[i3 + 2] * twinkle;
    }
    this._colorAttr.needsUpdate = true;
  }
}
