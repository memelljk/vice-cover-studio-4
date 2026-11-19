// Procedural demo artwork, drawn by the app itself on canvas at load.
// No photographs of real people: every demo image is a flat illustration
// painted with canvas paths (a stylised figure, a beach, a boulevard).

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function sky(x, w, h, stops) {
  const g = x.createLinearGradient(0, 0, 0, h);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
}

function sun(x, cx, cy, r, col) {
  x.fillStyle = col;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  // retro band cuts through the sun
  x.save();
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) x.fillRect(cx - r, cy + r * 0.15 + i * r * 0.22, r * 2, r * 0.07);
  x.restore();
}

function palm(x, bx, by, s, col) {
  x.strokeStyle = col; x.fillStyle = col;
  x.lineWidth = 10 * s; x.lineCap = 'round';
  x.beginPath(); x.moveTo(bx, by);
  x.quadraticCurveTo(bx + 18 * s, by - 90 * s, bx + 46 * s, by - 150 * s); x.stroke();
  const tx = bx + 46 * s, ty = by - 150 * s;
  for (const a of [-2.9, -2.3, -1.7, -1.0, -0.4]) {
    x.beginPath(); x.moveTo(tx, ty);
    x.quadraticCurveTo(tx + Math.cos(a) * 55 * s, ty + Math.sin(a) * 40 * s - 14 * s,
      tx + Math.cos(a) * 95 * s, ty + Math.sin(a) * 62 * s + 18 * s); x.stroke();
  }
}

function sea(x, w, y0, h, colA, colB) {
  const g = x.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, colA); g.addColorStop(1, colB);
  x.fillStyle = g; x.fillRect(0, y0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 26; i++) {
    const y = y0 + 8 + Math.random() * (h - 16);
    x.fillRect(Math.random() * w, y, 18 + Math.random() * 42, 3);
  }
}

