/**
 * HUD + overlay start / pause / game-over panel.
 */
export class UI {
  constructor() {
    this.overlay = document.getElementById("overlay");
    this.pauseOverlay = document.getElementById("pause-overlay");
    this.hud = document.getElementById("hud");
    this.scoreEl = document.getElementById("score-value");
    this.coinEl = document.getElementById("coin-value");
    this.title = document.getElementById("title-heading");
    this.subtitle = document.getElementById("subtitle");
    this.startBtn = document.getElementById("start-btn");
    this.resumeBtn = document.getElementById("resume-btn");
    this.brand = this.overlay?.querySelector(".brand");
    this.muteBtn = document.getElementById("mute-btn");
    this.volumeSlider = document.getElementById("volume-slider");
    this.sfxSlider = document.getElementById("sfx-slider");
    this._onMute = null;
    this._onVolume = null;
    this._onSfxVolume = null;
  }

  bindMute(handler) {
    this._onMute = handler;
    if (this.muteBtn) {
      this.muteBtn.onclick = (e) => {
        e.stopPropagation();
        handler?.();
      };
    }
  }

  bindVolume(handler) {
    this._onVolume = handler;
    if (this.volumeSlider) {
      this.volumeSlider.oninput = (e) => {
        const v = Number(e.target.value) / 100;
        handler?.(v);
      };
    }
  }

  bindSfxVolume(handler) {
    this._onSfxVolume = handler;
    if (this.sfxSlider) {
      this.sfxSlider.oninput = (e) => {
        const v = Number(e.target.value) / 100;
        handler?.(v);
      };
    }
  }

  setVolumeUI(value01) {
    if (!this.volumeSlider) return;
    this.volumeSlider.value = String(Math.round(value01 * 100));
  }

  setSfxVolumeUI(value01) {
    if (!this.sfxSlider) return;
    this.sfxSlider.value = String(Math.round(value01 * 100));
  }

  setLoading(isLoading) {
    if (!this.startBtn || !this.subtitle) return;
    this.startBtn.disabled = !!isLoading;
    if (isLoading) {
      this.subtitle.textContent = "Loading explorer…";
      this.startBtn.textContent = "Loading…";
    }
  }

  setMuteState(muted) {
    if (!this.muteBtn) return;
    this.muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    this.muteBtn.textContent = muted ? "Sound Off" : "Sound On";
    this.muteBtn.title = muted ? "Unmute" : "Mute";
  }

  showStart(onStart) {
    this.hud.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    this.overlay.hidden = false;
    if (this.brand) this.brand.textContent = "clickr run";
    this.title.textContent = "Ruins Await";
    this.subtitle.textContent =
      "Swipe or use arrows — dodge, jump, slide through the temple path.";
    this.startBtn.textContent = "Begin Run";
    this.startBtn.onclick = () => onStart();
  }

  showGameOver(score, coins, onRestart) {
    this.hud.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    this.overlay.hidden = false;
    if (this.brand) this.brand.textContent = "clickr run";
    this.title.textContent = "Fallen Explorer";
    this.subtitle.textContent = `Score ${Math.floor(score)} · Coins ${coins}. The temple claims another runner.`;
    this.startBtn.textContent = "Run Again";
    this.startBtn.onclick = () => onRestart();
    this.startBtn.focus();
  }

  showPlaying() {
    this.overlay.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    this.hud.hidden = false;
  }

  showPaused(onResume) {
    if (this.pauseOverlay) {
      this.pauseOverlay.hidden = false;
      if (this.resumeBtn) {
        this.resumeBtn.onclick = () => onResume?.();
        this.resumeBtn.focus();
      }
    }
  }

  hidePaused() {
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
  }

  setScore(score, coins) {
    this.scoreEl.textContent = String(Math.floor(score));
    this.coinEl.textContent = String(coins);
  }
}
