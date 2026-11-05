// CHOMPOSAURUS — the 3-D renderer for CUBE COUNTRY (three.js, Kenney Cube Pets).
// The game logic stays 2-D: creatures live on a ground plane (x, y) plus a jump height z.
// An orthographic camera tilted 50° maps plane y straight onto screen y, so every 2-D overlay
// (particles, texts, projectiles, rings) drawn by game.js lines up with the 3-D scene exactly.
'use strict';
(() => {
const T = window.THREE;
const canvas = document.getElementById('gl');
if (!T || !window.CUBE_MODELS || !canvas) return;
const EL = 50 * Math.PI / 180, SIN = Math.sin(EL), COS = Math.cos(EL);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerpAng = (a, b, t) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

let renderer, scene, camera, sun, ground, failed = false, ready = false, frameId = 0, visible = false;
const models = {};
const objs = new Map();
const chunks = new Map();
const CH = 420;
const PALETTE = ['#ff5ad8', '#5ac8ff', '#ffe066', '#7dff6a', '#ff8a3a', '#b46aff', '#ff4a6a'];

try {
  renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
} catch (e) { failed = true; }

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  return t;
}
const mat = (color, opts = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0 }, opts));

if (!failed) {
  scene = new T.Scene();
  scene.background = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5ec8ff'); gr.addColorStop(0.6, '#b8f0ff'); gr.addColorStop(1, '#ffe0f4');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  camera = new T.OrthographicCamera(-1, 1, 1, -1, 1, 9000);
  scene.add(new T.HemisphereLight('#fff8f0', '#6ac050', 1.15));
  sun = new T.DirectionalLight('#fff0d8', 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.6;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 6000;
  scene.add(sun, sun.target);
  // mowed-lawn ground with soft stripes
  const gt = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5ccc4a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#6ad856'; g.fillRect(0, 0, w / 2, h);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(hash(i) * w, hash(i + 9) * h, 2 + hash(i + 3) * 4, 0, Math.PI * 2); g.fill(); }
  });
  gt.wrapS = gt.wrapT = T.RepeatWrapping; gt.repeat.set(30, 30);
  gt.anisotropy = 8;
  ground = new T.Mesh(new T.PlaneGeometry(12000, 12000), new T.MeshStandardMaterial({ map: gt, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  loadModels();
}

function loadModels() {
  const manager = new T.LoadingManager();
  manager.setURLModifier((u) => (/colormap/.test(u) ? window.CUBE_MODELS.tex : u));
  const loader = new T.GLTFLoader(manager);
  const list = Object.entries(window.CUBE_MODELS.glb);
  let left = list.length;
  for (const [key, b64] of list) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
    loader.parse(bin, '', (g) => {
      g.scene.updateMatrixWorld(true);
      const box = new T.Box3().setFromObject(g.scene);
      const size = box.getSize(new T.Vector3());
      g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      models[key] = { scene: g.scene, clips: g.animations, height: size.y, minY: box.min.y, maxZ: box.max.z, width: Math.max(size.x, size.z) };
      if (--left === 0) ready = true;
    }, (e) => { console.warn('model failed', key, e); if (--left === 0) ready = true; });
  }
}

// ---------------------------------------------------------------- entities
function crown() {
  const g = new T.Group(), gold = mat('#ffd23a', { metalness: 0.6, roughness: 0.3, emissive: '#7a5200', emissiveIntensity: 0.4 });
  const band = new T.Mesh(new T.CylinderGeometry(0.42, 0.38, 0.22, 10, 1, true), gold);
  band.material.side = T.DoubleSide; g.add(band);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, s = new T.Mesh(new T.ConeGeometry(0.1, 0.32, 5), gold);
    s.position.set(Math.cos(a) * 0.38, 0.24, Math.sin(a) * 0.38); g.add(s);
    const gem = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), mat(PALETTE[i], { emissive: PALETTE[i], emissiveIntensity: 0.5 }));
    gem.position.set(Math.cos(a) * 0.41, 0, Math.sin(a) * 0.41); g.add(gem);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeInst(key) {
  const m = models[key];
  if (!m) return null;
  const root = m.scene.clone(true);
  const mats = [];
  root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); mats.push(o.material); } });
  root.position.y = -m.minY;
  const holder = new T.Group(); holder.add(root);
  const group = new T.Group(); group.add(holder);
  const mixer = new T.AnimationMixer(root);
  const actions = {};
  for (const c of m.clips) actions[c.name] = mixer.clipAction(c);
  scene.add(group);
  return { key, m, group, holder, root, mixer, actions, cur: '', yaw: 0, mats, tint: '', crown: null };
}
function drop(r) {
  scene.remove(r.group);
  for (const mm of r.mats) mm.dispose();
}
function setTint(r, tint) {
  if (r.tint === tint) return;
  r.tint = tint;
  const [col, em, k] = { '': ['#ffffff', '#000000', 0], flash: ['#ffffff', '#ffffff', 0.7], hurt: ['#ff8080', '#ff2020', 0.5], gold: ['#ffe27a', '#ffb000', 0.45], dead: ['#8a8a9a', '#000000', 0], corpse: ['#9a8a8a', '#000000', 0], frenzy: ['#ff9090', '#ff0000', 0.35], aura: ['#ffffff', '#ff5ad8', 0.25] }[tint] || ['#ffffff', '#000000', 0];
  for (const mm of r.mats) { mm.color.set(col); mm.emissive.set(em); mm.emissiveIntensity = k; }
}
function setAnim(r, name, speed) {
  const a = r.actions[name] || r.actions.static;
  if (!a) return;
  if (r.cur !== name) {
    const old = r.actions[r.cur];
    a.reset().play();
    if (old) old.crossFadeTo(a, 0.15, false);
    r.cur = name;
  }
  a.timeScale = speed;
}
// o: { key, x, y, z, h, vx, vy, face, tint, spin, lie, crown, hide, anim, dt }
function sync(ent, o, dt) {
  let r = objs.get(ent);
  if (r && r.key !== o.key) { drop(r); r = null; }
  if (!r) {
    r = makeInst(o.key);
    if (!r) return;
    r.yaw = o.face > 0 ? Math.PI / 2 : -Math.PI / 2;
    objs.set(ent, r);
  }
  r.used = frameId;
  r.group.visible = !o.hide;
  const s = (o.h * 0.9) / (r.m.height * COS);
  r.group.scale.setScalar(s);
  r.group.position.set(o.x, (o.z || 0) / COS, o.y / SIN);
  const spd = Math.hypot(o.vx || 0, o.vy || 0) / o.h;
  if (spd > 0.25) r.target = Math.atan2(o.vx, (o.vy || 0) / SIN);
  else if (r.target === undefined) r.target = r.yaw;
  if (o.faceTo !== undefined) r.target = o.faceTo;
  r.yaw = lerpAng(r.yaw, r.target, Math.min(1, dt * 10));
  r.holder.rotation.set(o.tiltX || 0, r.yaw + (o.spin || 0), o.lie ? Math.PI / 2 : o.tilt || 0);
  r.holder.scale.set(o.sx || 1, o.sy || 1, o.sx || 1);
  setTint(r, o.tint || '');
  if (o.crown && !r.crown) { r.crown = crown(); r.crown.position.set(0, r.m.height * 1.0, r.m.maxZ * 0.25); r.crown.scale.setScalar(r.m.width * 0.55); r.holder.add(r.crown); }
  if (o.crown && r.crown) r.crown.rotation.y = Math.sin(o.t * 2) * 0.1;
  if (o.lie) setAnim(r, 'static', 0);
  else setAnim(r, o.anim || (spd > 3.2 ? 'run' : spd > 0.3 ? 'walk' : 'static'), o.anim ? 1 : Math.min(2.5, Math.max(0.7, spd * 0.45)));
  r.mixer.update(dt);
}

