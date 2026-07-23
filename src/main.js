import "./style.css";
import { Game } from "./game/Game.js";

const canvas = document.getElementById("game-canvas");
if (!canvas) {
  throw new Error("Missing #game-canvas");
}

new Game(canvas);
