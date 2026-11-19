// Cover rendering pipeline: every effect is procedural, computed on canvas
// in the visitor's browser. Photos never leave the machine.
//
// Per panel: cover-fit draw -> posterize -> Sobel comic outline ->
// gradient-map colour grade -> optional halftone -> vignette + grain.
// Then thick white panel gutters, a caption block with heavy outline and
// shadow, and a small sub-caption.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    stops: [[0, '#1a0533'], [0.28, '#7b1e5e'], [0.52, '#e83e6b'], [0.74, '#ff7e3d'], [1, '#ffd76e']],
    tint: 'rgba(255,110,64,0.10)',
  },
  neon: {
    label: 'Neon Nights',
    stops: [[0, '#05052e'], [0.3, '#27349e'], [0.55, '#b03ae0'], [0.78, '#00d5f5'], [1, '#e0f7fa']],
    tint: 'rgba(0,229,255,0.08)',
  },
  vice: {
    label: 'Vice Pink',
    stops: [[0, '#2d0a31'], [0.32, '#7e1e9e'], [0.58, '#ec407a'], [0.8, '#ff8fab'], [1, '#ffe3ee']],
    tint: 'rgba(255,46,136,0.10)',
  },
  noir: {
    label: 'Palm Noir',
    stops: [[0, '#00120f'], [0.34, '#00554d'], [0.6, '#2e7d6b'], [0.82, '#c9a227'], [1, '#fff3c4']],
    tint: 'rgba(0,40,32,0.12)',
  },
};

export const LAYOUTS = {
  sunset: { label: 'Sunset Grid — hero + 4 panels', panels: 5 },
  strip: { label: 'Neon Strip — 5 vertical panels', panels: 5 },
  duo: { label: 'Vice Duo — 2 big panels', panels: 2 },
};

// Panel rectangles (fractions of the cover) for each layout.
export function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(w * 0.008)); // gutter
  if (layout === 'strip') {
    const pw = (w - g * 6) / 5;
    return Array.from({ length: 5 }, (_, i) => ({ x: g + i * (pw + g), y: g, w: pw, h: h - g * 2 }));
  }
  if (layout === 'duo') {
    const pw = (w - g * 3) / 2;
    return [0, 1].map((i) => ({ x: g + i * (pw + g), y: g, w: pw, h: h - g * 2 }));
  }
  // sunset grid: hero left ~58%, two stacked right top, two along the bottom
  const heroW = (w - g * 3) * 0.58;
  const sideW = w - g * 3 - heroW;
  const heroH = (h - g * 3) * 0.66;
  const botH = h - g * 3 - heroH;
  const sideH = (heroH - g) / 2;
  const botW = (w - g * 4) / 3;
  return [
    { x: g, y: g, w: heroW, h: heroH },
    { x: g * 2 + heroW, y: g, w: sideW, h: sideH },
    { x: g * 2 + heroW, y: g * 2 + sideH, w: sideW, h: sideH },
    { x: g, y: g * 2 + heroH, w: botW, h: botH },
    { x: g * 2 + botW, y: g * 2 + heroH, w: w - g * 3 - botW, h: botH },
  ];
}

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function gradeLut(stops) {
  const pts = stops.map(([o, col]) => [o, hexRgb(col)]);
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = pts[0], b = pts[pts.length - 1];
    for (let s = 0; s < pts.length - 1; s++) {
      if (t >= pts[s][0] && t <= pts[s + 1][0]) { a = pts[s]; b = pts[s + 1]; break; }
    }
    const span = Math.max(1e-6, b[0] - a[0]);
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = Math.round(a[1][ch] + (b[1][ch] - a[1][ch]) * f);
  }
  return lut;
}

const lutCache = new Map();
function lutFor(gradeKey) {
  if (!lutCache.has(gradeKey)) lutCache.set(gradeKey, gradeLut(GRADES[gradeKey].stops));
  return lutCache.get(gradeKey);
}