// ---------------------------------------------------------------- presents (the falling hazard)
const gifts = new Map();
function giftMesh(seed) {
  const g = new T.Group();
  const box = new T.Mesh(new T.BoxGeometry(1, 0.9, 1), mat(PALETTE[Math.floor(seed * PALETTE.length)]));
  const rib = mat('#ffffff', { roughness: 0.3 });
  const r1 = new T.Mesh(new T.BoxGeometry(1.04, 0.94, 0.18), rib), r2 = new T.Mesh(new T.BoxGeometry(0.18, 0.94, 1.04), rib);
  const bow = new T.Mesh(new T.TorusKnotGeometry(0.16, 0.06, 40, 6), rib); bow.position.y = 0.6;
  g.add(box, r1, r2, bow);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  return g;
}

// ---------------------------------------------------------------- scenery (procedural, per x-chunk)
const G = {};
function geo() {
  if (G.ready) return G;
  Object.assign(G, {
    ready: true,
    trunk: new T.CylinderGeometry(0.08, 0.1, 1, 8), ball: new T.SphereGeometry(1, 18, 12), cone: new T.ConeGeometry(1, 1, 8),
    box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(1, 1, 1, 14), torus: new T.TorusGeometry(1, 0.08, 8, 40, Math.PI),
    oct: new T.OctahedronGeometry(1, 0), dode: new T.DodecahedronGeometry(1, 0), hemi: new T.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    mats: PALETTE.map((c) => mat(c)), white: mat('#ffffff'), stem: mat('#fff4e0'), wood: mat('#a8703a'), hedge: mat('#3fb04a', { roughness: 0.9 }), hedge2: mat('#55c85a', { roughness: 0.9 }),
    rock: mat('#c8c0d8', { roughness: 0.8 }), crystal: mat('#b8f0ff', { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: '#5ac8ff', emissiveIntensity: 0.25 }),
      });
  return G;
}
function mesh(g, m, x, y, z, sx, sy, sz, shadow = true) {
  const o = new T.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz === undefined ? sx : sz); o.castShadow = shadow; o.receiveShadow = true; return o;
}
function buildChunk(i, depth) {
  const g = geo(), grp = new T.Group(), x0 = i * CH;
  const Z = (y) => y / SIN;
  const R = (k) => hash(i * 13.7 + k * 1.91);
  const add = (...o) => o.forEach((m) => grp.add(m));
  // far hedge wall + big trees beyond it
  for (let k = 0; k < 3; k++) {
    const x = x0 + k * CH / 3 + CH / 6;
    add(mesh(g.ball, k % 2 ? g.hedge : g.hedge2, x, 18, Z(-depth - 40), CH / 5, 48, 60));
  }
  for (let k = 0; k < 3; k++) {
    const x = x0 + R(k) * CH, z = Z(-depth - 140 - R(k + 5) * 500), kind = R(k + 9), s = 0.7 + R(k + 2) * 0.9;
    if (kind < 0.45) { // lollipop tree
      add(mesh(g.trunk, g.white, x, 130 * s, z, 30 * s, 260 * s));
      const top = mesh(g.ball, g.mats[Math.floor(R(k + 3) * 7)], x, 280 * s, z, 85 * s);
      add(top);
      const swirl = mesh(g.torus, g.white, x, 280 * s, z + 80 * s, 50 * s); swirl.rotation.z = R(k) * 3; add(swirl);
    } else if (kind < 0.7) { // giant mushroom
      add(mesh(g.cyl, g.stem, x, 90 * s, z, 26 * s, 180 * s));
      add(mesh(g.hemi, g.mats[Math.floor(R(k + 4) * 7)], x, 170 * s, z, 110 * s, 80 * s));
      for (let d = 0; d < 4; d++) add(mesh(g.ball, g.white, x + Math.cos(d * 1.6) * 60 * s, 215 * s, z + Math.sin(d * 1.6) * 60 * s, 14 * s));
    } else { // rolling hill
      add(mesh(g.ball, kind < 0.85 ? g.hedge2 : g.hedge, x, -60, z - 300, 260 * s, 220 * s, 200 * s));
    }
  }
  // rainbow arch every so often
  if (R(40) < 0.18) {
    const x = x0 + CH / 2, z = Z(-depth - 700);
    ['#ff4a6a', '#ff8a3a', '#ffe066', '#7dff6a', '#5ac8ff', '#b46aff'].forEach((c, k) => { const a = mesh(g.torus, mat(c, { emissive: c, emissiveIntensity: 0.3 }), x, 0, z, 520 - k * 26, 520 - k * 26, 160, false); add(a); });
  }
  // inside the field: little things to roam between (purely decorative)
  for (let k = 0; k < 7; k++) {
    const x = x0 + R(k + 20) * CH, y = -R(k + 30) * depth, z = Z(y), kind = R(k + 50), s = 0.6 + R(k + 60) * 0.8;
    if (kind < 0.4) { // flower
      add(mesh(g.trunk, g.hedge, x, 9 * s, z, 12 * s, 18 * s));
      const c = g.mats[Math.floor(R(k + 70) * 7)];
      for (let p = 0; p < 5; p++) add(mesh(g.ball, c, x + Math.cos(p * 1.26) * 6 * s, 20 * s, z + Math.sin(p * 1.26) * 6 * s, 5 * s, 3 * s, 5 * s));
      add(mesh(g.ball, mat('#ffe066'), x, 21 * s, z, 3.5 * s));
    } else if (kind < 0.55) add(mesh(g.dode, g.rock, x, 6 * s, z, 16 * s, 12 * s, 14 * s));
    else if (kind < 0.68) { const c = mesh(g.oct, g.crystal, x, 24 * s, z, 12 * s, 26 * s, 12 * s); c.rotation.y = R(k) * 3; add(c); }
    else if (kind < 0.8) { const b = mesh(g.box, g.mats[Math.floor(R(k + 80) * 7)], x, 11 * s, z, 22 * s); b.rotation.y = R(k + 1) * 3; add(b); }
    else if (kind < 0.88) { add(mesh(g.cyl, g.stem, x, 8 * s, z, 5 * s, 16 * s)); add(mesh(g.hemi, g.mats[0], x, 15 * s, z, 16 * s, 12 * s)); }
  }
  // near border: a low row of flowers and bushes
  for (let k = 0; k < 6; k++) {
    const x = x0 + (k + R(k + 90)) * CH / 6, z = Z(30 + R(k + 95) * 30);
    add(mesh(g.ball, g.hedge2, x, 4, z, 26, 16, 18));
    add(mesh(g.ball, g.mats[Math.floor(R(k + 99) * 7)], x + 8, 16, z + 4, 6));
  }
  scene.add(grp);
  return grp;
}
function updateChunks(cx, vw, depth, t) {
  const a = Math.floor((cx - vw) / CH) - 1, b = Math.floor((cx + vw) / CH) + 1;
  for (let i = a; i <= b; i++) if (!chunks.has(i)) chunks.set(i, buildChunk(i, depth));
  for (const [i, grp] of chunks) {
    if (i < a - 2 || i > b + 2) { scene.remove(grp); chunks.delete(i); continue; }
  }
}

