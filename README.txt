Portrait Side‑Scroller (Arcade‑Style) — Starter
=================================================

What this is
------------
A fully playable portrait side‑scroller scaffold built with Phaser 3. It uses generated placeholder
textures so it runs immediately. You can replace them with your own assets to match the style in your video.

How to run
----------
Open `index.html` in a local web server (e.g., VS Code Live Server) or host on GitHub Pages.
The game is portrait; if you rotate to landscape, a guard overlay appears.

Controls
--------
- Tap / Click / Space / Up Arrow = Jump (double‑jump supported).
- Avoid spikes, collect coins, keep running. Score increases over time and by collecting coins.
- Lose all hearts and it's game over (tap to restart).

Where to plug in your assets
----------------------------
This starter *generates* textures at runtime (so it works even without files).
To integrate your own art/audio, replace the generated textures with real files. A simple approach:

1) Put your files under an `assets/` folder next to index.html, like:
   assets/
     background/sky.png
     background/parallax_far.png
     background/parallax_mid.png
     background/parallax_near.png
     ground/ground_tile.png
     player/player_run.png
     player/player_jump.png
     enemies/spike.png
     collectibles/coin.png
     ui/heart.png
     audio/jump.mp3
     audio/coin.mp3
     audio/hit.mp3
     audio/music.mp3

2) In `BootScene.create()`, replace the texture generation with `this.load.image(...)` (or `this.load.spritesheet(...)`)
   calls inside `preload()`, then `this.add.image(...)` / `this.add.tileSprite(...)` in `create()`.
   (See the ASSET SPEC list below for the filenames/sizes.)

Recommended asset spec (filenames + sizes)
-----------------------------------------
**Backgrounds** (portrait 9:16; all PNGs, power-of-two preferred but not required)
- assets/background/sky.png                → 720x1280 or 1080x1920. Fullscreen static base.
- assets/background/parallax_far.png       → 720x1280 or 1024x2048. Subtle pattern; tileable.
- assets/background/parallax_mid.png       → 720x1280 or 1024x2048. Stronger pattern; tileable.
- assets/background/parallax_near.png      → 720x1280 or 1024x2048. Star/particle layer; tileable.

**Ground**
- assets/ground/ground_tile.png            → 1024x128 (tileable horizontally; no visible seams).

**Player (spritesheet)**
- assets/player/player_run.png             → e.g., 8 frames, each 128x128 (1024x128 total). Transparent background.
- assets/player/player_jump.png            → single frame (128x128).
  (If you prefer an atlas, supply JSON + image; update loader accordingly.)

**Obstacles**
- assets/enemies/spike.png                 → 128x128 triangle or spike with transparency.
  (Add more: crate.png 128x128, saw.png 128x128, etc. Each with clear silhouette.)

**Collectibles**
- assets/collectibles/coin.png             → spritesheet 6x frames (60–96px diameter). Or a single static frame.

**UI**
- assets/ui/heart.png                      → ~64x64. Solid interior + stroke for visibility.
- assets/ui/pause.png                      → ~64x64 (optional).
- Web font (optional)                      → Use @font-face in CSS or Google Fonts for the HUD.

**Audio** (provide both MP3 and OGG for cross‑browser if possible)
- assets/audio/jump.mp3(.ogg)
- assets/audio/coin.mp3(.ogg)
- assets/audio/hit.mp3(.ogg)
- assets/audio/music.mp3(.ogg)             → short loop (−14 LUFS target, seamless loop points).

Tuning the feel
---------------
- WORLD_SCROLL_SPEED (default 280) controls how fast the world moves left.
- SPAWN_EVERY_MS controls obstacle frequency.
- GRAVITY_Y, JUMP_VELOCITY, DOUBLE_JUMP_VELOCITY adjust jump feel.
- Ground height is ~78% of screen height in PlayScene.

Adapting to your video specifics
--------------------------------
If your video shows different mechanics (e.g., shooting, enemies, power‑ups, lanes, etc.), we can
extend this scaffold quickly:
- Add projectile group and fire on tap/hold; add enemy spawners and hit reactions.
- Swap endless ground for discrete platforms with gaps and moving patterns.
- Introduce lane switching (3 lanes) vs. analog jump arcs.
- Add combo scoring, time pressure, and boss encounters.

Notes
-----
- This project pulls Phaser via CDN. If you need offline, download Phaser and reference locally.
- Mobile Safari: keep audio silent until first tap. You may need user gesture to start music.
- To “lock” orientation on iOS you typically need a PWA. Here we show a guard overlay instead.
