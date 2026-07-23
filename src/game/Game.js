import * as THREE from "three";
import { Input } from "./Input.js";
import { Player } from "./Player.js";
import { Track } from "./Track.js";
import { ObstacleManager } from "./ObstacleManager.js";
import { ChaseCamera } from "./ChaseCamera.js";
import { UI } from "./UI.js";
import { GameAudio } from "./Audio.js";
import { COLORS } from "./constants.js";
import { Starfield } from "./Starfield.js";

const BASE_SPEED = 9;
const MAX_SPEED = 20;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ui = new UI();
    this.audio = new GameAudio();
    this.input = new Input(window);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    // Starfield sets scene.background to a starry canvas
    this.scene.fog = new THREE.FogExp2(COLORS.fog, 0.014);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    this._setupLights();
    this.stars = new Starfield(this.scene);

    this.track = new Track(this.scene);
    this.player = new Player(this.scene);
    this.obstacles = new ObstacleManager(this.scene);
    this.chase = new ChaseCamera(this.camera);

    this.mode = "menu"; // menu | playing | paused | dead
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = BASE_SPEED;
    this._starting = false;
    this._clock = new THREE.Clock();
    this._raf = 0;

    this._onResize = this._onResize.bind(this);
    this._onSystemKey = this._onSystemKey.bind(this);
    window.addEventListener("resize", this._onResize);
    window.addEventListener("keydown", this._onSystemKey);

    this.input.attach();
    this.chase.reset(this.player.root.position);
    this.ui.bindMute(() => {
      const muted = this.audio.toggleMute();
      this.ui.setMuteState(muted);
    });
    this.ui.bindVolume((v) => {
      this.audio.setMusicVolume(v);
      this.ui.setVolumeUI(v);
    });
    this.ui.bindSfxVolume((v) => {
      this.audio.setSfxVolume(v);
      this.ui.setSfxVolumeUI(v);
    });
    this.ui.setVolumeUI(this.audio.musicVolume);
    this.ui.setSfxVolumeUI(this.audio.sfxVolume);
    this.ui.setLoading(true);
    this.player.ready.finally(() => {
      this.humanoidIdle();
      this.ui.setLoading(false);
      this.ui.showStart(() => this.start());
    });
    this._loop();
  }

  humanoidIdle() {
    this.player.humanoid.setPose("idle");
  }

  _setupLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 0.7);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 0.95);
    sun.position.set(6, 14, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    this._sun = sun;

    const fill = new THREE.DirectionalLight(0xffffff, 0.28);
    fill.position.set(-8, 6, -4);
    this.scene.add(fill);

    const ambience = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambience);

    this._torchLight = new THREE.PointLight(COLORS.torch, 1.8, 14, 2);
    this._torchLight.position.set(0, 2.5, -2);
    this.scene.add(this._torchLight);
  }

  async start() {
    if (this._starting) return;
    this._starting = true;
    try {
      await this.audio.unlock();
      this.audio.stopMusic();
      await this.audio.startMusic();

      this.track.reset();
      this.obstacles.reset();
      this.player.reset();
      this.input.clear();
      this.score = 0;
      this.coins = 0;
      this.distance = 0;
      this.speed = BASE_SPEED;
      this.mode = "playing";
      this.chase.reset(this.player.root.position);
      this.ui.showPlaying();
      this.ui.setScore(0, 0);
      this.ui.setMuteState(this.audio.muted);
      this.ui.setVolumeUI(this.audio.musicVolume);
      this.ui.setSfxVolumeUI(this.audio.sfxVolume);
      this.ui.startBtn?.blur();
      this._clock.getDelta();
    } finally {
      this._starting = false;
    }
  }

  togglePause() {
    if (this.mode === "playing") {
      this.mode = "paused";
      this.input.clear();
      this.audio.pauseMusic();
      this.ui.showPaused(() => this.resume());
      return;
    }
    if (this.mode === "paused") {
      this.resume();
    }
  }

  resume() {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    this.ui.hidePaused();
    this.ui.showPlaying();
    this.audio.resumeMusic();
    this.input.clear();
    this._clock.getDelta();
  }

  _onSystemKey(e) {
    if (e.repeat) return;

    // Start / restart from menu or game-over
    if (e.code === "Space" && (this.mode === "menu" || this.mode === "dead")) {
      e.preventDefault();
      if (this.ui.startBtn?.disabled) return;
      this.start();
      return;
    }

    if (e.code === "CapsLock") {
      e.preventDefault();
      this.togglePause();
      return;
    }

    // Music volume: - / = (also NumpadAdd/Subtract)
    if (e.code === "Minus" || e.code === "NumpadSubtract") {
      e.preventDefault();
      const v = this.audio.adjustMusicVolume(-0.05);
      this.ui.setVolumeUI(v);
      return;
    }
    if (e.code === "Equal" || e.code === "NumpadAdd") {
      e.preventDefault();
      const v = this.audio.adjustMusicVolume(0.05);
      this.ui.setVolumeUI(v);
      return;
    }

    // SFX / coin volume: [ ]
    if (e.code === "BracketLeft") {
      e.preventDefault();
      const v = this.audio.adjustSfxVolume(-0.05);
      this.ui.setSfxVolumeUI(v);
      return;
    }
    if (e.code === "BracketRight") {
      e.preventDefault();
      const v = this.audio.adjustSfxVolume(0.05);
      this.ui.setSfxVolumeUI(v);
    }
  }

  _gameOver() {
    this.mode = "dead";
    this.player.alive = false;
    this.player.humanoid.setPose("idle");
    this.chase.shake(0.7);
    this.audio.playHit();
    this.audio.stopMusic();
    this.ui.showGameOver(this.score, this.coins, () => this.start());
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this._clock.getDelta());

    if (this.mode === "playing") {
      let action;
      while ((action = this.input.consume())) {
        const before = this.player.state;
        this.player.handleAction(action);
        if (action === "jump" && before === "run" && this.player.state === "jump") {
          this.audio.playJump();
        }
        if (action === "slide" && before === "run" && this.player.state === "slide") {
          this.audio.playSlide();
        }
      }

      this.speed = Math.min(MAX_SPEED, BASE_SPEED + this.distance * 0.012);
      const move = this.speed * dt;
      this.player.root.position.z -= move;
      this.distance += move;
      this.score = this.distance * 1.2 + this.coins * 25;

      const speedFactor = (this.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED || 1);
      this.player.update(dt, speedFactor);

      this.track.update(this.player.root.position.z);
      this.obstacles.update(
        this.player.root.position.z,
        this.player.getHitbox(),
        this.distance,
        (n) => {
          this.coins += n;
          this.audio.playCoin();
        },
        () => this._gameOver()
      );

      this.ui.setScore(this.score, this.coins);
    } else if (this.mode === "paused") {
      // Freeze gameplay; keep rendering last frame pose
    } else {
      this.player.humanoid.update(dt, 0);
    }

    const pp = this.player.root.position;
    this._sun.position.x = pp.x + 6;
    this._sun.position.z = pp.z + 4;
    this._sun.target.position.copy(pp);
    this._sun.target.updateMatrixWorld();
    this._torchLight.position.set(pp.x + 1.2, 2.4, pp.z - 3);

    this.stars.follow(pp);
    this.stars.update(this._clock.elapsedTime);

    this.chase.update(dt, pp, pp.x);
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