// ---------------------------------------------------------------- frame
let lastW = 0, lastH = 0, lastDPR = 0, shadowS = 0;
function frame(v) {
  if (failed || !ready) return;
  frameId++;
  if (v.W !== lastW || v.H !== lastH || v.DPR !== lastDPR) { renderer.setPixelRatio(v.DPR); renderer.setSize(v.W, v.H, false); lastW = v.W; lastH = v.H; lastDPR = v.DPR; }
  const vh = v.viewH, vw = vh * v.W / v.H;
  camera.left = -vw / 2; camera.right = vw / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
  camera.updateProjectionMatrix();
  const tx = v.camX + v.shx, tz = (v.camY + v.shy) / SIN;
  camera.position.set(tx, SIN * 3000, tz + COS * 3000);
  camera.lookAt(tx, 0, tz);
  sun.target.position.set(tx, 0, tz);
  sun.position.set(tx - 700, 1600, tz + 900);
  const S = Math.max(vw, vh / SIN) * 0.8;
  if (Math.abs(S - shadowS) > S * 0.1) { shadowS = S; const c = sun.shadow.camera; c.left = -S; c.right = S; c.top = S; c.bottom = -S; c.updateProjectionMatrix(); }
  ground.position.set(Math.round(tx / 400) * 400, 0, Math.round(tz / 400) * 400);
  updateChunks(v.camX, vw, v.depth, v.t);
  for (const e of v.ents) sync(e.ref, e, v.dt);
  for (const [ent, r] of objs) if (r.used !== frameId) { drop(r); objs.delete(ent); }
  for (const m of v.gifts) {
    let g = gifts.get(m.ref);
    if (!g) { g = giftMesh(m.seed); gifts.set(m.ref, g); }
    g.userData.used = frameId;
    g.scale.setScalar(m.r * 0.9);
    g.position.set(m.x, m.alt / COS, m.y / SIN);
    g.rotation.set(m.alt * 0.004, m.alt * 0.01, 0);
  }
  for (const [ref, g] of gifts) if (g.userData.used !== frameId) { scene.remove(g); gifts.delete(ref); }
  renderer.render(scene, camera);
}

