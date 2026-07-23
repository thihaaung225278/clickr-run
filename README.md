# clickr run

Three.js endless runner (Temple Run–style) built with Vite and vanilla JavaScript.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Controls

| Input | Action |
| --- | --- |
| ← / A or swipe left | Change lane left |
| → / D or swipe right | Change lane right |
| ↑ / W / Space or swipe up | Jump |
| ↓ / S or swipe down | Slide |

## Audio

BGM uses `public/audio/My Way - NEFFEX.mp3` (**NEFFEX – My Way**). Missing file → synth fallback.

## Assets

- Character: Mixamo **Soldier.glb** from the official [three.js walk example](https://threejs.org/examples/#webgl_animation_walk) (vendored at `public/models/Soldier.glb`).

## Build

```bash
npm run build
npm run preview
```
