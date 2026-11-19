// Editor state and interactions: uploads, per-panel photo assignment,
// drag to reposition, zoom, captions, layout/grade pickers, PNG export.

import { LAYOUTS, panelRects, renderCover, exportDataURL } from './cover.js';

export const SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export function createEditor(els, initialPhotos) {
  const state = {
    photos: initialPhotos,
    panelPhoto: [0, 1, 2, 0, 1],
    layout: 'sunset',
    grade: 'sunset',
    caption: 'VICE CITY HEAT',
    sub: 'One city. No brakes.',
    captionPos: 'bottom',
    outline: 0.85,
    halftone: false,
    selectedPanel: 0,
    sizeIdx: 2,
  };

  const preview = els.preview;
  const pctx = preview.getContext('2d');

  function currentSize() { return SIZES[state.sizeIdx]; }

  function render() {
    const { w, h } = currentSize();
    const maxW = 940;
    const scale = Math.min(1, maxW / w);
    preview.width = Math.round(w * scale);
    preview.height = Math.round(h * scale);
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    renderCover(off.getContext('2d'), w, h, state);
    pctx.clearRect(0, 0, preview.width, preview.height);
    pctx.drawImage(off, 0, 0, preview.width, preview.height);
    syncControls();
  }

  let renderQueued = false;
  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }

  function panelCount() { return LAYOUTS[state.layout].panels; }

  function photoForPanel(i) {
    const idx = state.panelPhoto[i] ?? 0;
    return state.photos[Math.min(idx, state.photos.length - 1)];
  }

  function syncControls() {
    els.panelPhoto.innerHTML = '';
    for (let i = 0; i < panelCount(); i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Panel ${i + 1}`;
      els.panelPhoto.appendChild(opt);
    }
    els.panelPhoto.value = String(Math.min(state.selectedPanel, panelCount() - 1));
    els.photoForPanel.innerHTML = '';
    state.photos.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.name;
      els.photoForPanel.appendChild(opt);
    });
    const cur = photoForPanel(state.selectedPanel);
    els.photoForPanel.value = String(state.photos.indexOf(cur));
    if (cur) {
      els.zoom.value = String(Math.round((cur.zoom || 1) * 100));
      els.zoomVal.textContent = `${Math.round((cur.zoom || 1) * 100)}%`;
    }
    els.thumbs.innerHTML = '';
    state.photos.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'thumb';
      b.title = p.name;
      const c = document.createElement('canvas');
      c.width = 72; c.height = 54;
      c.getContext('2d').drawImage(p.source, 0, 0, 72, 54);
      const s = document.createElement('span');
      s.textContent = `${i + 1}. ${p.name}`;
      b.append(c, s);
      b.addEventListener('click', () => {
        state.panelPhoto[state.selectedPanel] = i;
        requestRender();
      });
      els.thumbs.appendChild(b);
    });
    els.status.textContent =
      `${state.photos.length} photo(s) · ${LAYOUTS[state.layout].label} · panel ${state.selectedPanel + 1} selected — drag the preview to reposition its photo.`;
  }

  // --- uploads -------------------------------------------------------------
  function addFiles(files) {
    const imgs = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 5 - 0);
    let pending = imgs.length;
    if (!pending) return;
    const added = [];
    imgs.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        added.push({ source: img, name: file.name, zoom: 1, ox: 0, oy: 0 });
        if (--pending === 0) finish();
      };
      img.onerror = () => { if (--pending === 0) finish(); };
      img.src = url;
    });
    function finish() {
      // first upload replaces the demo set so the cover is fully the user's
      if (state.photos.some((p) => p.name.startsWith('Demo'))) state.photos = [];
      state.photos = [...state.photos, ...added].slice(0, 5);
      state.panelPhoto = state.panelPhoto.map((_, i) => i % state.photos.length);
      requestRender();
    }
  }

  els.fileInput.addEventListener('change', () => { addFiles(els.fileInput.files); els.fileInput.value = ''; });
  ['dragover', 'dragleave', 'drop'].forEach((ev) =>
    els.drop.addEventListener(ev, (e) => {
      e.preventDefault();
      els.drop.classList.toggle('over', ev === 'dragover');
      if (ev === 'drop') addFiles(e.dataTransfer.files);
    }));

  // --- preview drag / panel pick -------------------------------------------
  let drag = null;
  function previewPos(e) {
    const r = preview.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  preview.addEventListener('pointerdown', (e) => {
    const pos = previewPos(e);
    const rects = panelRects(state.layout, 1000, 1000 * (preview.height / preview.width));
    const hit = rects.findIndex((rc) =>
      pos.x * 1000 >= rc.x && pos.x * 1000 <= rc.x + rc.w &&
      pos.y * (1000 * (preview.height / preview.width)) >= rc.y &&
      pos.y * (1000 * (preview.height / preview.width)) <= rc.y + rc.h);
    if (hit >= 0) state.selectedPanel = hit;
    const photo = photoForPanel(state.selectedPanel);
    drag = { startX: e.clientX, startY: e.clientY, ox: photo.ox || 0, oy: photo.oy || 0, photo };
    preview.setPointerCapture(e.pointerId);
    requestRender();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = preview.getBoundingClientRect();
    drag.photo.ox = Math.max(-1, Math.min(1, drag.ox + (e.clientX - drag.startX) / r.width * 1.6));
    drag.photo.oy = Math.max(-1, Math.min(1, drag.oy + (e.clientY - drag.startY) / r.height * 1.6));
    requestRender();
  });
  preview.addEventListener('pointerup', () => { drag = null; });

  // --- controls --------------------------------------------------------------
  els.panelPhoto.addEventListener('change', () => { state.selectedPanel = Number(els.panelPhoto.value); requestRender(); });
  els.photoForPanel.addEventListener('change', () => {
    state.panelPhoto[state.selectedPanel] = Number(els.photoForPanel.value);
    requestRender();
  });
  els.zoom.addEventListener('input', () => {
    const photo = photoForPanel(state.selectedPanel);
    if (photo) photo.zoom = Number(els.zoom.value) / 100;
    requestRender();
  });
  els.layout.addEventListener('change', () => { state.layout = els.layout.value; state.selectedPanel = 0; requestRender(); });
  els.grade.addEventListener('change', () => { state.grade = els.grade.value; requestRender(); });
  els.caption.addEventListener('input', () => { state.caption = els.caption.value; requestRender(); });
  els.sub.addEventListener('input', () => { state.sub = els.sub.value; requestRender(); });
  els.captionPos.addEventListener('change', () => { state.captionPos = els.captionPos.value; requestRender(); });
  els.outline.addEventListener('input', () => { state.outline = Number(els.outline.value) / 100; requestRender(); });
  els.halftone.addEventListener('change', () => { state.halftone = els.halftone.checked; requestRender(); });
  els.size.addEventListener('change', () => { state.sizeIdx = Number(els.size.value); requestRender(); });
  els.fillAll.addEventListener('click', () => {
    const idx = state.panelPhoto[state.selectedPanel] ?? 0;
    state.panelPhoto = state.panelPhoto.map(() => idx);
    requestRender();
  });

  els.exportBtn.addEventListener('click', () => {
    const { w, h } = currentSize();
    const a = document.createElement('a');
    a.download = `vice-cover-${w}x${h}.png`;
    a.href = exportDataURL(state, w, h);
    a.click();
    els.status.textContent = `Exported PNG ${w} × ${h}.`;
  });
  els.exportAll.addEventListener('click', () => {
    SIZES.forEach(({ w, h }, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.download = `vice-cover-${w}x${h}.png`;
        a.href = exportDataURL(state, w, h);
        a.click();
      }, i * 350);
    });
    els.status.textContent = 'Exporting all 3 post sizes…';
  });

  render();
  return { state, render, exportDataURL: (w, h) => exportDataURL(state, w, h) };
}