// ================================================================ EPISODE VIII: the real solar system
// Real NASA spacecraft models and planet maps, lit by a single sun against a real star map.
const SP = { started: false, ready: false, scene: null, light: null, models: {}, tex: {}, objs: new Map(), mats: {} };
const ATMO = { earth: '#6ab4ff', venus: '#ffd9a0', mars: '#ff9a6a', titan: '#ffb060', neptune: '#7ab8ff', uranus: '#a8f0f0', jupiter: '#ffe0b0', saturn: '#ffe8b8' };
function glowTex(inner, outer) {
  return canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
}
function loadSpace() {
  if (SP.started || failed) return;
  SP.started = true;
  const go = () => {
    const A = window.SOL_ASSETS; if (!A) return;
    const sc = SP.scene = new T.Scene();
    const tl = new T.TextureLoader();
    for (const [k, uri] of Object.entries(A.tex)) { const t = tl.load(uri); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; SP.tex[k] = t; }
    // the real star map on a backdrop that follows the camera and pans a little as you travel (parallax)
    sc.background = new T.Color('#010206');
    SP.tex.stars.wrapS = SP.tex.stars.wrapT = T.RepeatWrapping; SP.tex.stars.repeat.set(0.42, 0.42);
    SP.sky = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: SP.tex.stars, color: '#d8d8e8', depthWrite: false, depthTest: false, toneMapped: false }));
    SP.sky.renderOrder = -10; sc.add(SP.sky);
    sc.add(new T.AmbientLight('#8090b0', 0.35));
    SP.light = new T.DirectionalLight('#fff4e4', 3.4); sc.add(SP.light, SP.light.target);
    // procedural maps NASA's library doesn't include
    SP.tex.uranus = canvasTex(512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ad8de'); gr.addColorStop(0.5, '#b8eef0'); gr.addColorStop(1, '#8ccfd8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    SP.tex.sun = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#ffb030'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const x = hash(i) * w, y = hash(i + 7) * h, r = 2 + hash(i + 3) * 9; g.fillStyle = `rgba(${hash(i + 1) > 0.5 ? '255,240,160' : '200,80,10'},${0.15 + hash(i + 2) * 0.3})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,20,0,0.6)'; g.beginPath(); g.arc(hash(i + 50) * w, h * (0.35 + hash(i + 60) * 0.3), 6 + hash(i + 70) * 10, 0, Math.PI * 2); g.fill(); } });
    SP.tex.ring = canvasTex(512, 8, (g, w, h) => { for (let x = 0; x < w; x++) { const k = x / w, a = k < 0.08 ? 0 : (0.35 + 0.5 * Math.abs(Math.sin(k * 40 + Math.sin(k * 7) * 3))) * (k > 0.55 && k < 0.6 ? 0.15 : 1); g.fillStyle = `rgba(${220 - k * 60 | 0},${200 - k * 60 | 0},${170 - k * 60 | 0},${a})`; g.fillRect(x, 0, 1, h); } });
    SP.tex.disk = canvasTex(512, 512, (g, w) => { const c = w / 2; const gr = g.createRadialGradient(c, c, c * 0.35, c, c, c); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.08, 'rgba(255,250,230,1)'); gr.addColorStop(0.3, 'rgba(255,190,90,0.9)'); gr.addColorStop(0.7, 'rgba(200,70,20,0.45)'); gr.addColorStop(1, 'rgba(80,10,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(0,0,0,${0.1 + hash(i) * 0.25})`; g.lineWidth = 2 + hash(i + 1) * 5; g.beginPath(); g.arc(c, c, c * (0.4 + hash(i + 2) * 0.55), hash(i + 3) * 6, hash(i + 3) * 6 + 1 + hash(i + 4) * 2); g.stroke(); } });
    SP.tex.glowSun = glowTex('rgba(255,250,220,1)', 'rgba(255,170,60,0.55)');
    SP.tex.glowCyan = glowTex('rgba(220,250,255,0.9)', 'rgba(120,200,255,0.35)');
    SP.tex.glowWhite = glowTex('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.15)');
    SP.sphere = new T.SphereGeometry(1, 64, 40);
    const loader = new T.GLTFLoader();
    const list = Object.entries(A.glb); let left = list.length;
    for (const [k, b64] of list) {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
      loader.parse(bin, '', (gl) => {
        const box = new T.Box3().setFromObject(gl.scene), sph = box.getBoundingSphere(new T.Sphere());
        gl.scene.position.sub(sph.center);
        const wrap = new T.Group(); wrap.add(gl.scene);
        SP.models['n:' + k] = { scene: wrap, r: sph.radius || 1 };
        if (--left === 0) SP.ready = true;
      }, (e) => { console.warn('space model failed', k, e); if (--left === 0) SP.ready = true; });
    }
  };
  if (window.SOL_ASSETS) go();
  else { const sEl = document.createElement('script'); sEl.src = 'assets/space_assets.js?v=3'; sEl.onload = go; sEl.onerror = () => console.warn('space assets failed'); document.head.appendChild(sEl); }
}
function planetMat(key) {
  if (SP.mats[key]) return SP.mats[key];
  const m = key === 'sun' ? new T.MeshBasicMaterial({ map: SP.tex.sun, color: '#ffffff' }) : new T.MeshStandardMaterial({ map: SP.tex[key] || null, color: SP.tex[key] ? '#ffffff' : '#888888', roughness: 0.95, metalness: 0 });
  return (SP.mats[key] = m);
}
function makeSpaceObj(key) {
  const group = new T.Group(), holder = new T.Group(); group.add(holder);
  const r = { key, group, holder, mats: [], spin: new T.Vector3(hash(Math.random() * 99) - 0.5, hash(Math.random() * 99) - 0.5, hash(Math.random() * 99) - 0.5).multiplyScalar(1.2), base: 1, tint: '' };
  if (key.startsWith('n:')) {
    const m = SP.models[key]; if (!m) return null;
    const c = m.scene.clone(true);
    c.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); r.mats.push(o.material); } });
    holder.add(c); r.base = 1 / m.r;
    holder.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  } else if (key === 'blackhole') {
    holder.add(new T.Mesh(SP.sphere, new T.MeshBasicMaterial({ color: '#000000' })));
    const disk = new T.Mesh(new T.RingGeometry(1.25, 3.4, 96, 1), new T.MeshBasicMaterial({ map: SP.tex.disk, transparent: true, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false }));
    disk.rotation.x = -Math.PI / 2 + 0.35; holder.add(disk); r.disk = disk;
    const halo = new T.Sprite(new T.SpriteMaterial({ map: SP.tex.glowSun, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.5 })); halo.scale.setScalar(5.5); holder.add(halo);
    r.spin.set(0, 0, 0);
  } else if (key === 'comet') {
    const m = SP.models['n:moon_rock_05'];
    if (m) { const c = m.scene.clone(true); c.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set('#d8ecff'); r.mats.push(o.material); } }); c.scale.setScalar(1 / m.r); holder.add(c); }
    const coma = new T.Sprite(new T.SpriteMaterial({ map: SP.tex.glowCyan, blending: T.AdditiveBlending, depthWrite: false })); coma.scale.setScalar(3.2); group.add(coma);
  } else { // planets, moons and the sun
    const p = key === 'rockp' ? 'moon' : key.replace('planet:', '');
    const ball = new T.Mesh(SP.sphere, planetMat(p)); holder.add(ball);
    holder.rotation.x = 0.35; r.spin.set(0, 0.12 + Math.random() * 0.1, 0);
    if (p === 'saturn') { const ring = new T.Mesh(new T.RingGeometry(1.25, 2.3, 96, 1), new T.MeshStandardMaterial({ map: SP.tex.ring, transparent: true, side: T.DoubleSide, roughness: 1, depthWrite: false })); const uv = ring.geometry.attributes.uv, pos = ring.geometry.attributes.position; for (let i = 0; i < uv.count; i++) { const d = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (d - 1.25) / 1.05, 0.5); } ring.rotation.x = -Math.PI / 2 + 0.5; group.add(ring); }
    const atmo = ATMO[p];
    if (p === 'sun') { for (const [s, o] of [[2.6, 0.9], [5, 0.35]]) { const g = new T.Sprite(new T.SpriteMaterial({ map: SP.tex.glowSun, blending: T.AdditiveBlending, depthWrite: false, opacity: o })); g.scale.setScalar(s); group.add(g); } }
    else if (atmo) { const g = new T.Sprite(new T.SpriteMaterial({ map: SP.tex.glowWhite, color: atmo, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.55 })); g.scale.setScalar(2.35); group.add(g); }
  }
  SP.scene.add(group);
  return r;
}
function syncSpace(ent, o, dt) {
  let r = SP.objs.get(ent);
  if (r && r.key !== o.key) { SP.scene.remove(r.group); r = null; }
  if (!r) { r = makeSpaceObj(o.key); if (!r) return; SP.objs.set(ent, r); }
  r.used = frameId;
  r.group.visible = !o.hide;
  const radius = o.h * 0.5;
  r.group.scale.setScalar(radius * (o.key.startsWith('n:') ? 1.15 : 1) * (o.key.startsWith('n:') ? r.base : 1));
  r.group.position.set(o.x, 0, o.y / SIN);
  if (o.key.startsWith('n:') || o.key === 'comet') { r.holder.rotation.x += r.spin.x * dt * (o.spinMul || 1); r.holder.rotation.y += r.spin.y * dt * (o.spinMul || 1); r.holder.rotation.z += r.spin.z * dt * (o.spinMul || 1); }
  else r.holder.rotation.y += r.spin.y * dt;
  if (r.disk) r.disk.rotation.z += dt * 1.6;
  if (o.tint !== r.tint && r.mats.length) { r.tint = o.tint; for (const m of r.mats) { if (!m.emissive) continue; m.emissive.set(o.tint === 'flash' ? '#ffffff' : o.tint === 'gold' ? '#ffb000' : o.tint === 'hurt' ? '#ff2020' : '#000000'); m.emissiveIntensity = o.tint ? 0.6 : 0; if (m.color) m.color.set(o.tint === 'corpse' ? '#555555' : '#ffffff'); } }
}
function frameSpace(v) {
  if (failed || !SP.ready) return;
  frameId++;
  if (v.W !== lastW || v.H !== lastH || v.DPR !== lastDPR) { renderer.setPixelRatio(v.DPR); renderer.setSize(v.W, v.H, false); lastW = v.W; lastH = v.H; lastDPR = v.DPR; }
  const vh = v.viewH, vw = vh * v.W / v.H;
  camera.left = -vw / 2; camera.right = vw / 2; camera.top = vh / 2; camera.bottom = -vh / 2; camera.updateProjectionMatrix();
  const tx = v.camX + v.shx, tz = (v.camY + v.shy) / SIN;
  camera.position.set(tx, SIN * 6000, tz + COS * 6000); camera.lookAt(tx, 0, tz);
  // light comes from the Sun when it's around, otherwise from a fixed far-off direction
  const sx = v.sunX !== undefined ? v.sunX : tx - 4000, sz = v.sunY !== undefined ? v.sunY / SIN : tz - 3000;
  SP.light.target.position.set(tx, 0, tz); SP.light.position.set(sx, 1500, sz);
  { const dir = new T.Vector3(); camera.getWorldDirection(dir); SP.sky.position.copy(camera.position).addScaledVector(dir, 8500); SP.sky.quaternion.copy(camera.quaternion); SP.sky.scale.set(vw, vh, 1);
    SP.tex.stars.repeat.set(0.42, 0.42 * vh / vw * 2); SP.tex.stars.offset.set(0.3 + v.camX * 0.000012, 0.28 - v.camY * 0.000012); }
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  for (const e of v.ents) syncSpace(e.ref, e, v.dt);
  for (const [ent, r] of SP.objs) if (r.used !== frameId) { SP.scene.remove(r.group); SP.objs.delete(ent); }
  renderer.render(SP.scene, camera);
  renderer.toneMapping = T.NoToneMapping;
}
window.R3D = {
  loadSpace, spaceOk: () => !failed && SP.ready, frameSpace,
  ok: () => !failed && ready,
  failed: () => failed,
  SIN, COS,
  show(on) { if (on !== visible) { visible = on; canvas.style.display = on ? 'block' : 'none'; } },
  frame,
  clear() { for (const [, r] of objs) drop(r); objs.clear(); },
};
})();