// Demo 1: flat-style portrait figure against a sunset, palms either side.
function portrait() {
  const c = canvas(800, 1000), x = c.getContext('2d');
  sky(x, 800, 1000, [[0, '#2b1055'], [0.45, '#7597de'], [0.62, '#ff7e5f'], [0.8, '#feb47b'], [1, '#ff5e8a']]);
  sun(x, 400, 560, 190, '#ffd76e');
  sea(x, 800, 700, 300, '#ff8c69', '#7b2ff7');
  palm(x, 60, 760, 1.5, '#1d0f38'); palm(x, 720, 780, 1.3, '#1d0f38');
  // shoulders / jacket
  x.fillStyle = '#12102e';
  x.beginPath(); x.moveTo(400, 1000); x.moveTo(180, 1000);
  x.quadraticCurveTo(200, 760, 330, 700); x.lineTo(470, 700);
  x.quadraticCurveTo(600, 760, 620, 1000); x.closePath(); x.fill();
  x.fillStyle = '#ff2e88';
  x.beginPath(); x.moveTo(330, 700); x.lineTo(400, 830); x.lineTo(470, 700); x.lineTo(435, 690); x.lineTo(400, 760); x.lineTo(365, 690); x.closePath(); x.fill();
  // neck + head
  x.fillStyle = '#c97b4a'; x.fillRect(368, 590, 64, 120);
  x.fillStyle = '#e09a63';
  x.beginPath(); x.ellipse(400, 500, 118, 148, 0, 0, Math.PI * 2); x.fill();
  // hair
  x.fillStyle = '#17122e';
  x.beginPath(); x.ellipse(400, 408, 122, 78, 0, Math.PI, Math.PI * 2); x.fill();
  x.fillRect(278, 400, 26, 120); x.fillRect(496, 400, 26, 120);
  // sunglasses
  x.fillStyle = '#0b0b18';
  x.fillRect(292, 478, 92, 52); x.fillRect(416, 478, 92, 52); x.fillRect(384, 492, 32, 10);
  x.fillStyle = 'rgba(0,229,255,0.55)';
  x.fillRect(300, 486, 34, 14); x.fillRect(424, 486, 34, 14);
  // smile + chain
  x.strokeStyle = '#7a3b1e'; x.lineWidth = 7;
  x.beginPath(); x.arc(400, 566, 42, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke();
  x.strokeStyle = '#ffd76e'; x.lineWidth = 9;
  x.beginPath(); x.arc(400, 668, 74, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  return c;
}

// Demo 2: beach panorama with boardwalk and umbrella.
function beach() {
  const c = canvas(1000, 800), x = c.getContext('2d');
  sky(x, 1000, 800, [[0, '#0f2027'], [0.5, '#2c5364'], [0.72, '#ff9966'], [1, '#ff5e62']]);
  sun(x, 720, 430, 130, '#ffe29f');
  sea(x, 1000, 470, 170, '#ff7e5f', '#203a43');
  x.fillStyle = '#f7d08a'; x.fillRect(0, 640, 1000, 160);
  x.fillStyle = '#e8b96f';
  for (let i = 0; i < 40; i++) x.fillRect(Math.random() * 1000, 650 + Math.random() * 140, 22, 4);
  palm(x, 90, 700, 1.6, '#20301c'); palm(x, 880, 690, 1.2, '#20301c');
  // umbrella
  x.strokeStyle = '#5b2333'; x.lineWidth = 8;
  x.beginPath(); x.moveTo(520, 720); x.lineTo(560, 560); x.stroke();
  x.fillStyle = '#ff2e88';
  x.beginPath(); x.moveTo(430, 560); x.quadraticCurveTo(560, 470, 690, 560); x.closePath(); x.fill();
  x.fillStyle = '#00e5ff';
  x.beginPath(); x.moveTo(492, 528); x.quadraticCurveTo(560, 478, 628, 528); x.lineTo(560, 560); x.closePath(); x.fill();
  // beach ball
  x.fillStyle = '#ffd76e'; x.beginPath(); x.arc(300, 730, 34, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ff2e88'; x.beginPath(); x.arc(300, 730, 34, -0.6, 0.9); x.fill();
  return c;
}

// Demo 3: boulevard at dusk with a low sports car silhouette.
function boulevard() {
  const c = canvas(1000, 800), x = c.getContext('2d');
  sky(x, 1000, 800, [[0, '#12002f'], [0.55, '#5f0a87'], [0.8, '#ff2e88'], [1, '#ff9a3d']]);
  sun(x, 300, 470, 110, '#ffb347');
  // skyline
  x.fillStyle = '#160b33';
  const hs = [210, 300, 170, 350, 240, 290, 190, 320];
  hs.forEach((h, i) => x.fillRect(i * 128, 520 - h, 104, h));
  x.fillStyle = '#ffd76e';
  for (let i = 0; i < 70; i++) x.fillRect(Math.random() * 1000, 220 + Math.random() * 280, 7, 10);
  // road
  x.fillStyle = '#0d0d1a'; x.fillRect(0, 520, 1000, 280);
  x.strokeStyle = '#00e5ff'; x.lineWidth = 5; x.setLineDash([46, 34]);
  x.beginPath(); x.moveTo(0, 690); x.lineTo(1000, 690); x.stroke(); x.setLineDash([]);
  palm(x, 40, 560, 1.1, '#0a0618'); palm(x, 930, 560, 1.0, '#0a0618');
  // car body
  x.fillStyle = '#0b0b18';
  x.beginPath();
  x.moveTo(180, 700); x.quadraticCurveTo(200, 640, 320, 628);
  x.quadraticCurveTo(400, 570, 540, 572); x.quadraticCurveTo(700, 576, 790, 636);
  x.quadraticCurveTo(850, 648, 852, 700); x.closePath(); x.fill();
  x.fillStyle = '#12263a'; x.fillRect(408, 592, 120, 34);
  x.fillStyle = '#05050d';
  for (const wx of [300, 720]) { x.beginPath(); x.arc(wx, 702, 42, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#cfd8dc';
  for (const wx of [300, 720]) { x.beginPath(); x.arc(wx, 702, 17, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#ffea00'; x.fillRect(822, 656, 26, 12);
  x.fillStyle = '#ff1744'; x.fillRect(184, 656, 22, 12);
  x.strokeStyle = '#ff2e88'; x.lineWidth = 6;
  x.beginPath(); x.moveTo(196, 716); x.lineTo(838, 716); x.stroke();
  return c;
}

export function makeDemoPhotos() {
  return [
    { source: portrait(), name: 'Demo portrait (illustration)', zoom: 1, ox: 0, oy: 0 },
    { source: beach(), name: 'Demo beach (illustration)', zoom: 1, ox: 0, oy: 0 },
    { source: boulevard(), name: 'Demo boulevard (illustration)', zoom: 1, ox: 0, oy: 0 },
  ];
}