// Process one panel's pixels in place.
function processPanel(ctx, w, h, opts) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const lum = new Float32Array(w * h);
  const levels = 5;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    // posterize each channel first: flattens photo detail into poster bands
    for (let ch = 0; ch < 3; ch++) {
      const v = d[i + ch] / 255;
      d[i + ch] = Math.round(Math.round(v * (levels - 1)) / (levels - 1) * 255);
    }
    lum[p] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  }
  // Sobel edge magnitude -> darken strong edges into comic outlines
  const edge = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let xx = 1; xx < w - 1; xx++) {
      const p = y * w + xx;
      const gx = -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1] + lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
      const gy = -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1] + lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
      edge[p] = Math.min(255, Math.abs(gx) + Math.abs(gy));
    }
  }
  const lut = lutFor(opts.grade);
  const outline = opts.outline; // 0..1
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const l = Math.max(0, Math.min(255, Math.round(lum[p])));
    let r = lut[l * 3], gcol = lut[l * 3 + 1], b = lut[l * 3 + 2];
    // keep a slice of the posterized original hue so faces/objects stay readable
    r = r * 0.8 + d[i] * 0.2; gcol = gcol * 0.8 + d[i + 1] * 0.2; b = b * 0.8 + d[i + 2] * 0.2;
    const e = edge[p];
    if (e > 90) {
      const k = Math.max(0, 1 - outline * Math.min(1, (e - 90) / 160) * 0.92);
      r *= k; gcol *= k; b *= k;
    }
    d[i] = r; d[i + 1] = gcol; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
  if (opts.halftone) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,24,0.28)';
    const step = Math.max(7, Math.round(w / 90));
    for (let y = step / 2; y < h; y += step) {
      for (let xx = ((y / step) % 2) * step / 2 + step / 2; xx < w; xx += step) {
        ctx.beginPath(); ctx.arc(xx, y, step * 0.16, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawPhotoCover(ctx, photo, rect) {
  const src = photo.source;
  const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
  if (!sw || !sh) return;
  const zoom = photo.zoom || 1;
  const scale = Math.max(rect.w / sw, rect.h / sh) * zoom;
  const dw = sw * scale, dh = sh * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (photo.ox || 0) * rect.w * 0.4;
  const dy = rect.y + (rect.h - dh) / 2 + (photo.oy || 0) * rect.h * 0.4;
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  ctx.drawImage(src, dx, dy, dw, dh);
  ctx.restore();
}

// Render the full cover into ctx at size w x h.
export function renderCover(ctx, w, h, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#0d0618';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  const tmp = document.createElement('canvas');
  rects.forEach((rect, i) => {
    const photo = state.photos[state.panelPhoto[i] ?? i % Math.max(1, state.photos.length)] || state.photos[0];
    const pw = Math.max(2, Math.round(rect.w)), ph = Math.max(2, Math.round(rect.h));
    tmp.width = pw; tmp.height = ph;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = '#1a0b2e'; tctx.fillRect(0, 0, pw, ph);
    if (photo) drawPhotoCover(tctx, photo, { x: 0, y: 0, w: pw, h: ph });
    processPanel(tctx, pw, ph, { grade: state.grade, outline: state.outline, halftone: state.halftone });
    ctx.drawImage(tmp, rect.x, rect.y);
    // panel frame: bright outer line + dark inner line, GTA poster style
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = Math.max(1.5, w * 0.0018);
    ctx.strokeStyle = 'rgba(8,2,20,0.9)';
    ctx.strokeRect(rect.x + w * 0.004, rect.y + w * 0.004, rect.w - w * 0.008, rect.h - w * 0.008);
    if (state.selectedPanel === i) {
      ctx.lineWidth = Math.max(3, w * 0.005);
      ctx.strokeStyle = '#00e5ff';
      ctx.setLineDash([w * 0.02, w * 0.012]);
      ctx.strokeRect(rect.x - w * 0.006, rect.y - w * 0.006, rect.w + w * 0.012, rect.h + w * 0.012);
      ctx.setLineDash([]);
    }
  });
  // grade tint + vignette + grain over the whole cover
  ctx.fillStyle = grade.tint; ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,0,14,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
  let seed = 1234567;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < Math.round(w * h / 2600); i++) ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  ctx.restore();
  drawCaption(ctx, w, h, state);
}

function fitFont(ctx, text, weight, maxSize, maxWidth, family) {
  let size = maxSize;
  while (size > 12) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

function drawCaption(ctx, w, h, state) {
  const caption = (state.caption || '').trim().toUpperCase();
  if (!caption) return;
  const family = `'Anton', 'Arial Narrow Bold', sans-serif`;
  const maxW = w * 0.92;
  const words = caption.split(/\s+/);
  // wrap to at most two lines, balanced
  let lines = [caption];
  if (ctx.measureText(caption).width > 0 && words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const score = Math.abs(a.length - b.length);
      if (!best || score < best.score) best = { lines: [a, b], score };
    }
    ctx.font = `400 ${Math.round(h * 0.16)}px ${family}`;
    if (ctx.measureText(caption).width > maxW || caption.length > 14) lines = best.lines;
  }
  const size = Math.min(...lines.map((ln) => fitFont(ctx, ln, '400', Math.round(h * 0.185), maxW, family)));
  const lineH = size * 1.04;
  const blockH = lineH * lines.length + (state.sub ? size * 0.52 : 0);
  const baseY = state.captionPos === 'top' ? h * 0.055 : h - h * 0.055 - blockH;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = `400 ${size}px ${family}`;
  lines.forEach((ln, i) => {
    const y = baseY + i * lineH;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(10,0,24,0.85)'; ctx.shadowBlur = 0;
    ctx.shadowOffsetX = size * 0.06; ctx.shadowOffsetY = size * 0.07;
    ctx.lineWidth = size * 0.26; ctx.strokeStyle = '#0d0618';
    ctx.strokeText(ln, w / 2, y);
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    const grad = ctx.createLinearGradient(0, y, 0, y + size);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.55, '#ffe9f4'); grad.addColorStop(1, '#ffb3d1');
    ctx.fillStyle = grad;
    ctx.fillText(ln, w / 2, y);
  });
  if (state.sub) {
    const sub = state.sub.trim().toUpperCase();
    const ss = fitFont(ctx, sub, '400', Math.round(size * 0.34), maxW * 0.8, family);
    ctx.font = `400 ${ss}px ${family}`;
    const y = baseY + lineH * lines.length + size * 0.1;
    ctx.lineJoin = 'round';
    ctx.lineWidth = ss * 0.2; ctx.strokeStyle = '#0d0618';
    ctx.strokeText(sub, w / 2, y);
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(sub, w / 2, y);
  }
}

export function exportDataURL(state, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const clean = { ...state, selectedPanel: -1 };
  renderCover(c.getContext('2d'), w, h, clean);
  return c.toDataURL('image/png');
}
