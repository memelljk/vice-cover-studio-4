// Bootstrap: build the demo photos, wire the editor, expose a tiny
// screenshot hook used only to capture this entry's own screenshots.

import { makeDemoPhotos } from './demo.js';
import { createEditor } from './editor.js';

const $ = (id) => document.getElementById(id);

const els = {
  preview: $('preview'),
  fileInput: $('fileInput'),
  drop: $('drop'),
  thumbs: $('thumbs'),
  layout: $('layout'),
  grade: $('grade'),
  caption: $('caption'),
  sub: $('sub'),
  captionPos: $('captionPos'),
  panelPhoto: $('panelPhoto'),
  photoForPanel: $('photoForPanel'),
  fillAll: $('fillAll'),
  zoom: $('zoom'),
  zoomVal: $('zoomVal'),
  outline: $('outline'),
  halftone: $('halftone'),
  size: $('size'),
  exportBtn: $('exportBtn'),
  exportAll: $('exportAll'),
  status: $('status'),
};

async function boot() {
  // Make sure the display font is ready before the first cover renders,
  // so captions are lettered in Anton from the very first frame.
  try { await document.fonts.load("400 80px 'Anton'"); } catch { /* fallback fonts still render */ }
  const editor = createEditor(els, makeDemoPhotos());
  window.__vice = editor;

  // Screenshot mode for this entry's own captures only:
  // ?shot=cover&size=1920x1080&layout=strip&grade=neon&caption=...&sub=...
  const q = new URLSearchParams(location.search);
  if (q.get('shot')) {
    const st = editor.state;
    if (q.get('caption')) { st.caption = q.get('caption'); els.caption.value = st.caption; }
    if (q.get('sub') !== null && q.get('sub') !== undefined && q.has('sub')) { st.sub = q.get('sub'); els.sub.value = st.sub; }
    if (q.get('layout')) { st.layout = q.get('layout'); els.layout.value = st.layout; }
    if (q.get('grade')) { st.grade = q.get('grade'); els.grade.value = st.grade; }
    if (q.get('pos')) { st.captionPos = q.get('pos'); els.captionPos.value = st.captionPos; }
    if (q.get('halftone') === '1') st.halftone = true;
    st.selectedPanel = -1;
    editor.render();
    if (q.get('shot') === 'cover') {
      const [w, h] = (q.get('size') || '1920x1080').split('x').map(Number);
      const url = editor.exportDataURL(w || 1920, h || 1080);
      window.__shotData = url;
      document.body.innerHTML = '';
      const img = new Image();
      img.id = 'shotImg';
      img.style.cssText = 'display:block;width:100vw;height:100vh;object-fit:contain;background:#000';
      img.onload = () => { window.__shotReady = true; };
      img.src = url;
      document.body.appendChild(img);
    } else {
      window.__shotReady = true;
    }
  }
}

boot();
