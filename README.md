# Vice Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun)
[![Rank](https://make.fun/badge/gta6-cover-art-01/memelljk/vice-cover-studio-4/rank.svg)](https://make.fun)
[![Reward](https://make.fun/badge/gta6-cover-art-01/memelljk/vice-cover-studio-4/reward.svg)](https://make.fun)

Turn any photo into bold, multi-panel GTA-style cover art — entirely offline,
in your browser. Your photos are processed on your own machine and are never
uploaded anywhere.

## What it does

- **5-panel multi-photo covers** — assign a different photo to every panel,
  or fill all panels from one photo.
- **3 layouts** — Sunset Grid (hero + 4 panels), Neon Strip (5 vertical
  panels), Vice Duo (2 big panels).
- **4 sunset/neon colour grades** — Sunset, Neon Nights, Vice Pink, Palm Noir.
- **Procedural poster pipeline** — posterize, Sobel comic outlines, gradient-map
  grading, optional halftone dots, vignette and grain turn plain photos into
  poster illustration.
- **Bold caption lettering** — heavy condensed type (Anton, SIL OFL) with a
  thick outline and hard shadow, top or bottom, plus an optional sub-caption.
- **Per-panel crop control** — click a panel, drag to reposition, zoom slider.
- **PNG export in 3 post sizes** — 1080×1080, 1080×1350 and 1920×1080, one
  click each, or all three at once.
- **Instant start** — three built-in demo illustrations (drawn procedurally by
  the app itself, no real-person photos) show a finished cover before you
  upload anything.
- **Fast and private** — a finished cover in a few clicks; zero network calls
  at runtime, everything is a local static file.

## Run it

Open `app/index.html` in a browser, or serve the folder locally:

```
node serve.ts          # serves app/ on http://localhost:8080
```

## Hand-in program

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.
