// EAT THE MULTIVERSE — an anthology of eating everything. Every world, a different style.
'use strict';
(() => {
const { FORMS, SP, BOSSES, WORLDS, ABILITIES, THEMES } = window.CHOMP_DATA;
const ERAS = WORLDS;
// ============================================================ canvas
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cvs.width = (W * DPR) | 0; cvs.height = (H * DPR) | 0;
}
addEventListener('resize', resize); resize();

// ============================================================ utils
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sign = (v) => (v < 0 ? -1 : 1);
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hex2 = (c) => { const p = parseInt(c.slice(1), 16); return [p >> 16, (p >> 8) & 255, p & 255]; };
const lerpColor = (a, b, t) => {
  const pa = hex2(a), pb = hex2(b);
  return '#' + [0, 1, 2].map((i) => Math.round(lerp(pa[i], pb[i], t)).toString(16).padStart(2, '0')).join('');
};
const allFrames = (n) => Array.from({ length: n }, (_, i) => i);
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
};

// web fonts only download once something uses them, so ask for every world's font up front
if (document.fonts) ['Bungee', 'Rajdhani', 'Chewy', 'Orbitron', 'Cinzel', 'Creepster', 'Fredoka', 'Luckiest Guy', 'Patrick Hand', 'Press Start 2P', 'Silkscreen', 'Special Elite'].forEach((f) => document.fonts.load('20px "' + f + '"').catch(() => {}));

// ============================================================ images
const IMG = {};
let loadedCount = 0;
const SPRITE_KEYS = Object.keys(window.SPRITES);
SPRITE_KEYS.forEach((k) => {
  const im = new Image();
  im.onload = im.onerror = () => loadedCount++;
  im.src = 'assets/' + k + '.png';
  IMG[k] = im;
});
const tintCache = {};
function tinted(key, color, amt) {
  const id = key + color + amt;
  if (tintCache[id]) return tintCache[id];
  const im = IMG[key];
  const c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = amt; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return (tintCache[id] = c);
}
// film grain / paper texture, generated once
const grain = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d'), d = g.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.random() * 40; }
  g.putImageData(d, 0, 0);
  return c;
})();

// ============================================================ audio (all synthesized)
// Recorded sounds (all CC0, see CREDITS.md) per world. Anything missing — or any file that
// fails to load (e.g. opening index.html straight from disk) — falls back to the synth sounds below.
const SOUNDS = {
  jurassic: { eat: ['ju_eat1', 'ju_eat2', 'ju_eat3', 'ju_eat4'], bite: ['ju_bite1', 'ju_bite2', 'ju_bite3'], roar: ['ju_roar1', 'ju_roar2', 'ju_roar3', 'ju_roar4'], eroar: ['ju_eroar1', 'ju_eroar2', 'ju_eroar3'], hurt: ['ju_hurt1', 'ju_hurt2', 'ju_hurt3'], boom: ['ju_boom1', 'ju_boom2', 'ju_boom3'], stomp: ['ju_stomp1'] },
  goo: { eat: ['goo_eat_squish_01_0', 'goo_eat_squish_02', 'goo_eat_squish_04', 'goo_eat_squishpop'], bite: ['goo_bite1', 'goo_bite2', 'goo_pop1', 'goo_pop2'], jump: ['goo_jump1', 'goo_jump2'], spit: ['goo_spit01', 'goo_spit02', 'goo_spit03'], roar: ['goo_roar01', 'goo_roar02'], eroar: ['goo_roar01', 'goo_roar02'], hurt: ['goo_hurt02', 'goo_hurt05'], boom: ['goo_boom1', 'goo_slime01', 'goo_slime09'], stomp: ['goo_slime05', 'goo_boom1'], burp: ['goo_burp1', 'goo_burp2'] },
  deep: { eat: ['deep_bubble01', 'deep_bubble02', 'deep_bubble03', 'deep_bubble4', 'deep_bubble5'], bite: ['deep_bite1'], pounce: ['deep_splash01', 'deep_splash03', 'deep_splash05'], boom: ['deep_boom1', 'deep_splash05'], eroar: ['deep_kraken'], roar: ['deep_kraken'] },
  cube: { eat: ['cube_cute01', 'cube_cute03', 'cube_cute04', 'cube_cute06', 'cube_cute08'], bite: ['goo_pop1', 'goo_pop2', 'goo_bite1'], jump: ['goo_jump1', 'goo_jump2'], spit: ['goo_spit01', 'goo_spit02'], roar: ['ju_roar1', 'ju_roar3'], eroar: ['cube_blah', 'cube_booleh'], hurt: ['cube_uah', 'cube_blung_0'], boom: ['goo_boom1', 'goo_pop2'], stomp: ['ju_stomp1'], burp: ['goo_burp1', 'goo_burp2'] },
  film: { eat: ['ju_eat1', 'ju_eat2', 'ju_eat3', 'ju_eat4'], bite: ['ju_bite1', 'ju_bite2', 'ju_bite3'], roar: ['sh_roar1', 'sh_roar2'], eroar: ['sh_eroar1'], hurt: ['ju_hurt1', 'ju_hurt2', 'ju_hurt3'], boom: ['ju_boom1', 'ju_boom2', 'ju_boom3'], stomp: ['ju_stomp1'], shoot: ['bw_shot01', 'bw_shot02', 'bw_shot03'], beam: ['bw_laser_Space_8', 'bw_laser_Space_9', 'bw_laser_Star_1'], evolve: ['bw_theremin1', 'bw_theremin2', 'bw_theremin3'] },
  neon: { eat: ['neon_eat1', 'neon_eat2', 'neon_eat3'], bite: ['neon_bite1', 'neon_bite2'], jump: ['neon_jump1', 'neon_jump2'], hurt: ['neon_hurt1'], boom: ['neon_boom1', 'neon_boom2'], stomp: ['neon_stomp'], shoot: ['neon_shoot1', 'neon_shoot2'], blink: ['neon_warp1', 'neon_warp2'], evolve: ['neon_evolve'], roar: ['neon_warp2'], eroar: ['deep_kraken'] },
  house: { eat: ['goo_eat_squish_02', 'goo_eat_squishpop', 'house_squeak1', 'house_squeak2'], bite: ['house_squeak3', 'goo_bite1', 'goo_bite2'], jump: ['goo_jump1', 'goo_jump2'], hurt: ['cube_uah', 'goo_hurt02'], boom: ['house_boom1', 'house_boom2'], stomp: ['house_stomp'], roar: ['cube_blah', 'cube_booleh'], eroar: ['house_meow1', 'house_meow2', 'house_meow3'], spit: ['goo_spit01'], burp: ['goo_burp1', 'goo_burp2'], bonk: ['house_bonk1', 'house_bonk2', 'house_bonk3'], spring: ['house_spring'] },
  sol: { eat: ['sol_crunch1', 'sol_crunch2', 'sol_crunch3', 'sol_metal1'], bite: ['sol_metal1', 'sol_metal2', 'sol_metal3'], boom: ['ju_boom1', 'ju_boom2', 'deep_boom1'], stomp: ['ju_stomp1'], roar: ['deep_kraken'], eroar: ['deep_kraken'], hurt: ['sol_metal3', 'ju_boom3'], beam: ['bw_laser_Space_8', 'bw_laser_Space_9'], blink: ['neon_warp1'] },
  any: { gold: ['any_gold'] },
};
const WORLD_PITCH = { film: 0.92 }; // a touch lower, like an old optical soundtrack
const MUSIC = { jurassic: ['mus_jurassic', 0.5], goo: ['mus_goo', 0.42], deep: ['mus_deep', 0.65], cube: ['mus_cube', 0.45], film: ['mus_bw', 0.5], film_boss: ['mus_bw_boss', 0.5], neon: ['mus_neon', 0.5], neon_boss: ['mus_neon_boss', 0.5], house: ['mus_house', 0.5], house_boss: ['mus_house_boss', 0.5], sol: ['mus_sol', 0.55], sol_boss: ['mus_sol_boss', 0.55] };
const SFX = (() => {
  let ac = null, master, sfxG, musG, noiseBuf, muted = false;
  const last = {}, buffers = {};
  let worldKey = 'jurassic', bossMusic = false, track = null, trackKey = '', fileMusic = false, musicDuck = 1;
  const allTracks = [];
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); playMusic(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.connect(master);
    musG = ac.createGain(); musG.gain.value = 0.3; musG.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    loadSamples();
    startMusic();
    playMusic();
  }
  function loadSamples() {
    const names = new Set();
    for (const w of Object.values(SOUNDS)) for (const list of Object.values(w)) list.forEach((n) => names.add(n));
    names.forEach((n) => {
      fetch('assets/audio/' + n + '.m4a').then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((b) => ac.decodeAudioData(b)).then((buf) => { buffers[n] = buf; }).catch(() => { /* synth fallback */ });
    });
  }
  // play a recorded sound for this world's version of an event; returns false so callers can fall back to synth
  function sample(event, { vol = 0.8, rate = 1, at = 0 } = {}) {
    if (!ac || muted) return false;
    const list = (SOUNDS[worldKey] && SOUNDS[worldKey][event]) || SOUNDS.any[event];
    if (!list) return false;
    const ready = list.filter((n) => buffers[n]);
    if (!ready.length) return false;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = buffers[pick(ready)];
    s.playbackRate.value = rate * (WORLD_PITCH[worldKey] || 1) * rand(0.94, 1.06);
    g.gain.value = vol;
    s.connect(g); g.connect(sfxG); s.start(ac.currentTime + at);
    return true;
  }
  // background music: a looping <audio> element per world (works even from file://)
  function playMusic() {
    const key = bossMusic && MUSIC[worldKey + '_boss'] ? worldKey + '_boss' : worldKey;
    const def = MUSIC[key];
    if (!def) return;
    if (trackKey === key && track) { if (track.paused && !muted) track.play().catch(() => {}); return; }
    // fade out every other track (including one whose play() is still pending)
    for (const o of allTracks) fadeTo(o, 0, 0.8, () => o.pause());
    const t = new Audio('assets/audio/' + def[0] + '.m4a');
    t.loop = true; t.volume = 0; t.muted = muted;
    track = t; trackKey = key; allTracks.push(t);
    t.play().then(() => {
      if (track !== t) { t.pause(); return; } // the world changed while this was starting: never fade it back in
      fileMusic = true; fadeTo(t, def[1] * musicDuck, 1.2);
    }).catch(() => { if (track === t) { fileMusic = false; trackKey = ''; track = null; } });
    while (allTracks.length > 4) { const o = allTracks.shift(); if (o !== track) { clearInterval(o._fade); o.pause(); o.src = ''; } else allTracks.push(o); }
  }
  function fadeTo(el, vol, secs, done) {
    clearInterval(el._fade);
    const start = el.volume, t0 = performance.now();
    el._fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / (secs * 1000));
      el.volume = clamp(start + (vol - start) * k, 0, 1);
      if (k >= 1) { clearInterval(el._fade); if (done) done(); }
    }, 40);
  }
  function ok(name, gap = 0.03) {
    if (!ac || muted) return false;
    const t = ac.currentTime;
    if (last[name] && t - last[name] < gap) return false;
    last[name] = t; return true;
  }
  function tone({ type = 'square', f = 440, f2, dur = 0.1, vol = 0.2, at = 0, dest, attack = 0.004 }) {
    const t = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise({ dur = 0.2, vol = 0.2, f = 1200, f2, q = 1, type = 'lowpass', at = 0, dest }) {
    const t = ac.currentTime + at;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || sfxG);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  // ---- music: each world gets its own scale, tempo, lead and drums
  let step = 0, nextT = 0, intensity = 0, mus = 0;
  const M = [
    { root: 110, scale: [0, 3, 5, 7, 10, 12], lead: 'square', tempo: 0.13, kick: true, snare: 'tom' },        // jurassic: tribal
    { root: 130.8, scale: [0, 2, 4, 7, 9, 12], lead: 'triangle', tempo: 0.12, kick: true, snare: 'clap' },    // goo: bouncy major
    { root: 98, scale: [0, 2, 3, 7, 9, 10], lead: 'sine', tempo: 0.17, kick: false, snare: 'none' },          // deep: slow dorian
    { root: 146.8, scale: [0, 2, 4, 7, 9, 12], lead: 'triangle', tempo: 0.11, kick: true, snare: 'clap' },    // cube: sunny major
    { root: 98, scale: [0, 3, 5, 6, 7, 10], lead: 'sine', tempo: 0.15, kick: true, snare: 'noise' },          // film: spooky blues
    { root: 110, scale: [0, 3, 7, 10, 12, 15], lead: 'sawtooth', tempo: 0.12, kick: true, snare: 'clap' },   // neon: synthwave minor
    { root: 130.8, scale: [0, 4, 7, 9, 11, 14], lead: 'triangle', tempo: 0.14, kick: false, snare: 'clap' },  // house: bossa major 7ths
    { root: 73.4, scale: [0, 2, 7, 9, 12, 14], lead: 'sine', tempo: 0.2, kick: false, snare: 'none' },         // sol: vast and slow
  ];
  const bassPat = [0, -1, -1, 0, -1, 1, -1, -1, 2, -1, 3, -1, -2, -1, -1, 1];
  function startMusic() {
    nextT = ac.currentTime + 0.1;
    setInterval(() => {
      if (!ac) return;
      while (nextT < ac.currentTime + 0.12) { schedule(step, nextT); step = (step + 1) % 64; nextT += M[mus].tempo; }
    }, 25);
  }
  function schedule(s, t) {
    if (muted || fileMusic) return;
    const m = M[mus], at = t - ac.currentTime, i = s % 16, bar = s >> 4, d = musG;
    const note = (k) => (k === -2 ? m.root * Math.pow(2, -2 / 12) : m.root * Math.pow(2, m.scale[k] / 12));
    if (m.kick && (i === 0 || i === 6 || i === 8 || i === 11)) tone({ type: 'sine', f: 120, f2: 40, dur: 0.18, vol: 0.5, at, dest: d });
    if (!m.kick && i % 8 === 0) tone({ type: 'sine', f: 60, f2: 40, dur: 0.6, vol: 0.35, at, dest: d });
    if (i === 4 || i === 12) {
      if (m.snare === 'clap') noise({ dur: 0.1, vol: 0.25, f: 1800, type: 'bandpass', q: 0.8, at, dest: d });
      else if (m.snare === 'noise') noise({ dur: 0.06, vol: 0.22, f: 5000, type: 'highpass', at, dest: d });
      else if (m.snare === 'tom') tone({ type: 'triangle', f: 200, f2: 90, dur: 0.14, vol: 0.28, at, dest: d });
    }
    if (i % 2 === 1 && mus !== 2) noise({ dur: 0.04, vol: 0.04 + intensity * 0.06, f: 7000, type: 'highpass', at, dest: d });
    const bn = bassPat[i];
    if (bn !== -1) tone({ type: mus === 2 ? 'triangle' : 'sawtooth', f: note(bn) * (bar === 3 ? 1.335 : 1) / 2, dur: mus === 2 ? 0.5 : 0.22, vol: 0.12, at, dest: d });
    if ((intensity > 0.5 || mus === 1 || mus === 3) && i % 2 === 0) {
      const n = m.scale[(i / 2 + bar) % m.scale.length];
      tone({ type: m.lead, f: m.root * 4 * Math.pow(2, n / 12), dur: mus === 2 ? 0.3 : 0.08, vol: 0.035, at, dest: d });
    }
  }
  return {
    init,
    get muted() { return muted; },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.55; if (track) track.muted = muted; },
    setIntensity(v) { intensity = v; },
    setWorld(i) { mus = clamp(i, 0, M.length - 1); worldKey = WORLDS[mus].key; bossMusic = false; if (ac) playMusic(); },
    status() { return { ready: !!ac, samples: Object.keys(buffers).length, fileMusic, track: trackKey, playing: !!(track && !track.paused), vol: track ? +track.volume.toFixed(2) : 0, audible: allTracks.filter((o) => !o.paused && o.volume > 0.01).map((o) => o.src.split('/').pop()) }; },
    setBoss(on) { if (bossMusic === on) return; bossMusic = on; if (ac) playMusic(); },
    duck(k) { musicDuck = k; const def = MUSIC[trackKey]; if (track && def) fadeTo(track, def[1] * k, 0.8); },
    chomp(pitch = 1) { if (!ok('chomp', 0.04)) return; if (sample('eat', { rate: clamp(pitch, 0.7, 1.3) })) return; noise({ dur: 0.08, vol: 0.35, f: 2500 * pitch, f2: 400, q: 2 }); tone({ type: 'square', f: 180 * pitch, f2: 60, dur: 0.09, vol: 0.18 }); },
    squish() { if (!ok('squish', 0.05)) return; if (sample('eat')) return; tone({ type: 'sine', f: rand(500, 700), f2: 120, dur: 0.15, vol: 0.25 }); noise({ dur: 0.1, vol: 0.2, f: 900, f2: 300, type: 'bandpass', q: 3 }); },
    crunch() { if (!ok('crunch', 0.09)) return; if (sample('eat', { vol: 0.45, rate: 1.15 })) return; noise({ dur: 0.06, vol: 0.18, f: rand(1500, 3000), type: 'bandpass', q: 3 }); },
    metal() { if (!ok('metal', 0.08)) return; tone({ type: 'square', f: rand(600, 900), f2: 200, dur: 0.12, vol: 0.12 }); noise({ dur: 0.1, vol: 0.2, f: 4000, type: 'highpass' }); },
    bite() { if (!ok('bite', 0.05)) return; if (sample('bite', { vol: 0.75 })) return; noise({ dur: 0.1, vol: 0.3, f: 1800, f2: 300, q: 4, type: 'bandpass' }); tone({ type: 'sawtooth', f: 90, f2: 50, dur: 0.12, vol: 0.2 }); },
    jump() { if (!ok('jump')) return; if (sample('jump', { vol: 0.5 })) return; tone({ type: 'square', f: 260, f2: 520, dur: 0.12, vol: 0.08 }); },
    boing() { if (!ok('boing', 0.05)) return; if (sample('jump', { vol: 0.6 })) return; tone({ type: 'sine', f: 220, f2: 660, dur: 0.18, vol: 0.18 }); },
    pounce() { if (!ok('pounce')) return; if (sample('pounce', { vol: 0.55 })) return; noise({ dur: 0.2, vol: 0.22, f: 600, f2: 3000, type: 'bandpass', q: 1.5 }); },
    roar(pitch) { if (!ok('roar', 0.3)) return; if (sample('roar', { vol: 0.9, rate: clamp(pitch + 0.2, 0.6, 1.4) })) return; const f = 220 * pitch;
      tone({ type: 'sawtooth', f, f2: f * 0.55, dur: 0.9, vol: 0.32, attack: 0.05 });
      tone({ type: 'sawtooth', f: f * 1.02, f2: f * 0.5, dur: 0.9, vol: 0.25, attack: 0.05 });
      noise({ dur: 0.9, vol: 0.3, f: 900, f2: 200, q: 2, type: 'bandpass' }); },
    spit() { if (!ok('spit', 0.08)) return; if (sample('spit', { vol: 0.7 })) return; noise({ dur: 0.15, vol: 0.25, f: 1200, f2: 300, type: 'bandpass', q: 2 }); tone({ type: 'sine', f: 300, f2: 120, dur: 0.15, vol: 0.15 }); },
    thwip() { if (!ok('thwip', 0.05)) return; noise({ dur: 0.12, vol: 0.2, f: 3000, f2: 6000, type: 'bandpass', q: 4 }); },
    zap() { if (!ok('zap', 0.08)) return; for (let k = 0; k < 4; k++) tone({ type: 'square', f: rand(800, 2400), f2: rand(100, 400), dur: 0.12, vol: 0.06, at: k * 0.04 }); noise({ dur: 0.3, vol: 0.2, f: 5000, type: 'highpass' }); },
    gulp() { if (!ok('gulp', 0.5)) return; sample('burp', { vol: 0.8, at: 1.3 }); noise({ dur: 1.3, vol: 0.3, f: 300, f2: 2000, type: 'bandpass', q: 1 }); tone({ type: 'sine', f: 80, f2: 200, dur: 1.3, vol: 0.2 }); },
    whoosh() { if (!ok('whoosh', 0.1)) return; if (sample('blink', { vol: 0.7 })) return; noise({ dur: 0.25, vol: 0.3, f: 400, f2: 4000, type: 'bandpass', q: 1 }); tone({ type: 'sine', f: 1200, f2: 200, dur: 0.25, vol: 0.08 }); },
    vortex() { if (!ok('vortex', 1)) return; tone({ type: 'sawtooth', f: 40, f2: 25, dur: 3, vol: 0.25, attack: 0.3 }); noise({ dur: 3, vol: 0.3, f: 150, f2: 600, type: 'lowpass' }); },
    shoot(kind) { if (!ok('shoot' + kind, 0.06)) return; if (kind !== 'coconut' && sample('shoot', { vol: 0.35 })) return;
      if (kind === 'bullet') noise({ dur: 0.05, vol: 0.18, f: 3000, type: 'highpass' });
      else if (kind === 'hex' || kind === 'harpoon') tone({ type: 'square', f: 1400, f2: 300, dur: 0.12, vol: 0.06 });
      else if (kind === 'goo') { tone({ type: 'sine', f: 300, f2: 120, dur: 0.15, vol: 0.12 }); }
      else noise({ dur: 0.12, vol: 0.12, f: 1500, f2: 500, type: 'bandpass' }); },
    enemyRoar() { if (!ok('eroar', 1)) return; if (sample('eroar', { vol: 0.85, rate: 0.8 })) return; tone({ type: 'sawtooth', f: 130, f2: 70, dur: 0.6, vol: 0.18, attack: 0.04 }); noise({ dur: 0.6, vol: 0.15, f: 700, f2: 200, type: 'bandpass' }); },
    hurt(big = true) { if (!ok('hurt', 0.1)) return; if (big && sample('hurt', { vol: 0.8 })) return; tone({ type: 'square', f: big ? 400 : 600, f2: big ? 80 : 300, dur: big ? 0.25 : 0.08, vol: big ? 0.2 : 0.08 }); if (big) noise({ dur: 0.15, vol: 0.25, f: 1200 }); },
    stomp() { if (!ok('stomp', 0.1)) return; if (sample('stomp', { vol: 0.9 }) || sample('boom', { vol: 0.8, rate: 0.7 })) return; tone({ type: 'sine', f: 90, f2: 30, dur: 0.5, vol: 0.6 }); noise({ dur: 0.5, vol: 0.4, f: 500, f2: 60 }); },
    boom() { if (!ok('boom', 0.06)) return; if (sample('boom', { vol: 0.75 })) return; tone({ type: 'sine', f: 70, f2: 25, dur: 0.8, vol: 0.6 }); noise({ dur: 1.0, vol: 0.5, f: 2000, f2: 80 }); },
    whistle() { if (!ok('whistle', 0.15)) return; tone({ type: 'sine', f: 1800, f2: 300, dur: 1.3, vol: 0.05 }); },
    evolve() { if (!ac || muted) return; if (sample('evolve', { vol: 0.8 })) return; [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone({ type: 'square', f: 220 * Math.pow(2, n / 12), dur: 0.18, vol: 0.12, at: i * 0.07 })); },
    warp() { if (!ac || muted) return; noise({ dur: 0.9, vol: 0.3, f: 3000, type: 'highpass' }); tone({ type: 'sawtooth', f: 60, f2: 1500, dur: 0.9, vol: 0.12, attack: 0.1 }); },
    victory() { if (!ac || muted) return; [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => tone({ type: 'square', f: 262 * Math.pow(2, n / 12), dur: 0.25, vol: 0.12, at: i * 0.12 })); },
    combo(n) { if (!ok('combo', 0.02)) return; tone({ type: 'triangle', f: 440 * Math.pow(2, Math.min(n, 24) / 12), dur: 0.12, vol: 0.12 }); },
    gold() { if (!ok('gold', 0.05)) return; if (sample('gold', { vol: 0.5 })) return; tone({ type: 'square', f: 1320, dur: 0.06, vol: 0.07 }); tone({ type: 'square', f: 1760, dur: 0.1, vol: 0.07, at: 0.06 }); },
    alarm() { if (!ok('alarm', 0.5)) return; [0, 0.25].forEach((at) => tone({ type: 'square', f: 660, f2: 440, dur: 0.2, vol: 0.1, at })); },
    beat() { if (!ok('beat', 0.5)) return; tone({ type: 'sine', f: 70, f2: 40, dur: 0.12, vol: 0.3 }); tone({ type: 'sine', f: 70, f2: 40, dur: 0.12, vol: 0.22, at: 0.16 }); },
    die() { if (!ac || muted) return; if (sample('die', { vol: 0.9 })) return; tone({ type: 'sawtooth', f: 300, f2: 40, dur: 1.4, vol: 0.25 }); },
    beam() { if (!ok('beam', 0.2)) return; if (sample('beam', { vol: 0.6 })) return; tone({ type: 'sawtooth', f: 900, f2: 300, dur: 0.6, vol: 0.12 }); tone({ type: 'sine', f: 1400, f2: 700, dur: 0.6, vol: 0.08 }); },
    note(f, vol = 0.1) { if (!ok('note', 0.03)) return; tone({ type: 'triangle', f, dur: 0.9, vol, attack: 0.004 }); tone({ type: 'sine', f: f * 2, dur: 0.45, vol: vol * 0.45, attack: 0.004 }); },
    bonk() { if (!ok('bonk', 0.08)) return; if (sample('bonk', { vol: 0.9 })) return; tone({ type: 'square', f: 520, f2: 180, dur: 0.12, vol: 0.15 }); noise({ dur: 0.08, vol: 0.25, f: 1500, type: 'bandpass', q: 3 }); },
    spring() { if (!ok('spring', 0.12)) return; if (sample('spring', { vol: 0.7 })) return; tone({ type: 'sine', f: 180, f2: 720, dur: 0.25, vol: 0.18 }); },
    blip() { if (!ok('blip', 0.05)) return; tone({ type: 'square', f: 880, dur: 0.05, vol: 0.06 }); },
  };
})();

// ============================================================ input
const keys = {}, pressedKeys = {};
const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
addEventListener('keydown', (e) => {
  if (!keys[e.code]) pressedKeys[e.code] = true;
  keys[e.code] = true;
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  SFX.init();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state === 'play') state = 'paused'; });

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const touchBtns = {}, touchPressed = {};
function touchLayout() {
  const s = clamp(Math.min(W, H) / 420, 0.8, 1.6), r = 32 * s, m = 20 * s;
  const swim = ERA && ERA.physics === 'swim', roam = ERA && ERA.physics === 'roam';
  return [
    { n: 'left', x: m + r, y: H - m - r, r, label: '◀' },
    { n: 'right', x: m + r * 3.4, y: H - m - r, r, label: '▶' },
    ...(swim || roam ? [{ n: 'down', x: m + r * 2.2, y: H - m - r * 3.2, r: r * 0.8, label: '▼' }] : []),
    ...(roam ? [{ n: 'up', x: m + r * 2.2, y: H - m - r * 5.0, r: r * 0.8, label: '▲' }] : []),
    { n: 'jump', x: W - m - r, y: H - m - r, r, label: swim ? '▲' : 'JUMP' },
    { n: 'pounce', x: W - m - r * 3.4, y: H - m - r * 0.8, r, label: 'BITE' },
    { n: 'a0', x: W - m - r * 1.1, y: H - m - r * 3.4, r: r * 0.75, label: 'E' },
    { n: 'a1', x: W - m - r * 3.1, y: H - m - r * 3.2, r: r * 0.75, label: 'R' },
    { n: 'a2', x: W - m - r * 2.1, y: H - m - r * 5.1, r: r * 0.75, label: 'Q' },
    ...(swim || roam ? [] : [{ n: 'stomp', x: W - m - r * 5.2, y: H - m - r * 2.3, r: r * 0.7, label: 'SMASH' }]),
  ];
}
function handleTouches(e) {
  e.preventDefault(); SFX.init();
  const lay = touchLayout(), held = {};
  for (const t of e.touches) for (const b of lay) if (Math.hypot(t.clientX - b.x, t.clientY - b.y) < b.r * 1.3) held[b.n] = true;
  for (const b of lay) { if (held[b.n] && !touchBtns[b.n]) touchPressed[b.n] = true; touchBtns[b.n] = !!held[b.n]; }
  if (e.type === 'touchstart') {
    touchPressed.any = true;
    if ((state === 'title' || tut) && e.touches[0]) uiClicks.push([e.touches[0].clientX, e.touches[0].clientY]);
  }
}
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((ev) => cvs.addEventListener(ev, handleTouches, { passive: false }));
let mouseX = -1, mouseY = -1;
const uiClicks = [];
cvs.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
cvs.addEventListener('mousedown', (e) => { SFX.init(); pressedKeys.Mouse = true; uiClicks.push([e.clientX, e.clientY]); });

let padPrev = {};
function readInput() {
  const k = (...c) => c.some((x) => keys[x]);
  const p = (...c) => c.some((x) => pressedKeys[x]);
  const R = ERA && ERA.physics === 'roam'; // W/S walk into and out of the screen; only SPACE jumps
  const inp = {
    left: k('KeyA', 'ArrowLeft') || touchBtns.left,
    right: k('KeyD', 'ArrowRight') || touchBtns.right,
    up: k('KeyW', 'ArrowUp') || (R ? touchBtns.up : k('Space') || touchBtns.jump),
    down: k('KeyS', 'ArrowDown') || touchBtns.down,
    leftP: p('KeyA', 'ArrowLeft') || touchPressed.eraL,
    rightP: p('KeyD', 'ArrowRight') || touchPressed.eraR,
    jump: (R ? k('Space') : k('KeyW', 'ArrowUp', 'Space')) || touchBtns.jump,
    jumpP: (R ? p('Space') : p('KeyW', 'ArrowUp', 'Space')) || touchPressed.jump,
    pounceP: p('ShiftLeft', 'ShiftRight', 'KeyJ', 'KeyX') || touchPressed.pounce,
    abilP: [p('KeyE', 'KeyK') || touchPressed.a0, p('KeyR', 'KeyL') || touchPressed.a1, p('KeyQ', 'KeyU') || touchPressed.a2],
    stompP: (!R && p('KeyS', 'ArrowDown')) || touchPressed.stomp,
    startP: p('Space', 'Enter') || touchPressed.any || pressedKeys.Mouse,
    startKeyP: p('Space', 'Enter'),
    tutP: p('KeyT'),
    pauseP: p('KeyP', 'Escape'),
    muteP: p('KeyM'),
  };
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue;
    const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    const now = { a: b(0), b: b(1), x: b(2), y: b(3), lb: b(4), rb: b(5), st: b(9), dn: b(13) || gp.axes[1] > 0.7, l: b(14) || gp.axes[0] < -0.6, r: b(15) || gp.axes[0] > 0.6 };
    const edge = (n) => now[n] && !padPrev[n];
    inp.left = inp.left || gp.axes[0] < -0.35 || b(14);
    inp.right = inp.right || gp.axes[0] > 0.35 || b(15);
    inp.up = inp.up || gp.axes[1] < -0.4 || (!R && now.a);
    inp.down = inp.down || gp.axes[1] > 0.4 || b(13);
    inp.leftP = inp.leftP || edge('l'); inp.rightP = inp.rightP || edge('r');
    inp.jump = inp.jump || now.a;
    inp.jumpP = inp.jumpP || edge('a');
    inp.pounceP = inp.pounceP || edge('x') || edge('b');
    inp.abilP = [inp.abilP[0] || edge('y'), inp.abilP[1] || edge('rb'), inp.abilP[2] || edge('lb')];
    inp.stompP = inp.stompP || (!R && edge('dn'));
    inp.startP = inp.startP || edge('a') || edge('st');
    inp.startKeyP = inp.startKeyP || edge('a') || edge('st');
    inp.pauseP = inp.pauseP || edge('st');
    padPrev = now;
    break;
  }
  for (const c in pressedKeys) delete pressedKeys[c];
  for (const c in touchPressed) delete touchPressed[c];
  return inp;
}

// ============================================================ world
let terrAmp = 1, cityMode = false;
// CREATURE FEATURE: the ground is a skyline. Each 300-unit block is a street or a building.
const CITY = 300;
function building(i) {
  if (i === 0 || i === -1 || hash(i * 1.31 + 7) < 0.36) return null;
  const tall = hash(i * 2.7 + 3);
  return { i, x0: i * CITY + CITY * (0.07 + hash(i + 0.5) * 0.1), x1: i * CITY + CITY * (0.93 - hash(i + 0.9) * 0.1), top: -Math.round(70 + Math.pow(tall, 1.7) * 300 + (tall > 0.93 ? 120 : 0)) };
}
function cityY(x) {
  const b = building(Math.floor(x / CITY));
  return b && x >= b.x0 && x <= b.x1 ? b.top : 0;
}
function streetNear(x) {
  for (let d = 0; d < CITY * 4; d += 20) { if (cityY(x + d) === 0) return x + d; if (cityY(x - d) === 0) return x - d; }
  return x;
}
let spaceMode = false, orbitMode = false, openMode = false;
const PCELL = 900;
const NEON = ['#3affd8', '#ff5ad8', '#ffe066', '#7dff6a', '#ff8a3a', '#b46aff'];
function planetAt(i, j) {
  if (i === 0 && j === 0) return { x: 0, y: 0, r: 200, i, j, col: 0, ring: false, seed: 0.37 };
  return {
    x: i * PCELL + (hash(i * 7.13 + j * 31.7) - 0.5) * PCELL * 0.26, y: j * PCELL + (hash(i * 3.7 - j * 11.3 + 5) - 0.5) * PCELL * 0.26,
    r: 120 + hash(i * 1.9 + j * 5.3 + 9) * 180, i, j, col: Math.floor(hash(i + j * 13 + 2) * NEON.length), ring: hash(i * 5 + j * 1.3) > 0.72, seed: hash(i * 9 + j * 2),
  };
}
function nearestPlanet(x, y) { // nearest by distance to the surface
  const i0 = Math.round(x / PCELL), j0 = Math.round(y / PCELL);
  let best = null, bd = Infinity;
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
    const P = planetAt(i0 + di, j0 + dj), d = Math.hypot(x - P.x, y - P.y) - P.r;
    if (d < bd) { bd = d; best = P; }
  }
  return best;
}
function pushOutOfPlanet(c) {
  const P = nearestPlanet(c.x, c.y), dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1, min = P.r + c.h * 0.55;
  if (d < min) { c.x = P.x + dx / d * min; c.y = P.y + dy / d * min; const n = (c.vx * dx + c.vy * dy) / d; if (n < 0) { c.vx -= dx / d * n * 1.5; c.vy -= dy / d * n * 1.5; } }
}
let houseMode = false, lastPlat = null;
const HCELL = 1100;
const FURN_KINDS = ['piano', 'kitchen', 'table', 'shelf', 'sofa', 'bed', 'rug'];
const furnCache = new Map();
function furniture(i) {
  let F = furnCache.get(i);
  if (F) return F;
  const n = FURN_KINDS.length, kind = i === 0 || i === -1 ? 'rug' : FURN_KINDS[(((i % n) + n) % n + Math.floor(hash(Math.floor(i / n) * 3.17 + 1) * n)) % n]; // every 7 rooms has one of each
  const x0 = i * HCELL, P = [];
  const add = (a, b, top, k = 'solid', extra) => P.push(Object.assign({ x0: x0 + a, x1: x0 + b, top, kind: k, cell: i }, extra || {}));
  const books = (a) => { add(a, a + 110, -70, 'books'); add(a + 20, a + 90, -140, 'books'); };
  switch (kind) {
    case 'rug': add(300, 380, -80, 'block'); add(380, 460, -80, 'block'); add(340, 420, -160, 'block'); add(720, 800, -80, 'block'); break;
    case 'piano': books(20); add(300, 700, -200, 'bench'); add(120, 880, -310, 'keys', { keys: 22 }); add(90, 910, -520, 'lid'); add(430, 570, -600, 'stand'); break;
    case 'kitchen': add(80, 240, -150, 'stool'); add(250, 330, -250, 'trash'); add(300, 640, -370, 'counter'); add(640, 860, -370, 'stove'); add(860, 1060, -370, 'counter');
      add(380, 500, -470, 'toaster'); add(520, 600, -560, 'cereal'); add(300, 1060, -760, 'cabinet'); add(880, 1000, -650, 'spice'); break;
    case 'table': books(420); add(60, 230, -240, 'seat'); add(60, 95, -450, 'chairback'); add(870, 1040, -240, 'seat'); add(1005, 1040, -450, 'chairback'); add(200, 900, -410, 'tabletop'); break;
    case 'shelf': books(80); for (const t of [-150, -300, -450, -600]) add(250, 850, t, 'shelfboard'); add(250, 850, -750, 'shelftop'); break;
    case 'sofa': add(100, 1000, -160, 'bouncy'); add(100, 230, -270, 'bouncy'); add(870, 1000, -270, 'bouncy'); add(230, 870, -380, 'bouncy'); break; // it's all cushions
    case 'bed': books(0); add(80, 960, -230, 'bouncy'); add(760, 940, -290, 'bouncy'); add(940, 1060, -470, 'headboard'); break;
  }
  F = { i, kind, x0, plats: P };
  furnCache.set(i, F);
  if (furnCache.size > 80) furnCache.delete(furnCache.keys().next().value);
  return F;
}
// the highest surface at or below height y (remember: up is negative)
function floorAt(x, y) {
  let best = 0, bp = null;
  for (const P of furniture(Math.floor(x / HCELL)).plats) if (x >= P.x0 && x <= P.x1 && P.top >= y - 0.5 && P.top < best) { best = P.top; bp = P; }
  lastPlat = bp;
  return best;
}
function pickSurface(x) {
  const tops = [0, 0];
  for (const P of furniture(Math.floor(x / HCELL)).plats) if (x >= P.x0 + 10 && x <= P.x1 - 10) tops.push(P.top);
  return pick(tops);
}
const pianoKeyHz = (k) => 196 * Math.pow(2, ([0, 2, 4, 7, 9][k % 5] + 12 * Math.floor(k / 5)) / 12);
const stoveHot = (P) => Math.sin(realT * 0.55 + P.cell * 1.7) > 0.35;
const pressedKeys2 = {};
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function groundY(x) {
  if (openMode) return 1e9;
  if (cityMode) return cityY(x);
  const a = terrAmp;
  return -(Math.sin(x * 0.00043 + 2) * 170 * a + Math.sin(x * 0.0021) * 55 * a + Math.sin(x * 0.0057 + 1) * 22 * a + Math.sin(x * 0.013 + 4) * 6 * Math.min(1, a * 2));
}
const groundSlope = (x) => (cityMode ? 0 : (groundY(x + 4) - groundY(x - 4)) / 8);
const sizeH = (m) => 26 * Math.pow(m, 0.42);
let SURF = -THEMES.deep.depth; // water surface in The Deep; far edge of the meadow in Cube Country
const KG = 120;
const GROWTH = 0.06;
const G = 40; // gravity in body-heights / s^2
const CD = { pounce: 0.8, smash: 4 };

// ============================================================ game state
let state = 'loading'; // loading | title | play | paused | dying | dead | warp | victory
let creatures = [], corpses = [], particles = [], meteors = [], texts = [], scorches = [], projectiles = [];
let player = null;
let cam = { x: 0, y: 0, viewH: 300, zoom: 2, shake: 0, rot: 0 };
let bgFar = 0, bgMid = 0, prevCamX = 0;
let gameT = 0, eraT = 0, realT = 0, freeze = 0, slowmo = 0, flash = 0, flashColor = '#fff';
let spawnTimer = 0, eventT = 30, event = null, lastEvent = '', meteorRandT = 0;
let banner = null, hint = null, hintIdx = 0;
let eraIdx = 0, ERA = ERAS[0], THEME = THEMES[ERA.theme], STYLE = ERA.style, cycle = 1;
let boss = null, bossT = -1, clearT = -1, warpT = 0, warped = false, warpFirst = false, titleEra = 0;
let best = 0, unlockedEra = 0;
try { best = +localStorage.getItem('chompo_best') || 0; unlockedEra = clamp(+localStorage.getItem('chompo_world') || 0, 0, ERAS.length - 1); } catch (e) { /* storage unavailable */ }
let stats = null, deathCause = '', deadT = 0, victoryT = 0, skyDoom = 0;

const form = () => FORMS[ERA.forms[player.form]];
const swim = () => ERA.physics === 'swim' || ERA.physics === 'roam' || ERA.physics === 'space' || ERA.physics === 'orbit'; // a 2-D plane with no floor
const space = () => ERA.physics === 'space';
const water = () => ERA.physics === 'swim';
const roam = () => ERA.physics === 'roam';
const use3D = () => window.R3D && ((STYLE === '3d' && window.R3D.ok()) || (STYLE === 'real' && window.R3D.spaceOk()));
const cycleMul = () => 1 + (cycle - 1) * 0.35;
const FONT = () => ERA.font;

function newPlayer() {
  return {
    active: true, x: 0, y: groundY(0), vx: 0, vy: 0, face: 1, onGround: true, jumps: 2,
    mass: 2, shownMass: 2, belly: 100, form: 0, h: sizeH(2), w: 0,
    pounce: 0, pounceCD: 0, smashCD: 0, cds: [0, 0, 0], roarAnim: 0, stomping: false, invuln: 0, biteCD: 0, hurtFlash: 0,
    vacT: 0, auraT: 0, auraTick: 0, frenzyT: 0, rollT: 0, voidFx: null, cycT: 0, beam: null, leaping: false,
    z: 0, vz: 0, hx: 1, hy: 0, climb: 0,
    phase: 0, combo: 0, comboT: 0, score: 0, eatT: 0, dead: false, deathT: 0,
  };
}
function playerDims(p) {
  const f = FORMS[ERA.forms[p.form]], S = SPRITES[f.sheet];
  if (f.human) { p.h = sizeH(p.shownMass) * (f.hMul || 1); p.w = p.h * (f.human === 'baby' ? 1.25 : 0.55); return; }
  if (f.space3d) { p.h = sizeH(p.shownMass) * (f.hMul || 1); p.w = p.h; return; }
  if (f.model || f.vec) { p.h = sizeH(p.shownMass) * (f.hMul || 1); p.w = p.h * (f.vec === 'whale' ? 1.5 : 1.1); return; }
  p.h = sizeH(p.shownMass) * (f.hMul || 1) * (S.h <= 32 && S.w <= 16 ? 1.15 : 1); p.w = p.h * S.w / S.h;
}
function resetWorld() {
  creatures = []; corpses = []; particles = []; meteors = []; texts = []; scorches = []; projectiles = [];
  event = null; eventT = 28; lastEvent = ''; meteorRandT = 0; eraT = 0; freeze = 0; slowmo = 0;
  banner = null; hintIdx = 0; hint = null; boss = null; bossT = -1; clearT = -1;
}
function setWorld(i) {
  eraIdx = i; ERA = ERAS[i]; THEME = THEMES[ERA.theme]; STYLE = ERA.style; terrAmp = THEME.amp;
  cityMode = ERA.physics === 'city';
  spaceMode = ERA.physics === 'space';
  houseMode = ERA.physics === 'house';
  orbitMode = ERA.physics === 'orbit';
  openMode = spaceMode || orbitMode;
  SURF = openMode ? -1e9 : -(THEME.depth || 1500);
  if (orbitMode && window.R3D && window.R3D.loadSpace) window.R3D.loadSpace();
  cam.rot = 0;
  if (window.R3D) window.R3D.show(STYLE === '3d' && window.R3D.ok());
  SFX.duck(1);
  SFX.setWorld(i);
}
function loadEra(i, keepScore) {
  setWorld(i);
  const score = keepScore && player ? player.score : 0;
  resetWorld();
  player = newPlayer(); player.score = score;
  if (water()) player.y = groundY(0) - 300;
  if (roam()) player.y = SURF * 0.5;
  if (orbitMode) { player.y = 0; player.hx = 1; player.hy = 0; }
  if (space()) { player.y = -planetAt(0, 0).r - player.h * 0.45; player.upA = -Math.PI / 2; player.trail = []; }
  playerDims(player);
  cam.x = player.x; cam.y = player.y - player.h * 1.5; cam.viewH = player.h * 7.5;
  if (i > unlockedEra) { unlockedEra = i; try { localStorage.setItem('chompo_world', String(i)); } catch (e) { /* ignore */ } }
  state = 'play';
  for (let k = 0; k < 4; k++) spawnGroup(ERA.spawn[0][0], player.x + sign(rand(-1, 1)) * rand(150, 420));
  const f = form();
  hint = { text: 'you are ' + (/^THE /.test(f.name) ? '' : f.name === 'GRANDPA' ? '' : 'a ') + f.name + (f.abilities.length ? '  ·  ' + abilityHint(f.abilities[0], 0) : '') + (water() ? '  ·  W/S to swim up & down' : roam() ? '  ·  W/A/S/D roam anywhere, SPACE jumps' : orbitMode ? '  ·  W/A/S/D thrust; momentum carries you, and big bodies pull you in' : houseMode ? '  ·  jump up onto the furniture, S drops through, piano keys play' : space() ? '  ·  run around the planet, hold SPACE to float to the next one' : cityMode ? '  ·  walk into a building to CLIMB it' : ''), t: 7 };
}
function abilityHint(key, slot) { const A = ABILITIES[key]; return A.name + ' [' + 'ERQ'[slot] + '] — ' + A.desc; }
function startGame(era) {
  stats = { eaten: 0, kills: 0, bestCombo: 0, time: 0, bosses: 0, startEra: era };
  gameT = 0; cycle = 1;
  loadEra(era, false);
  state = 'warp'; warpT = 1.0; warped = true; warpFirst = true;
}
// ============================================================ tutorial
let tut = null;
const TUT = [
  { word: 'MOVE', keys: [['A', 'KeyA'], ['D', 'KeyD']], alt: [['◀', 'ArrowLeft'], ['▶', 'ArrowRight']] },
  { word: 'JUMP', keys: [['SPACE', 'Space']] },
  { word: 'EAT SMALL THINGS', keys: [] },
  { word: 'BITE BIG THINGS', keys: [['SHIFT', 'ShiftLeft']] },
  { word: 'EAT TO GROW', keys: [] },
  { word: 'USE YOUR POWER', keys: [['E', 'KeyE']] },
  { word: "YOU'RE READY!", keys: [] },
];
function startTutorial() {
  stats = { eaten: 0, kills: 0, bestCombo: 0, time: 0, bosses: 0, startEra: 0 };
  gameT = 0; cycle = 1;
  loadEra(0, false);
  creatures = []; hint = null; hintIdx = 99;
  tut = { step: 0, t: 0, done: 0, x0: player.x, e0: 0, spawnT: 0 };
}
function tutSpawn(spKey, mass, dx) {
  const c = makeCreature(spKey, mass, player.x + player.face * dx);
  c.pin = true; c.face = -player.face;
  return c;
}
function nextTut() { tut.step++; tut.t = 0; tut.done = 0; tut.e0 = stats.eaten; SFX.gold(); }
function updateTutorial(dt, inp) {
  const p = player, s = tut.step, vw = viewW();
  tut.t += dt;
  p.belly = 100;
  if (inp.pauseP) { tut = null; startTitle(); return; }
  if (tut.done) { tut.done -= dt; if (tut.done <= 0) { if (s === TUT.length - 1) { tut = null; titleEra = 0; startTitle(); return; } nextTut(); } return; }
  const finish = (wait = 0.6) => { tut.done = wait; };
  if (s === 0 && Math.abs(p.x - tut.x0) > p.h * 5) finish();
  if (s === 1 && !p.onGround && p.vy < 0) finish(0.9);
  if (s === 2) {
    if (tut.t < dt * 1.5) for (let k = 0; k < 3; k++) tutSpawn('compy', 0.6, vw * (0.25 + k * 0.08));
    if (stats.eaten - tut.e0 >= 3) finish();
  }
  if (s === 3) {
    if (tut.t < dt * 1.5) { tut.big = tutSpawn('trike', p.mass * 2.2, vw * 0.3); tut.big.hp = tut.big.maxHp = p.mass * 1.6; }
    if (tut.big && !tut.big.alive) finish(1.2);
  }
  if (s === 4) { // a buffet; each snack counts extra so you evolve quickly
    tut.spawnT -= dt;
    if (tut.spawnT <= 0 && creatures.filter((c) => c.alive).length < 6) { tut.spawnT = 0.35; tutSpawn('compy', 0.7, rand(-1, 1) * vw * 0.45 || vw * 0.3); }
    const n = stats.eaten - tut.e0; if (n > (tut.n || 0)) { p.mass += 0.9 * (n - (tut.n || 0)); tut.n = n; }
    if (p.form >= 1) finish(2.6);
  }
  if (s === 5 && p.cds[0] > 0) finish(1.4);
  if (s === 6 && tut.t > 0.1 && !tut.done) finish(2.4);
}
function keycap(x, y, label, down, u) {
  const w = Math.max(44, label.length * 15) * u, h = 44 * u;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 3, y - h / 2 + 5, w, h, 8 * u); ctx.fill();
  ctx.fillStyle = down ? '#ffd23a' : '#ffffff'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2 + (down ? 3 : 0), w, h, 8 * u); ctx.fill();
  txt(label, x, y + 9 * u + (down ? 3 : 0), 18 * u, '#2a1a10', 'center', false, '"Bungee", sans-serif');
  return w;
}
function drawTutorial() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const u = clamp(Math.min(W, H) / 700, 0.6, 1.3), s = tut.step, T = TUT[s], cx = W / 2, y0 = H * 0.2;
  const pop = 1 + Math.max(0, 0.25 - tut.t) * 1.6;
  for (let i = 0; i < TUT.length; i++) { ctx.fillStyle = i < s || (i === s && tut.done) ? '#7dd34a' : i === s ? '#ffffff' : 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(cx + (i - (TUT.length - 1) / 2) * 22 * u, y0 - 46 * u, 6 * u, 0, Math.PI * 2); ctx.fill(); }
  const fs = Math.min(46 * u, W / (T.word.length * 0.85)) * pop;
  txt(T.word, cx, y0 + fs * 0.35, fs, tut.done ? '#7dd34a' : '#ffffff', 'center', true, '"Bungee", sans-serif');
  if (tut.done && s < TUT.length - 1) txt('✓', cx + Math.min(W * 0.4, T.word.length * fs * 0.45 + 40 * u), y0 + fs * 0.35, fs, '#7dd34a', 'center', true, '"Bungee", sans-serif');
  const keys = isTouch ? [] : T.keys;
  if (keys.length) {
    const gap = 16 * u, ws = keys.map(([l]) => Math.max(44, l.length * 15) * u), total = ws.reduce((a, b) => a + b, 0) + gap * (keys.length - 1);
    let x = cx - total / 2;
    keys.forEach(([l, code], i) => { keycap(x + ws[i] / 2, y0 + 64 * u, l, isKeyDown(code), u); x += ws[i] + gap; });
  }
  if (isTouch && T.keys.length) txt({ MOVE: '◀  ▶', JUMP: 'JUMP', 'BITE BIG THINGS': 'BITE', 'USE YOUR POWER': 'E' }[T.word] || '', cx, y0 + 70 * u, 22 * u, '#ffd23a', 'center', true, '"Bungee", sans-serif');
  if (s === 4) { const f = clamp((player.mass - ERA.at[0]) / (ERA.at[1] - ERA.at[0]), 0, 1), bw = 260 * u; bar(cx - bw / 2, y0 + 50 * u, bw, 14 * u, f, '#c070ff'); }
  // point at the thing to eat or bite
  const target = s === 2 || s === 4 ? creatures.find((c) => c.alive && canEat(c)) : s === 3 && tut.big && tut.big.alive ? tut.big : null;
  if (target && !tut.done) {
    const [sx, sy] = toScreen(target.x, target.y - target.h * 1.3), b = Math.sin(realT * 8) * 6 * u;
    ctx.fillStyle = s === 3 ? '#ff5a3a' : '#7dff6a';
    ctx.beginPath(); ctx.moveTo(sx - 14 * u, sy - 30 * u + b); ctx.lineTo(sx + 14 * u, sy - 30 * u + b); ctx.lineTo(sx, sy - 8 * u + b); ctx.fill();
  }
  txt('ESC  quit', W - 16 * u, H - 16 * u, 10 * u, 'rgba(255,255,255,0.6)', 'right', false, '"Bungee", sans-serif');
}
const isKeyDown = (code) => !!keys[code] || (code === 'KeyA' && keys.ArrowLeft) || (code === 'KeyD' && keys.ArrowRight) || (code === 'Space' && (keys.KeyW || keys.ArrowUp)) || (code === 'ShiftLeft' && keys.ShiftRight);
function startTitle() {
  tut = null;
  setWorld(clamp(titleEra, 0, ERAS.length - 1));
  resetWorld();
  player = newPlayer(); player.active = false;
  playerDims(player);
  cam.x = 0; cam.y = space() ? -320 : swim() ? SURF * 0.5 : groundY(0) - 120; cam.viewH = 420;
  if (window.R3D) window.R3D.show(STYLE === '3d' && window.R3D.ok());
  state = 'title';
}

// ============================================================ creatures
function focusX() { return player && player.active ? player.x : cam.x; }
function viewW() { return cam.viewH * W / H; }
function waterY(x, h) { if (openMode) return (player && player.active ? player.y : cam.y) + rand(-1, 1) * cam.viewH * 0.8; return clamp(rand(SURF + 200, groundY(x) - h), SURF + h, groundY(x) - h * 0.3); }
function makeCreature(spKey, mass, x, opts = {}) {
  const sp = SP[spKey];
  const key = opts.key || (sp.imgs.length ? pick(sp.imgs) : null);
  const modelKey = sp.models ? pick(sp.models) : sp.model || null;
  const hm = (sp.hMul || 1) * (opts.hMul || 1);
  let h, w;
  if (sp.draw === 'wisp') { h = sizeH(mass) * 0.55; w = h; }
  else if (modelKey) { h = sizeH(mass) * hm; w = h * (sp.models ? 1 : 1.1); }
  else if (sp.pd) { h = sizeH(mass) * hm; w = h * (sp.pdw || 1); }
  else if (sp.vec) { h = sizeH(mass) * hm; w = h * ({ saucer: 1.7, shark: 1.8, tri: 1.25, serpent: 1.3, astro: 0.8 }[sp.vec] || 1); }
  else {
    const S = SPRITES[key];
    h = sizeH(mass) * hm * (S.w === 16 ? 1.15 : 1); w = h * S.w / S.h;
  }
  const c = {
    sp, spKey, key, mass, h, w, x, y: groundY(x), vx: 0, vy: 0, face: Math.random() < 0.5 ? -1 : 1,
    hp: mass * sp.hpMul, maxHp: 0, state: 'idle', t: rand(0.3, 2), cd: rand(0.5, 2.5), cd2: rand(2, 4), cd3: rand(5, 8), cd4: rand(8, 11),
    phase: rand(6), stun: 0, flash: 0, hurtCD: 0, alive: true, onGround: true, gold: !!opts.gold,
    angry: !!opts.angry, boss: !!opts.boss, bdef: opts.bdef || null, ally: !!opts.ally, life: opts.life || 0,
    flying: sp.ai === 'flyer', swim: !!sp.swim, turnT: 0, fleeT: 0, homeX: x, chaseT: 0,
    actT: 0, actMax: 1, fireCD: 0, seed: Math.random(), faceL: sp.faceLs ? sp.faceLs[key] : sp.faceL, tint: opts.tint || sp.tint || null, burst: 0, burstT: 0,
    glued: 0, webbed: 0, tents: [], model: modelKey, vec: sp.vec || null, z: 0, vz: 0, waves: [],
  };
  if (spaceMode && !c.boss) pushOutOfPlanet(c);
  c.pd = sp.pd || null;
  if (houseMode && !c.flying) {
    c.y = opts.y !== undefined ? floorAt(c.x, opts.y) : pickSurface(c.x);
    if (sp.ai === 'dropper') { c.hangY = c.y - h * rand(1.8, 3); c.y = c.hangY; c.flying = true; }
  }
  if (houseMode && c.flying && sp.ai === 'flyer') c.y = pickSurface(c.x) - h * rand(2, 4);
  if (cityMode && sp.vehicle && sp.ai !== 'flyer') { c.x = c.homeX = streetNear(x); c.y = 0; }
  if (c.boss) c.hp *= opts.bdef.hp;
  c.maxHp = c.hp;
  if (c.flying) { c.y = groundY(x) - h * rand(2.5, 4); c.face = sign(focusX() - x); }
  if (c.swim) { c.y = opts.y !== undefined ? opts.y : sp.bottom ? groundY(x) : waterY(x, h); c.face = sign(rand(-1, 1)); }
  if (sp.ai === 'boat') c.y = SURF + h * 0.42;
  creatures.push(c);
  return c;
}
function spawnGroup(entry, x, opts) {
  const [spKey, , mMin, mMax, gMin, gMax] = entry;
  const n = randi(gMin, gMax);
  const base = rand(mMin, mMax);
  const out = [];
  const sp = SP[spKey];
  let yb = sp.swim && !sp.bottom ? waterY(x, sizeH(base)) : undefined;
  if (openMode) yb = (player && player.active ? player.y : cam.y) + rand(-1, 1) * cam.viewH * 0.8;
  if (houseMode && !sp.swim) { const top = pickSurface(x); for (let i = 0; i < n; i++) { const m = base * rand(0.75, 1.25); out.push(makeCreature(spKey, m, x + rand(-1, 1) * sizeH(m) * 2.2, Object.assign({}, opts, { y: top }))); } return out; }
  if (roam() && player && player.active) yb = clamp(player.y + rand(-1, 1) * cam.viewH * 0.7, SURF + 60, -sizeH(base));
  for (let i = 0; i < n; i++) {
    const m = base * rand(0.75, 1.25);
    const xx = x + rand(-1, 1) * sizeH(m) * 2.2;
    out.push(makeCreature(spKey, m, xx, Object.assign({}, opts, yb !== undefined ? { y: clamp(yb + rand(-1, 1) * sizeH(m) * 1.5, SURF + 40, groundY(xx) - 10) } : {})));
  }
  return out;
}
function updateSpawning(dt) {
  spawnTimer -= dt;
  if (spawnTimer > 0) return;
  spawnTimer = 0.45;
  const fx = focusX(), vw = viewW();
  const fy = player && player.active ? player.y : cam.y;
  const near = creatures.filter((c) => (openMode ? Math.hypot(c.x - fx, c.y - fy) < vw * 1.2 : Math.abs(c.x - fx) < vw * 1.6) && !c.boss && !c.ally).length;
  const fi = player && player.active ? player.form : 1;
  const target = 13 + fi * 2 + (W > H ? 2 : 0) - (boss ? 4 : 0) + (swim() ? 3 : 0);
  if (near >= target) return;
  const table = ERA.spawn[Math.min(fi, ERA.spawn.length - 1)];
  const tot = table.reduce((s, e) => s + e[1], 0);
  let r = rand(tot), entry = table[0];
  for (const e of table) { r -= e[1]; if (r <= 0) { entry = e; break; } }
  const side = player && player.active && Math.abs(player.vx) > player.h ? (Math.random() < 0.7 ? sign(player.vx) : -sign(player.vx)) : sign(rand(-1, 1));
  if (openMode) { const a = rand(Math.PI * 2), d = vw * rand(0.65, 0.95); spawnGroup(entry, fx + Math.cos(a) * d, { y: fy + Math.sin(a) * d }); return; }
  spawnGroup(entry, fx + side * vw * rand(0.7, 1.15));
}

// ============================================================ effects
function burst(x, y, n, colors, spd, size, opts = {}) {
  for (let i = 0; i < n && particles.length < 1100; i++) {
    const a = opts.angle !== undefined ? opts.angle + rand(-opts.spread, opts.spread) : rand(Math.PI * 2);
    const s = spd * rand(0.3, 1), life = rand(0.4, 1) * (opts.life || 0.8);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opts.up || 0), life, max: life, size: size * rand(0.5, 1.2), color: pick(colors), grav: opts.grav === undefined ? (swim() ? 0.15 : 1) : opts.grav, kind: opts.kind || 'sq' });
  }
}
function ring(x, y, r0, r1, color, life = 0.5, width = 4) { particles.push({ kind: 'ring', x, y, r0, r1, color, life, max: life, width }); }
function bolt(x0, y0, x1, y1, color, life = 0.25) { particles.push({ kind: 'bolt', x: x0, y: y0, x1, y1, color, life, max: life, seed: Math.random() * 1000 }); }
function addText(x, y, text, color = '#fff', size = 16, life = 1.0, vy = -40) { texts.push({ x, y, text, color, size, life, max: life, vy }); }
function showBanner(text, color = '#fff', dur = 2.2, sub = '') { banner = { text, color, t: dur, max: dur, sub }; }
function shake(a) { cam.shake = Math.max(cam.shake, a); }
const CHOMP_WORDS = {
  pixel: ['CHOMP!', 'MUNCH!', 'GULP!', 'NOM!', 'CRUNCH!', 'SNAP!'],
  cartoon: ['SQUISH!', 'SPLORT!', 'BLORP!', 'GLOMP!', 'YOINK!', 'NOM NOM!'],
  ink: ['gulp.', 'snap.', 'crunch.', 'slurp.', 'chomp.'],
  '3d': ['YUM!', 'NOM!', 'POP!', 'MUNCH!', 'BOING!', 'GULP!'],
  film: ['AIEEE!', 'EEEK!', 'GULP!', 'CHOMP!', 'NOOO!', 'HELP!'],
  neon: ['BLIP!', 'ZAP!', 'NOM.EXE', 'BYTE!', '+1UP', 'GULP!'],
  sticker: ['YUM!', 'CRUNCH!', 'SQUISH!', 'NOM!', 'MMM!', 'GULP!'],
  real: ['ABSORBED', 'ACCRETED', 'CONSUMED', 'IMPACT'],
};
const REAL_NAMES = {
  'n:glove': 'ASTRONAUT GLOVE', 'n:tool': 'PISTOL-GRIP TOOL', 'n:cubesat1': 'CUBESAT', 'n:icecube': 'ICECUBE CUBESAT', 'n:astronaut': 'ASTRONAUT (SAFE INSIDE)',
  'n:cloudsat': 'CLOUDSAT', 'n:swift': 'SWIFT OBSERVATORY', 'n:landsat7': 'LANDSAT 7', 'n:spitzer': 'SPITZER TELESCOPE', 'n:galileo': 'GALILEO', 'n:voyager': 'VOYAGER',
  'n:cassini': 'CASSINI-HUYGENS', 'n:dawn': 'DAWN', 'n:sdo': 'SOLAR DYNAMICS OBSERVATORY', 'n:aura': 'AURA', 'n:parker': 'PARKER SOLAR PROBE', 'n:hubble': 'HUBBLE',
  'n:chandra': 'CHANDRA X-RAY OBSERVATORY', 'n:deepimpact': 'DEEP IMPACT', 'n:shuttle': 'SPACE SHUTTLE', 'n:lem': 'APOLLO LUNAR MODULE', 'n:iss': 'INTERNATIONAL SPACE STATION',
  'n:skylab': 'SKYLAB', 'n:saturnv': 'SATURN V', 'n:bennu': 'ASTEROID BENNU', 'n:moon_rock_01': 'ASTEROID', 'n:moon_rock_03': 'ASTEROID', 'n:moon_rock_05': 'ASTEROID',
  'planet:phobos': 'PHOBOS', 'planet:deimos': 'DEIMOS', 'planet:moon': 'THE MOON', 'planet:io': 'IO', 'planet:europa': 'EUROPA', 'planet:ganymede': 'GANYMEDE',
  'planet:callisto': 'CALLISTO', 'planet:titan': 'TITAN', 'planet:enceladus': 'ENCELADUS', 'planet:pluto': 'PLUTO', 'planet:charon': 'CHARON', 'planet:mars': 'MARS',
  'planet:venus': 'VENUS', 'planet:earth': 'EARTH', 'planet:neptune': 'NEPTUNE', 'planet:uranus': 'URANUS', 'planet:jupiter': 'JUPITER', 'planet:saturn': 'SATURN', sun: 'THE SUN',
};
const MEAT = ['#c0392b', '#e74c3c', '#f1948a', '#922b21', '#fdebd0'];
const GOO = ['#7dff6a', '#b8ff3a', '#3aff9a', '#ffffff', '#ff7ad9'];
const INK = ['#1a1a20', '#3a3a48', '#5a6a80', '#c8d8e8'];
const METAL = ['#9aa0a8', '#5a6068', '#d8dce0', '#ffb030', '#3a3e44'];
const STONE = ['#a89880', '#7a6a58', '#c8b8a0', '#5a4a3a'];
const CONFETTI = ['#ff5ad8', '#5ac8ff', '#ffe066', '#7dff6a', '#ff8a3a', '#b46aff', '#ffffff'];
function chunkColors(c) {
  if (STYLE === '3d') return CONFETTI;
  if (STYLE === 'neon') return NEON.concat(['#ffffff']);
  if (STYLE === 'real') return c && c.model && c.model.startsWith('planet:') ? ['#c8a070', '#8a6a4a', '#ff9a4a', '#ffffff', '#5a4a3a'] : ['#e0e0e0', '#a8a8a8', '#ffcf80', '#ffffff', '#6a6a6a'];
  if (STYLE === 'sticker') return c && c.spKey === 'fruit' ? ['#ffffff', '#ffd27a', '#ff6a5a', '#c8f080'] : ['#ffffff', '#ffd27a', '#ff9a7a', '#8ad0ff', '#c8f080'];
  if (c && (c.sp.vehicle || c.sp.corpse === 'wreck')) return METAL;
  if (STYLE === 'film') return ['#1a1a1a', '#4a4a4a', '#8a8a8a', '#d8d8d8'];
  if (STYLE === 'cartoon') return GOO;
  if (STYLE === 'ink') return ['#c04040', '#e8e8f0', '#5a6a80'];
  return MEAT;
}

// ============================================================ eat / hurt rules
function canEat(c) { return player.active && !c.boss && !c.ally && c.mass <= player.mass * form().eat; }
function isBigger(c) { return player.active && !c.ally && !canEat(c); }
function canHurtByContact(c) {
  if (c.ally || !isBigger(c) || c.stun > 0) return false;
  if (c.boss) { const a = c.bdef.ai; return a === 'hunter' || a === 'hunger' || a === 'bouncer' || a === 'serpent' || (a === 'cat' && c.state === 'pounce') || (a === 'sun' && c.state === 'flare') || (a === 'kinglion' && c.state !== 'tele'); }
  const k = c.sp.contact || 'none';
  if (c.state === 'stampede') return true;
  if (k === 'always') return true;
  if (k === 'charge') return c.state === 'charge' || c.angry;
  if (k === 'dive') return c.state === 'dive';
  if (k === 'moving') return Math.abs(c.vx) > c.h * 1.0;
  if (k === 'ram') return c.state === 'ram';
  return false;
}
function dmgFrom(c, k = 1) { return clamp((8 + 10 * c.mass / player.mass) * k, 3, 38) * cycleMul(); }

function addCombo() {
  const p = player;
  p.combo = p.comboT > 0 ? p.combo + 1 : 1;
  p.comboT = 2.6;
  stats.bestCombo = Math.max(stats.bestCombo, p.combo);
  if (p.combo > 1) SFX.combo(p.combo);
  return p.combo;
}
function gain(m, pts, x, y, whole) {
  const p = player;
  p.mass += m * GROWTH;
  p.belly = Math.min(100, p.belly + clamp(34 * m / p.mass, 1.5, 50) * (p.frenzyT > 0 ? 2 : 1));
  if (pts) {
    const c = addCombo();
    const s = Math.round(pts * Math.min(c, 10) * cycle);
    p.score += s;
    addText(x, y, '+' + s, c > 4 ? THEME.accent || '#ffd23a' : '#fff', 14 + Math.min(c, 10), 0.9);
  }
  if (whole) stats.eaten++;
}
function ptsOf(c) { return c.sp.pts * Math.sqrt(c.mass) * (c.gold ? 5 : 1); }
function eatWhole(c) {
  c.alive = false;
  const cx = c.x, cy = c.y - c.h * 0.5;
  gain(c.mass, ptsOf(c) + 5, cx, cy - c.h * 0.4, true);
  burst(cx, cy, 10 + Math.min(20, c.mass * 3), c.gold ? ['#ffd23a', '#fff6a8', '#ffb000'] : chunkColors(c), player.h * 4, player.h * 0.09, { up: swim() ? 0 : player.h * 2 });
  if (STYLE === 'real' && REAL_NAMES[c.model]) addText(cx, cy - c.h, (c.mass > player.mass * 0.4 ? 'CONSUMED: ' : '') + REAL_NAMES[c.model], c.gold ? '#ffd23a' : '#e8eef8', 10, 1.1, -40);
  else addText(cx, cy - c.h, pick(CHOMP_WORDS[STYLE]), c.gold ? '#ffd23a' : '#ffefe0', 12, 0.7, -60);
  if (c.sp.vehicle) SFX.metal(); else if (STYLE === 'cartoon' || STYLE === '3d' || STYLE === 'sticker') SFX.squish(); else SFX.chomp(clamp(1.6 - player.form * 0.25, 0.6, 1.6));
  if (c.gold) SFX.gold();
  freeze = Math.max(freeze, 0.035);
  shake(3);
  player.eatT = 0.25;
  if (c.sp.eggs && Math.random() < 0.35) {
    const side = sign(rand(-1, 1));
    const mom = makeCreature(Math.random() < 0.55 ? 'trike' : 'trex', Math.max(player.mass * 1.5 / form().eat, 3), player.x + side * viewW() * 0.75, { angry: true });
    mom.face = -side;
    showBanner("MAMA'S MAD!", '#ff6b4a', 1.8);
    SFX.enemyRoar();
  }
}
function killCreature(c, burnt) {
  c.alive = false;
  const scale = c.key ? c.h / SPRITES[c.key].h : 1;
  const mode = c.sp.corpse;
  if (mode && (c.key || c.model || c.vec || c.pd) && !(STYLE === 'real' && c.mass > (player ? player.mass * 2 : 99)) && !(c.boss && c.bdef.ai === 'kraken')) {
    let key = mode, w = c.w, h = c.h;
    if (mode === 'flip' || mode === 'wreck' || mode === 'squash' || mode === 'model' || mode === 'vec' || mode === 'pd') key = c.key;
    else { const S = SPRITES[mode]; w = S.w * scale; h = S.h * scale; }
    corpses.push({
      key, mode, x: c.x, y: c.swim ? c.y : houseMode ? floorAt(c.x, c.y) : groundY(c.x), pd: c.pd, red: c.sp.red, face: c.face, faceL: c.faceL, w, h, tint: c.tint, hitF: c.sp.hitF || 0,
      meat: c.mass, maxMeat: c.mass, life: 40, burnt, pts: c.sp.pts * Math.sqrt(c.mass) * (c.boss ? 3 : 1), yo: c.flying ? c.y - (houseMode ? floorAt(c.x, c.y) : groundY(c.x)) : 0, seed: c.seed,
      metal: mode === 'wreck', vy: 0, sinks: c.swim && water(), model: c.model, vec: c.vec, col: c.sp.col,
    });
  }
  burst(c.x, c.y - c.h * 0.5, 18, burnt ? ['#333', '#5a3b24', '#ff7a1a'] : chunkColors(c), c.h * 4, c.h * 0.08, { up: swim() ? 0 : c.h * 2 });
  if (mode === 'wreck') { SFX.boom(); burst(c.x, c.y - c.h * 0.5, 10, ['#ff7a1a', '#ffd23a'], c.h * 3, c.h * 0.12, { grav: 0.2 }); }
  if (c.boss) bossDefeated(c);
}
function hurtPlayer(dmg, cause, fromX) {
  const p = player;
  if (tut) return;
  if (p.invuln > 0 || p.dead || !p.active || p.rollT > 0) return;
  const big = dmg >= 9;
  p.belly -= dmg;
  if (stats) { stats.dmg = (stats.dmg || 0) + dmg; stats.hits = (stats.hits || 0) + 1; (stats.by = stats.by || {})[cause] = ((stats.by || {})[cause] || 0) + Math.round(dmg); }
  p.hurtFlash = big ? 0.3 : 0.15;
  if (big) {
    p.invuln = 1.1;
    p.vx = sign(p.x - fromX) * p.h * 6; p.vy = roam() ? 0 : swim() ? -p.h * 3 : -p.h * 9; p.onGround = false; p.pounce = 0; p.stomping = false; p.climb = 0;
    if (roam()) p.vz = p.h * 7;
    if (spaceMode) { const ux = Math.cos(p.upA), uy = Math.sin(p.upA); p.vx = ux * p.h * 6 + sign(p.x - fromX) * p.h * 3; p.vy = uy * p.h * 6; }
    p.combo = 0; p.comboT = 0;
    shake(12); freeze = Math.max(freeze, 0.08); flash = 0.25; flashColor = '#ff2a2a';
  } else { p.invuln = 0.3; shake(3); }
  SFX.hurt(big);
  burst(p.x, p.y - p.h * 0.5, big ? 12 : 4, ['#fff', '#ff4a4a'], p.h * 5, p.h * 0.08);
  addText(p.x, p.y - p.h * 1.2, '-' + Math.round(dmg), '#ff5a5a', big ? 16 : 11, 0.9);
  if (p.belly <= 0) die(cause);
}
function die(cause) {
  const p = player;
  p.belly = 0; p.dead = true; p.deathT = realT; deathCause = cause;
  state = 'dying'; deadT = 0; slowmo = 1.5;
  SFX.die(); SFX.duck(0.3); shake(16);
  stats.time = gameT;
  saveBest();
}
function saveBest() { if (player.score > best) { best = player.score; try { localStorage.setItem('chompo_best', String(best)); } catch (e) { /* ignore */ } } }

function evolve() {
  const p = player;
  const prev = form();
  p.form++;
  const f = form();
  p.belly = 100;
  slowmo = 1.2; flash = 0.6; flashColor = '#fff';
  shake(18);
  SFX.evolve(); setTimeout(() => SFX.roar(0.8 - p.form * 0.1), 250);
  const col = THEME.accent || '#ffd23a';
  for (let i = 0; i < 3; i++) ring(p.x, p.y - p.h * 0.5, p.h * 0.5, p.h * (6 + i * 3), i === 0 ? '#fff' : col, 0.7 + i * 0.25, 6);
  burst(p.x, p.y - p.h * 0.5, 60, ['#fff', col, '#ff9a3a'], p.h * 9, p.h * 0.12, { grav: 0.2, life: 1.2 });
  showBanner('EVOLVED!', col, 3, 'you are now a ' + f.name);
  const fresh = f.abilities.findIndex((a, i) => prev.abilities[i] !== a);
  if (fresh >= 0) hint = { text: 'NEW: ' + abilityHint(f.abilities[fresh], fresh), t: 7 };
  else if (f.smash && !prev.smash) hint = { text: 'NEW: SMASH [S in mid-air] — slam the ground (4s cooldown)', t: 7 };
  else hint = { text: 'you can now eat things up to ' + Math.round(f.eat * 100) + '% of your size', t: 5 };
  if (f.final) { bossT = 6; setTimeout(() => { if (player === p) hint = { text: 'FINAL FORM — something enormous has noticed you...', t: 5 }; }, 6500); }
  p.roarAnim = 0.8;
  for (const c of creatures) if (Math.abs(c.x - p.x) < p.h * 8 && isBigger(c) && !c.boss) { c.stun = 2; c.vx = sign(c.x - p.x) * c.h * 3; }
}

// ============================================================ player abilities
// a point in the player's own frame (forward along the planet's surface, up away from it)
function localPt(fwd, up) { const p = player, ux = Math.cos(p.upA), uy = Math.sin(p.upA); return [p.x - uy * fwd * p.face + ux * up, p.y + ux * fwd * p.face + uy * up]; }
function mouth() { const p = player; if (orbitMode) return [p.x + p.hx * p.w * 0.5, p.y + p.hy * p.h * 0.5]; if (spaceMode) return localPt(p.w * 0.42, p.h * 0.1); if (roam()) return [p.x + p.hx * p.w * 0.45, p.y - p.h * 0.5 + p.hy * p.h * 0.3]; return [p.x + p.face * p.w * 0.42, p.y - p.h * 0.6]; }
function victims(fn) { for (const c of creatures) if (c.alive && !c.ally) fn(c); }
function zapKill(c, why) { // kill or damage from an ability
  if (canEat(c)) { killCreature(c, why === 'burn'); stats.kills++; gain(0, ptsOf(c) * 0.6, c.x, c.y - c.h); return true; }
  return false;
}
function useAbility(slot) {
  const p = player, key = form().abilities[slot];
  if (!key) return;
  const A = ABILITIES[key];
  if (p.cds[slot] > 0) { addText(p.x, p.y - p.h * 1.3, A.name + ' ' + p.cds[slot].toFixed(1) + 's', '#aaa', 10, 0.5, -20); return; }
  p.cds[slot] = A.cd; p.roarAnim = 0.6;
  const h = p.h;
  switch (A.type) {
    case 'roar': {
      SFX.roar(1 - p.form * 0.2); shake(10);
      const R = h * 8;
      for (let i = 0; i < 3; i++) setTimeout(() => ring(p.x + p.face * p.w * 0.35, p.y - p.h * 0.7, p.h * 0.4, R, '#ffffffaa', 0.6, 5), i * 120);
      victims((c) => {
        const d = Math.hypot(c.x - p.x, (c.y - c.h / 2) - (p.y - p.h / 2));
        if (d > R) return;
        if (c.boss) { if (!c.bdef.noStun) { c.stun = 1.1; c.flash = 0.1; } return; }
        if (c.flying) { c.stun = 3; c.flying = false; c.vy = 0; c.dropped = true; }
        else if (isBigger(c)) { c.stun = 2.6; c.angry = false; c.state = 'idle'; c.vx = sign(c.x - p.x) * c.h * 2; }
        else c.fleeT = 3;
        c.flash = 0.1;
      });
      for (const pr of projectiles) if (pr.team === 'enemy' && Math.hypot(pr.x - p.x, pr.y - p.y) < R) pr.dead = true;
      break;
    }
    case 'spit': {
      const [ox, oy] = mouth();
      for (let i = 0; i < A.n; i++) {
        const base = roam() ? Math.atan2(p.hy, p.hx) : p.face > 0 ? 0 : Math.PI;
        const a = base + (A.n > 1 ? (i / (A.n - 1) - 0.5) * A.spread * 2 : 0) * p.face - (A.shot === 'goo' && !swim() ? 0.25 * p.face : 0);
        const s = h * (A.shot === 'web' ? 15 : 11);
        const arc = (A.shot === 'goo' || A.shot === 'teeth') && !swim();
        projectiles.push({ x: ox, y: oy, vx: Math.cos(a) * s + p.vx * 0.4, vy: Math.sin(a) * s - (arc ? h * 3 : 0), g: arc ? h * 14 : 0, kind: A.shot, r: h * (A.shot === 'web' ? 0.35 : 0.22), life: 1.6, max: 1.6, team: 'player', dmg: p.mass * A.dmg });
      }
      if (A.shot === 'web' || A.shot === 'pea') SFX.thwip(); else SFX.spit();
      break;
    }
    case 'vacuum': p.vacT = A.dur; SFX.gulp(); break;
    case 'nova': {
      const cx = p.x, cy = p.y - h * 0.5;
      for (let i = 0; i < A.n; i++) {
        const a = (i / A.n) * Math.PI * 2;
        projectiles.push({ x: cx, y: cy, vx: Math.cos(a) * h * 13, vy: Math.sin(a) * h * 13, g: 0, kind: A.shot, r: h * 0.28, life: 0.9, max: 0.9, team: 'player', dmg: p.mass * A.dmg, pierce: true });
      }
      SFX.thwip(); shake(6);
      ring(cx, cy, h * 0.3, h * 3, THEME.accent, 0.4, 5);
      break;
    }
    case 'zap': {
      const R = A.radius * h, cx = p.x, cy = p.y - h * 0.5;
      SFX.zap(); shake(7);
      ring(cx, cy, h * 0.3, R, '#bff8ff', 0.35, 6);
      flash = 0.12; flashColor = '#bff8ff';
      victims((c) => {
        const d = Math.hypot(c.x - cx, (c.y - c.h * 0.5) - cy);
        if (d > R + c.w * 0.3) return;
        bolt(cx, cy, c.x, c.y - c.h * 0.5, '#d8fbff');
        if (!zapKill(c, 'burn')) { damageCreature(c, p.mass * A.dmg, true); if (!c.boss) c.stun = Math.max(c.stun, 1.3); }
      });
      break;
    }
    case 'aura': p.auraT = A.dur; p.auraR = A.radius; p.auraDps = A.dps; SFX.zap(); break;
    case 'frenzy': p.frenzyT = A.dur; SFX.roar(1.5); flash = 0.3; flashColor = '#ff2020'; shake(8); break;
    case 'roll': p.rollT = A.dur; p.invuln = Math.max(p.invuln, 0.2); SFX.whoosh(); break;
    case 'quake': {
      const R = viewW() * 0.65;
      SFX.stomp(); SFX.boom(); shake(24); freeze = Math.max(freeze, 0.08);
      flash = 0.35; flashColor = '#fff';
      for (let i = 0; i < 4; i++) ring(p.x, p.y, h * 0.5, R * (0.4 + i * 0.2), '#e8d2a0', 0.5 + i * 0.12, 8);
      victims((c) => {
        const d = roam() ? Math.hypot(c.x - p.x, c.y - p.y) : Math.abs(c.x - p.x);
        if (d > R) return;
        if (c.flying) { if (!c.boss) { c.stun = 3; c.flying = false; } return; }
        if (zapKill(c)) return;
        damageCreature(c, p.mass * 1.1 * (1 - 0.5 * d / R));
        if (c.alive && !c.boss) { c.stun = 2.2; if (roam()) c.vz = c.h * 9; else { c.vy = -c.h * 9; c.onGround = false; } }
      });
      break;
    }
    case 'blink': {
      const x0 = p.x, y0 = p.y - h * 0.5;
      let dx = p.face * A.dist * h, dy = 0;
      if (spaceMode) { // screen-relative direction, turned into world space
        let sx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), sy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
        if (!sx && !sy) sx = p.face;
        const L = Math.hypot(sx, sy), c = Math.cos(cam.rot), s = Math.sin(cam.rot);
        dx = (c * sx + s * sy) / L * A.dist * h; dy = (-s * sx + c * sy) / L * A.dist * h;
      } else if (swim()) { const ax = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), ay = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0); if (ax || ay) { const L = Math.hypot(ax, ay); dx = ax / L * A.dist * h; dy = ay / L * A.dist * h; } }
      const x1 = x0 + dx, y1 = y0 + dy;
      victims((c) => {
        if (segDist(c.x, c.y - c.h * 0.5, x0, y0, x1, y1) > Math.max(c.h * 0.5, h * 0.6)) return;
        if (canEat(c)) eatWhole(c);
        else { damageCreature(c, p.mass * 1.6); if (!c.boss) c.stun = Math.max(c.stun, 1.2); }
      });
      for (let i = 0; i <= 10; i++) burst(lerp(x0, x1, i / 10), lerp(y0, y1, i / 10), 3, ['#c8a8ff', '#fff'], h * 1.5, h * 0.18, { grav: -0.05, life: 0.6, kind: 'sq' });
      p.x = x1; p.y += dy;
      if (!swim()) p.y = Math.min(p.y, groundY(p.x));
      p.invuln = Math.max(p.invuln, 0.35);
      ring(p.x, p.y - h * 0.5, h * 0.2, h * 2.5, '#c8a8ff', 0.35, 5);
      SFX.whoosh();
      break;
    }
    case 'summon': {
      for (let i = 0; i < A.n; i++) {
        const a = makeCreature('ally', p.mass * 0.55, p.x + rand(-1, 1) * p.w, { ally: true, life: A.dur });
        a.y = p.y; a.vy = -a.h * 6; a.onGround = false;
        burst(a.x, a.y - a.h * 0.5, 12, ['#000', '#7affea'], a.h * 3, a.h * 0.15, { kind: 'smoke', grav: -0.1 });
      }
      SFX.enemyRoar(); addText(p.x, p.y - h * 1.4, 'THE PACK ANSWERS', '#7affea', 14, 1.2);
      break;
    }
    case 'cane': { // grandpa's cane: a big swing in front
      const R = h * 1.8, cx = p.x + p.face * p.w * 0.3, cy = p.y - h * 0.5;
      p.caneT = 0.32; SFX.bonk(); shake(5);
      for (let k = 0; k < 6; k++) { const a = -Math.PI * 0.85 + k * 0.32; particles.push({ kind: 'suck', x: cx + Math.cos(a) * R * p.face, y: cy + Math.sin(a) * R, tx: cx, ty: cy, life: 0.2, max: 0.2, color: '#ffffff', size: h * 0.1 }); }
      victims((c) => {
        const dx = c.x - cx, dy = (c.y - c.h * 0.5) - cy;
        if (dx * p.face < -h * 0.3 || Math.hypot(dx, dy) > R + c.w * 0.35) return;
        addText(c.x, c.y - c.h, pick(['BONK!', 'WHACK!', 'THWACK!', 'KIDS THESE DAYS!']), '#ffffff', 14, 0.8, -50);
        if (zapKill(c)) return;
        damageCreature(c, p.mass * 1.3);
        if (c.alive && !c.boss) { c.stun = 1.6; c.vx = p.face * c.h * 9; c.vy = -c.h * 8; c.onGround = false; c.flying = false; c.dropped = true; }
      });
      for (const pr of projectiles) if (pr.team === 'enemy' && (pr.x - cx) * p.face > -h * 0.3 && Math.hypot(pr.x - cx, pr.y - cy) < R) { pr.team = 'player'; pr.vx = -pr.vx * 1.3; pr.vy = -Math.abs(pr.vy) * 0.5; pr.dmg = p.mass * 0.8; pr.life = 2; }
      break;
    }
    case 'cyclone': p.cycT = A.dur; p.cycR = A.radius; SFX.whoosh(); SFX.vortex(); shake(6); break;
    case 'beam': {
      const [ox, oy] = mouth();
      let best = null, bd = A.len * h;
      victims((c) => {
        const dx = c.x - ox, dy = (c.y - c.h * 0.5) - oy;
        if (orbitMode ? dx * p.hx + dy * p.hy < 0 : dx * p.face < -h * 0.3) return;
        const d = Math.hypot(dx, dy);
        if (d < bd) { bd = d; best = c; }
      });
      const ang = best ? Math.atan2((best.y - best.h * 0.5) - oy, best.x - ox) : orbitMode ? Math.atan2(p.hy, p.hx) : (p.face > 0 ? 0 : Math.PI);
      p.beam = { t: A.dur, max: A.dur, len: A.len * h, w: A.width * h, dps: A.dps, ang, tgt: best, atomic: key === 'atomic', x0: ox, y0: oy, x1: ox, y1: oy };
      SFX.beam(); shake(5);
      break;
    }
    case 'leap': {
      p.climb = 0; p.pounce = 0; p.stomping = false;
      p.vy = -Math.sqrt(2 * G * h * h * 9); p.onGround = false; p.leaping = true;
      p.invuln = Math.max(p.invuln, 0.4);
      SFX.boom(); shake(8);
      burst(p.x, p.y, 26, ['#ffffff', '#bbbbbb', '#777777'], h * 4, h * 0.25, { kind: 'smoke', grav: -0.05, angle: Math.PI / 2, spread: 1.4, life: 1.2 });
      break;
    }
    case 'vortex': {
      const [vx0, vy0] = A.self ? [p.x, p.y] : spaceMode ? localPt(h * 5, h * 1.5) : [p.x + p.face * h * 5.5, p.y - h * 2];
      p.voidFx = { x: vx0, y: vy0, t: A.dur, max: A.dur, r: h * 7 };
      SFX.vortex(); shake(10);
      break;
    }
  }
}
function updatePowers(dt) {
  const p = player, h = p.h;
  for (let i = 0; i < 3; i++) p.cds[i] -= dt;
  p.frenzyT -= dt; p.rollT -= dt;
  if (p.vacT > 0) {
    p.vacT -= dt;
    const [mx, my] = mouth(), R = h * 7.5;
    victims((c) => {
      const dx = c.x - mx, dy = (c.y - c.h * 0.5) - my, d = Math.hypot(dx, dy);
      const hx = roam() || orbitMode ? p.hx : p.face, hy = roam() || orbitMode ? p.hy : 0;
      if (d > R || dx * hx + dy * hy < 0 || Math.abs(dy * hx - dx * hy) > h * 3.5) return;
      if (canEat(c)) {
        const k = Math.min(1, dt * (5 + 6 * (1 - d / R)));
        c.x = lerp(c.x, mx, k); c.y = lerp(c.y, my + c.h * 0.5, k); c.stun = Math.max(c.stun, 0.2); c.onGround = false;
        if (d < p.w * 0.45 + c.w * 0.3) eatWhole(c);
      } else if (!c.boss) { c.x -= sign(dx) * h * 2 * dt; c.stun = Math.max(c.stun, 0.15); }
    });
    if (Math.random() < 0.9) { const a = (roam() || orbitMode ? Math.atan2(p.hy, p.hx) : p.face > 0 ? 0 : Math.PI) + rand(-0.5, 0.5), d = R * rand(0.4, 1); particles.push({ kind: 'suck', x: mx + Math.cos(a) * d, y: my + Math.sin(a) * d, tx: mx, ty: my, life: 0.35, max: 0.35, color: '#ffffff', size: h * 0.08 }); }
  }
  if (p.auraT > 0) {
    p.auraT -= dt; p.auraTick -= dt;
    if (p.auraTick <= 0) {
      p.auraTick = 0.2;
      const R = p.auraR * h, cx = p.x, cy = p.y - h * 0.5;
      victims((c) => {
        const d = Math.hypot(c.x - cx, (c.y - c.h * 0.5) - cy);
        if (d > R + c.w * 0.3) return;
        if (Math.random() < 0.6) bolt(cx + rand(-1, 1) * h * 0.3, cy, c.x, c.y - c.h * 0.5, '#bff8ff', 0.15);
        if (!zapKill(c, 'burn')) damageCreature(c, p.mass * p.auraDps * 0.2, true);
      });
      SFX.zap();
    }
  }
  if (p.rollT > 0) {
    const pr = rectOfPlayer(p);
    victims((c) => {
      if (!overlap(pr, rectOf(c))) return;
      if (canEat(c)) eatWhole(c);
      else { damageCreature(c, p.mass * 3.2 * dt, true); if (!c.boss) { c.vx = p.face * c.h * 4; c.stun = Math.max(c.stun, 0.5); } }
    });
    if (Math.random() < 0.5) burst(p.x, p.y - h * 0.4, 2, chunkColors(), h * 2, h * 0.1);
  }
  if (p.cycT > 0) { // CYCLONE: everything spirals in; small things get eaten
    p.cycT -= dt;
    const R = p.cycR * h, cx = p.x, cy = p.y - h * 0.5;
    victims((c) => {
      const dx = cx - c.x, dy = cy - (c.y - c.h * 0.5), d = Math.hypot(dx, dy);
      if (d > R) return;
      if (c.boss) { damageCreature(c, p.mass * 1.2 * dt, true); return; }
      if (canEat(c)) {
        const k = Math.min(1, dt * (2 + 6 * (1 - d / R)));
        c.x += dx * k - dy / (d || 1) * h * 6 * dt; c.y += dy * k + dx / (d || 1) * h * 6 * dt; c.stun = Math.max(c.stun, 0.3);
        if (d < p.w * 0.6 + c.w * 0.3) eatWhole(c);
      } else { damageCreature(c, p.mass * 1.6 * dt, true); c.stun = Math.max(c.stun, 0.4); c.x += dx * dt * 0.4; c.y += dy * dt * 0.4; }
    });
    for (let i = 0; i < 3; i++) { const a = rand(Math.PI * 2), d = R * rand(0.5, 1); particles.push({ kind: 'suck', x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, tx: cx, ty: cy, life: 0.5, max: 0.5, color: pick(CONFETTI), size: h * 0.1 }); }
    if (Math.random() < dt * 4) ring(cx, cy, h * 0.4, R, '#ffffffaa', 0.4, 4);
  }
  if (p.beam) { // RAY GUN / ATOMIC BREATH: a beam that tracks its target
    const b = p.beam;
    b.t -= dt; p.roarAnim = Math.max(p.roarAnim, 0.12);
    const [ox, oy] = mouth();
    if (b.tgt && b.tgt.alive) {
      let da = Math.atan2((b.tgt.y - b.tgt.h * 0.5) - oy, b.tgt.x - ox) - b.ang;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      b.ang += clamp(da, -dt * 2.5, dt * 2.5);
    }
    const ex = ox + Math.cos(b.ang) * b.len, ey = oy + Math.sin(b.ang) * b.len;
    b.x0 = ox; b.y0 = oy; b.x1 = ex; b.y1 = ey;
    victims((c) => {
      if (segDist(c.x, c.y - c.h * 0.5, ox, oy, ex, ey) > b.w + c.h * 0.35) return;
      if (!zapKill(c, 'burn')) { damageCreature(c, p.mass * b.dps * dt, true); c.stun = Math.max(c.stun, 0.15); }
    });
    for (const pr of projectiles) if (pr.team === 'enemy' && segDist(pr.x, pr.y, ox, oy, ex, ey) < b.w * 1.5) pr.dead = true;
    if (Math.random() < 0.8) burst(ex, ey, 2, ['#ffffff', '#dddddd', '#999999'], h * 3, h * 0.12, { grav: 0.2 });
    if (b.atomic && Math.random() < 0.5) burst(lerp(ox, ex, Math.random()), lerp(oy, ey, Math.random()), 1, ['#ffffff', '#cccccc'], h, b.w * 0.6, { kind: 'smoke', grav: -0.1, life: 0.6 });
    if (b.t <= 0) p.beam = null;
  }
  if (p.voidFx) {
    const v = p.voidFx;
    v.t -= dt;
    victims((c) => {
      const dx = v.x - c.x, dy = v.y - (c.y - c.h * 0.5), d = Math.hypot(dx, dy);
      if (d > v.r) return;
      if (c.boss) { damageCreature(c, p.mass * 1.4 * dt, true); return; }
      const k = Math.min(1, dt * (1.5 + 5 * (1 - d / v.r)));
      c.x += dx * k; c.y += dy * k; c.stun = Math.max(c.stun, 0.3); c.onGround = false; c.vy = 0;
      if (d < v.r * 0.16 && canEat(c)) { c.alive = false; gain(c.mass, ptsOf(c), v.x, v.y - h); stats.eaten++; burst(v.x, v.y, 8, ['#000', '#7a3aff', '#7affea'], h * 2, h * 0.12, { kind: 'smoke', grav: 0 }); SFX.crunch(); }
      else if (d < v.r * 0.3) damageCreature(c, p.mass * 2 * dt, true);
    });
    for (let i = 0; i < 3; i++) { const a = rand(Math.PI * 2), d = v.r * rand(0.5, 1.1); particles.push({ kind: 'suck', x: v.x + Math.cos(a) * d, y: v.y + Math.sin(a) * d, tx: v.x, ty: v.y, life: 0.6, max: 0.6, color: pick(['#7a3aff', '#7affea', '#000']), size: h * 0.12 }); }
    if (v.t <= 0) { ring(v.x, v.y, h * 0.2, v.r, '#7a3aff', 0.5, 8); p.voidFx = null; shake(8); }
  }
}
function stompImpact() {
  const p = player;
  p.stomping = false; p.smashCD = CD.smash;
  const R = p.h * (form().final ? 6 : 4.5);
  SFX.stomp(); shake(16); freeze = Math.max(freeze, 0.06);
  ring(p.x, p.y, p.h * 0.3, R, '#e8d2a0', 0.5, 7);
  burst(p.x, p.y, 40, STYLE === 'cartoon' ? GOO : STYLE === 'film' ? ['#9a9a9a', '#5a5a5a', '#2a2a2a'] : ['#8a6a48', '#b8946a', '#5a3b24', '#d8c8a0'], p.h * 7, p.h * 0.12, { angle: -Math.PI / 2, spread: 1.3, up: p.h * 2 });
  victims((c) => {
    if (c.flying || (c.swim && !spaceMode)) return;
    const d = spaceMode ? Math.hypot(c.x - p.x, c.y - p.y) : Math.abs(c.x - p.x);
    if (d > R + c.w * 0.4 || (!spaceMode && Math.abs(c.y - p.y) > p.h * 2.5)) return;
    if (canEat(c) && !c.sp.eggs) { killCreature(c); stats.kills++; gain(0, ptsOf(c) * 0.5, c.x, c.y - c.h); }
    else {
      damageCreature(c, p.mass * 1.4 * (1 - 0.5 * d / R));
      if (c.alive && !c.boss) { c.stun = 1.6; if (spaceMode) { c.vx = (c.x - p.x) / (d || 1) * c.h * 7; c.vy = (c.y - p.y) / (d || 1) * c.h * 7; } else { c.vy = -c.h * 8; c.onGround = false; c.vx = sign(c.x - p.x) * c.h * 2; } }
    }
  });
}
function damageCreature(c, dmg, quiet) {
  if (c.ally) return;
  if (c.boss && c.bdef.ai === 'kraken' && c.state !== 'open') dmg *= 0.25;
  if (c.boss && quiet) dmg *= 0.3; // bosses shrug off most power damage — bites are what count
  c.hp -= dmg; c.flash = 0.12;
  c.angry = true;
  if (c.hp <= 0 && c.alive) {
    killCreature(c);
    stats.kills++;
    gain(0, ptsOf(c) * (c.boss ? 6 : 1), c.x, c.y - c.h);
    freeze = Math.max(freeze, 0.09); shake(10);
    if (!c.boss) addText(c.x, c.y - c.h * 1.3, STYLE === 'film' ? 'THE END!' : 'TAKEDOWN!', THEME.accent, 16, 1.3, -30);
  }
}

// ============================================================ bosses & world flow
function spawnBoss() {
  const p = player, d = BOSSES[ERA.boss];
  const side = sign(rand(-1, 1));
  const m = Math.max(p.mass * d.mass, d.min) * cycleMul();
  const c = makeCreature(d.sp, m, p.x + side * viewW() * 0.8, { boss: true, bdef: d, angry: true, hMul: d.hMul, key: d.key, tint: d.tint });
  c.face = -side;
  c.hp = c.maxHp = p.mass * 5.5 * d.hp * cycleMul();
  if (d.ai === 'kraken') { c.swim = false; c.w = c.h * 2.4; c.y = groundY(c.x); c.state = 'closed'; c.eyeT = 2; c.x = p.x + side * viewW() * 0.45; }
  boss = c;
  SFX.setBoss(true);
  showBanner(d.name, '#ff3b3b', 3.2, d.sub);
  SFX.enemyRoar(); SFX.alarm();
  shake(10);
}
function bossDefeated(c) {
  stats.bosses++;
  boss = null;
  SFX.setBoss(false);
  player.score += 2500 * (eraIdx + 1) * cycle;
  slowmo = 1.6; flash = 0.8; flashColor = '#fff';
  for (let i = 0; i < 4; i++) ring(c.x, c.y - c.h * 0.5, c.h * 0.3, c.h * (3 + i * 2), i % 2 ? THEME.accent : '#fff', 0.8 + i * 0.2, 8);
  burst(c.x, c.y - c.h * 0.5, 80, [THEME.accent, '#fff', '#ff7a1a'], c.h * 6, c.h * 0.08, { grav: 0.3, life: 1.4 });
  showBanner('WORLD DEVOURED!', THEME.accent, 3.5, '+' + 2500 * (eraIdx + 1) * cycle + '   ·   feast, then the next universe calls...');
  SFX.victory();
  clearT = 5.5;
  for (const cr of creatures) if (isBigger(cr)) cr.stun = 4;
}
function startWarp() {
  state = 'warp'; warpT = 0; warped = false; warpFirst = false;
  SFX.warp();
  saveBest();
}
function updateWarp(dt) {
  warpT += dt;
  if (!warped && warpT > 1.0) {
    warped = true;
    if (eraIdx >= ERAS.length - 1) { state = 'victory'; victoryT = 0; stats.time = gameT; saveBest(); SFX.victory(); return; }
    loadEra(eraIdx + 1, true);
    state = 'warp';
  }
  if (warpT > 4.2) state = 'play';
}
function summon(spKey, n, c, massMul = 0.45) {
  for (let i = 0; i < n; i++) {
    const m = Math.max(0.6, player.mass * rand(massMul * 0.6, massMul * 1.2));
    const s = makeCreature(spKey, m, c.x + rand(-1, 1) * c.w * 0.6, { angry: true });
    if (s.swim) s.y = c.y - c.h * 0.5;
    else if (!s.flying) { s.vy = -s.h * 5; s.onGround = false; } else s.y = c.y - c.h;
  }
}
const MINIONS = { goomongous: ['goober', 'cubey', 'pinky'], kraken: ['eelE', 'jellyE'], bigtony: ['mobster', 'soldier'], kinglion: ['lion', 'tigerE'], sol: ['asteroid', 'impactor'], serpent: ['tri', 'diamond', 'sshark'] };
function bossAI(c, dt, P, dx, adx, dirP, vw) {
  const d = c.bdef, h = c.h, pspd = form().speed * P.h;
  c.cd2 -= dt; c.cd3 -= dt; c.cd4 -= dt;
  switch (d.ai) {
    case 'chief': {
      if (c.state === 'atk') {
        c.vx = 0;
        if (c.t <= 0) {
          c.state = 'idle'; c.cd = 1.3; shake(8);
          ring(c.x + c.face * c.w * 0.5, c.y - h * 0.3, h * 0.1, h * 0.9, '#fff', 0.3, 4);
          if (adx < c.w * 0.75 + P.w * 0.6 + h * 0.3 && Math.abs(P.y - c.y) < h) hurtPlayer(dmgFrom(c, 1), 'CRUSHED BY ' + d.name, c.x);
        }
      } else if (c.state === 'throw') {
        c.vx = 0;
        if (c.t <= 0) { fireAt(c, d.shot || 'boulder'); fireAt(c, d.shot || 'boulder', 0.7); c.state = 'idle'; }
      } else if (c.state === 'gun') { // tommy-gun spray
        c.vx = 0; c.face = dirP; c.burstT -= dt; c.actT = c.actMax = 0.3;
        if (c.burstT <= 0 && c.burstN > 0) { fireAt(c, 'bullet', rand(0, 0.5)); c.burstN--; c.burstT = 0.13; }
        if (c.burstN <= 0) c.state = 'idle';
      } else {
        turnToward(c, dirP, dt, 0.3);
        if (adx > c.w * 0.55 + P.w * 0.3 + h * 0.3) c.vx = approach(c.vx, c.turnT > 0 ? 0 : c.face * pspd * 0.6, pspd * 2 * dt);
        else { c.vx = 0; if (c.cd <= 0) { c.state = 'atk'; c.t = 0.55; c.actT = c.actMax = 0.55; } }
        if (c.cd2 <= 0 && adx > c.w) { c.state = 'throw'; c.t = 0.6; c.actT = c.actMax = 0.6; c.cd2 = rand(3, 4.5); }
        if (c.cd3 <= 0) { summon(pick(MINIONS[ERA.boss]), 3, c); c.cd3 = rand(9, 12); addText(c.x, c.y - h * 1.1, d.call || 'RISE!', '#ffb070', 16); }
        if (d.gun && c.cd4 <= 0 && adx < vw * 0.75) { c.state = 'gun'; c.burstN = 7; c.burstT = 0.4; c.cd4 = rand(5, 7); addText(c.x, c.y - h * 1.15, 'SAY HELLO TO MY TOMMY GUN!', '#ffffff', 12, 1.4, -20); }
      }
      return true;
    }
    case 'bouncer': {
      if (c.state === 'air' && c.onGround) {
        c.state = 'idle'; shake(16); SFX.stomp(); SFX.squish();
        ring(c.x, c.y, h * 0.3, h * 2.6, '#7dff6a', 0.45, 8);
        burst(c.x, c.y, 30, GOO, h * 4, h * 0.1, { angle: -Math.PI / 2, spread: 1.3 });
        if (P.onGround && adx < c.w * 0.5 + h * 2.2) hurtPlayer(dmgFrom(c, 0.6), 'SQUASHED BY ' + d.name, c.x);
        for (let i = -1; i <= 1; i += 2) projectiles.push({ x: c.x, y: c.y - h * 0.3, vx: i * P.h * 9, vy: -P.h * 9, g: P.h * 18, kind: 'goo', r: h * 0.12, life: 2, max: 2, team: 'enemy', dmg: dmgFrom(c, 0.35), cause: 'GOO\'D' });
      }
      if (c.onGround && c.state !== 'air') {
        c.vx *= Math.pow(0.02, dt);
        turnToward(c, dirP, dt, 0.2);
        if (c.cd2 <= 0) { c.vy = -h * rand(7.5, 9.5); c.vx = clamp(dx * 1.3, -pspd * 1.2, pspd * 1.2); c.onGround = false; c.state = 'air'; c.cd2 = rand(1.8, 2.8); SFX.boing(); }
        if (c.cd3 <= 0) { for (let i = 0; i < 3; i++) fireAt(c, 'goo', 0.2 + i * 0.25); c.cd3 = rand(3.5, 5); c.actT = c.actMax = 0.4; }
        if (c.cd4 <= 0) { summon(pick(MINIONS.goomongous), 3, c, 0.35); c.cd4 = rand(8, 11); addText(c.x, c.y - h * 1.1, 'BLORP!', '#7dff6a', 18); }
      }
      return true;
    }
    case 'kraken': {
      if (adx > vw * 1.1) c.x = P.x - dirP * vw * 0.6;
      c.y = groundY(c.x); c.vy = 0; c.onGround = true;
      c.vx = approach(c.vx, clamp(dx * 0.6, -pspd * 0.35, pspd * 0.35), pspd * dt);
      c.eyeT -= dt;
      if (c.eyeT <= 0) { c.state = c.state === 'open' ? 'closed' : 'open'; c.eyeT = c.state === 'open' ? 3.2 : 2.4; if (c.state === 'open') addText(c.x, c.y - h * 1.2, 'THE EYE OPENS', '#ffe066', 16, 1.2, -20); }
      if (c.cd2 <= 0) { // tentacle strike
        const tx = P.x + P.vx * 0.5 + rand(-1, 1) * P.h;
        c.tents.push({ x: tx, t: 0, side: sign(rand(-1, 1)), L: Math.max(h * 2.6, (groundY(tx) - P.y) * 1.25 + P.h * 2) });
        c.cd2 = rand(1.4, 2.2) * (c.hp / c.maxHp < 0.5 ? 0.7 : 1);
      }
      if (c.cd3 <= 0) { burst(c.x, c.y - h * 0.6, 40, ['#05060a', '#0b0d14', '#14161e'], h * 3, h * 0.5, { kind: 'smoke', grav: -0.05, life: 2.5 }); c.cd3 = rand(7, 10); }
      if (c.cd4 <= 0) { summon(pick(MINIONS.kraken), 2, c, 0.4); c.cd4 = rand(9, 12); }
      for (const t of c.tents) {
        t.t += dt;
        const gy = groundY(t.x);
        if (t.t < 0.9) { if (Math.random() < 0.6) burst(t.x + rand(-1, 1) * P.h * 0.5, gy, 1, ['#c8e8ff', '#ffffff'], P.h, P.h * 0.08, { angle: -Math.PI / 2, spread: 0.3, grav: -0.3 }); continue; }
        const k = clamp((t.t - 0.9) / 1.2, 0, 1);
        t.a = -Math.PI / 2 + t.side * lerp(1.1, -0.7, k);
        const tipX = t.x + Math.cos(t.a) * t.L, tipY = gy + Math.sin(t.a) * t.L;
        if (!t.hit && segDist(P.x, P.y - P.h * 0.5, t.x, gy, tipX, tipY) < t.L * 0.07 + P.h * 0.4) { t.hit = true; hurtPlayer(dmgFrom(c, 0.55), 'WRAPPED BY THE KRAKEN', t.x); }
        if (t.t > 2.4) t.done = true;
      }
      c.tents = c.tents.filter((t) => !t.done);
      return true;
    }
    case 'kinglion': { // pounces from the air, and roars shockwaves you have to JUMP over
      const dy = P.y - c.y, L = Math.hypot(dx, dy) || 1;
      if (c.state === 'tele') { c.vx *= 0.8; c.vy *= 0.8; c.actT = 0.2; if (c.t <= 0) { c.state = 'leap'; c.t = 1.2; c.vx = (P.x - c.x) / 0.75; c.vy = (P.y - c.y) / 0.75; c.vz = h * 15; SFX.roar(0.7); } }
      else if (c.state === 'leap') {
        if (c.z <= 0 && c.t < 1.0) {
          c.state = 'idle'; c.vx = c.vy = 0; c.cd2 = rand(3, 4.5) * (c.hp / c.maxHp < 0.5 ? 0.7 : 1);
          shake(14); SFX.stomp(); ring(c.x, c.y - h * 0.3, h * 0.3, h * 2.2, '#ffe066', 0.5, 8);
          burst(c.x, c.y, 26, CONFETTI, h * 4, h * 0.1, { angle: -Math.PI / 2, spread: 1.4 });
          if (Math.hypot(P.x - c.x, P.y - c.y) < h * 1.6 + P.w * 0.3 && P.z < P.h * 0.6) hurtPlayer(dmgFrom(c, 0.8), 'POUNCED BY ' + d.name, c.x);
        }
      } else if (c.state === 'roar') {
        c.vx = c.vy = 0; c.actT = 0.2;
        if (c.t <= 0) { c.waves.push({ r: h * 0.6, hit: false }); c.state = 'idle'; SFX.roar(0.6); shake(10); addText(c.x, c.y - h * 1.3, 'ROOOAR!', '#ffd23a', 18, 1, -30); }
      } else {
        c.state = 'chase';
        const v = Math.min(c.sp.spd * h * 1.3, pspd * 0.82);
        c.vx = approach(c.vx, dx / L * v, v * 3 * dt); c.vy = approach(c.vy, dy / L * v, v * 3 * dt);
        if (c.cd2 <= 0 && L < vw * 0.7) { c.state = 'tele'; c.t = 0.7; addText(c.x, c.y - h * 1.2, '!', '#ff3b3b', 26, 0.7, -20); }
        else if (c.cd3 <= 0) { c.state = 'roar'; c.t = 0.6; c.cd3 = rand(5.5, 7.5); }
        if (c.cd4 <= 0) { summon(pick(MINIONS.kinglion), 2, c, 0.4); c.cd4 = rand(10, 13); addText(c.x, c.y - h * 1.1, 'GET HER, CUBS!', '#ffd23a', 14); }
      }
      for (const w of c.waves) {
        w.r += pspd * 1.25 * dt;
        const pd = Math.hypot(P.x - c.x, (P.y - c.y) * 1);
        if (!w.hit && Math.abs(pd - w.r) < P.h * 0.45 && P.z < P.h * 0.35) { w.hit = true; hurtPlayer(dmgFrom(c, 0.5), 'BLOWN AWAY BY A ROAR', c.x); }
      }
      c.waves = c.waves.filter((w) => w.r < vw * 0.85);
      if (c.state !== 'chase') { /* keep the state's own velocity */ }
      return true;
    }
    case 'sun': { // drifts after you, drags you in, and erupts
      const dy = P.y - c.y, L = Math.hypot(dx, dy) || 1, R = h * 0.5, low = c.hp / c.maxHp < 0.5;
      c.vx = approach(c.vx, dx / L * c.sp.spd * h * 0.3, h * dt); c.vy = approach(c.vy, dy / L * c.sp.spd * h * 0.3, h * dt);
      if (c.state === 'flare' && c.t <= 0) c.state = 'idle';
      if (c.cd2 <= 0) { c.waves.push({ r: R, hit: false }); c.cd2 = rand(3.2, 4.6) * (low ? 0.7 : 1); c.state = 'flare'; c.t = 0.9; SFX.boom(); shake(10); addText(c.x, c.y - R, 'SOLAR FLARE', '#ffb347', 16, 1.2, -30); }
      if (c.cd3 <= 0) { // coronal mass ejection
        const n = low ? 20 : 14;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rand(0.2); projectiles.push({ x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R, vx: Math.cos(a) * P.h * 7, vy: Math.sin(a) * P.h * 7, g: 0, kind: 'plasma', r: P.h * 0.22, life: 2.6, max: 2.6, team: 'enemy', dmg: dmgFrom(c, 0.35), cause: 'HIT BY A CORONAL MASS EJECTION', boss: true }); }
        c.cd3 = rand(4.5, 6.5); SFX.shoot('star'); addText(c.x, c.y - R * 1.1, 'CORONAL MASS EJECTION', '#ffd27a', 14, 1.2, -30);
      }
      if (c.cd4 <= 0) { for (let k = 0; k < 4; k++) spawnHazard(P.x + rand(-1, 1) * vw * 0.4, 'comet'); summon('asteroid', 2, c, 0.35); c.cd4 = rand(9, 12); }
      for (const w of c.waves) {
        w.r += pspd * 1.15 * dt;
        const pd = Math.hypot(P.x - c.x, P.y - c.y);
        if (!w.hit && Math.abs(pd - w.r) < P.h * 0.5 && P.rollT <= 0) { w.hit = true; hurtPlayer(dmgFrom(c, 0.5), 'CAUGHT IN A SOLAR FLARE', c.x); }
      }
      c.waves = c.waves.filter((w) => w.r < vw * 0.9);
      return true;
    }
    case 'cat': {
      if (c.state === 'tele') { // wiggle... then pounce
        c.vx = 0; c.actT = 0.1;
        if (c.t <= 0) {
          const up = Math.max(0, c.y - P.y);
          c.vy = -Math.sqrt(2 * G * h * (up + h * 0.9)); c.vx = clamp((P.x - c.x) / 0.85, -pspd * 2.4, pspd * 2.4);
          c.onGround = false; c.state = 'pounce'; c.t = 2.5; SFX.enemyRoar();
        }
      } else if (c.state === 'pounce') {
        c.actT = 0.1;
        if (c.onGround && c.t < 2.35) {
          c.state = 'idle'; c.vx = 0; c.cd2 = rand(2.4, 3.8) * (c.hp / c.maxHp < 0.5 ? 0.7 : 1);
          shake(12); SFX.stomp(); ring(c.x, c.y - h * 0.1, h * 0.2, h * 1.6, '#ffffff', 0.4, 6);
          if (Math.abs(P.x - c.x) < c.w * 0.55 + P.w * 0.4 && Math.abs(P.y - c.y) < h * 0.9) hurtPlayer(dmgFrom(c, 0.8), 'POUNCED ON BY ' + d.name, c.x);
        }
      } else if (c.state === 'atk') { // paw swipe
        c.vx = 0;
        if (c.t <= 0) {
          c.state = 'idle'; c.cd = 1.1;
          ring(c.x + c.face * c.w * 0.45, c.y - h * 0.4, h * 0.1, h * 0.8, '#ffffff', 0.25, 4);
          if (adx < c.w * 0.6 + P.w * 0.4 && Math.abs(P.y - c.y) < h) hurtPlayer(dmgFrom(c, 0.7), 'SWATTED BY ' + d.name, c.x);
        }
      } else {
        turnToward(c, dirP, dt, 0.25);
        const v = pspd * 0.7, close = adx < c.w * 0.55 + P.w * 0.4 && Math.abs(P.y - c.y) < h;
        c.vx = close ? 0 : approach(c.vx, c.turnT > 0 ? 0 : c.face * v, v * 3 * dt);
        if (close && c.cd <= 0) { c.state = 'atk'; c.t = 0.4; c.actT = c.actMax = 0.4; }
        else if (c.cd2 <= 0 && adx < vw * 0.65) { c.state = 'tele'; c.t = 0.6; addText(c.x, c.y - h * 1.05, '!', '#ff3b3b', 26, 0.7, -20); }
        if (c.cd3 <= 0 && adx > c.w) { fireAt(c, 'hairball', 0.3); c.cd3 = rand(4, 6); addText(c.x, c.y - h, '*HACK*', '#ffffff', 14); }
        if (c.cd4 <= 0) { for (let k = 0; k < 4; k++) setTimeout(() => { if (boss === c) spawnHazard(P.x + rand(-1, 1) * vw * 0.4, 'block'); }, k * 260); c.cd4 = rand(9, 12); addText(c.x, c.y - h * 1.2, 'IT KNOCKED THINGS OFF THE SHELF', '#ffffff', 12, 1.4, -20); }
      }
      return true;
    }
    case 'serpent': {
      if (!c.trail) { c.trail = []; c.ang = Math.atan2(P.y - c.y, P.x - c.x); }
      const dy = P.y - c.y, L = Math.hypot(dx, dy) || 1, lunge = c.state === 'lunge', tele = c.state === 'tele';
      const v = Math.min(c.sp.spd * h * 1.2, pspd * 0.8) * (lunge ? 2.5 : tele ? 0.25 : 1);
      const want = Math.atan2(dy, dx) + (lunge || tele ? 0 : Math.sin(realT * 1.7 + c.seed * 6) * 0.7);
      c.ang += clamp(angDiff(want, c.ang), -dt * (lunge ? 1.2 : 2.4), dt * (lunge ? 1.2 : 2.4));
      c.vx = Math.cos(c.ang) * v; c.vy = Math.sin(c.ang) * v; c.face = c.vx >= 0 ? 1 : -1;
      if (tele && c.t <= 0) { c.state = 'lunge'; c.t = 1.0; SFX.enemyRoar(); }
      else if (lunge && c.t <= 0) c.state = 'idle';
      else if (!tele && !lunge && c.cd2 <= 0 && L < vw * 0.7) { c.state = 'tele'; c.t = 0.6; c.cd2 = rand(3.5, 5); addText(c.x, c.y - h, '!', '#ff3b3b', 26, 0.7, -20); }
      if (c.cd3 <= 0) { // a ring of falling stars
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; projectiles.push({ x: c.x, y: c.y, vx: Math.cos(a) * P.h * 8, vy: Math.sin(a) * P.h * 8, g: 0, kind: 'star', r: P.h * 0.16, life: 2.2, max: 2.2, team: 'enemy', dmg: dmgFrom(c, 0.35), cause: 'STARRED BY ' + d.name, boss: true }); }
        c.cd3 = rand(4.5, 6.5); SFX.shoot('star'); ring(c.x, c.y, h * 0.3, h * 2, '#ff3af0', 0.4, 6);
      }
      if (c.cd4 <= 0) { summon(pick(MINIONS.serpent), 3, c, 0.35); c.cd4 = rand(10, 13); addText(c.x, c.y - h, 'THE SWARM COMES', '#ff5ad8', 14); }
      // the body follows the path the head took
      c.trail.unshift([c.x, c.y]); if (c.trail.length > 900) c.trail.pop();
      const n = 5 + Math.ceil(9 * clamp(c.hp / c.maxHp, 0, 1)), gap = h * 0.5;
      c.segP = []; let acc = 0, k = 1;
      for (let i = 1; i < c.trail.length && c.segP.length < n; i++) {
        acc += Math.hypot(c.trail[i][0] - c.trail[i - 1][0], c.trail[i][1] - c.trail[i - 1][1]);
        if (acc >= gap * k) { c.segP.push(c.trail[i]); k++; }
      }
      // every body segment is meat: bite it
      for (let i = 0; i < c.segP.length; i++) {
        const [sx, sy] = c.segP[i], sr = h * 0.42 * (1 - i / 16);
        if (Math.hypot(P.x - sx, P.y - sy) < sr + P.h * 0.45 && P.biteCD <= 0) {
          P.biteCD = P.frenzyT > 0 ? 0.18 : 0.35;
          damageCreature(c, P.mass * (P.pounce > 0 ? 1.0 : 0.4));
          burst(sx, sy, 10, ['#ff3af0', '#3affd8', '#ffffff'], P.h * 3, P.h * 0.08, { grav: 0 }); SFX.bite();
          if (P.pounce > 0) { P.pounce = 0; P.vx *= -0.4; P.vy *= -0.4; shake(5); }
          break;
        }
      }
      return true;
    }
    case 'hunger': {
      if (c.cd3 <= 0) { summon('wolfpack', 3, c, 0.5); c.cd3 = rand(10, 13); addText(c.x, c.y - h * 1.1, 'THE PACK COMES', '#ff3030', 16); }
      if (c.cd4 <= 0 && !c.inhale) { c.inhale = 1.8; c.cd4 = rand(8, 11); addText(c.x, c.y - h * 1.2, 'IT INHALES', '#ff3030', 18, 1.5, -20); SFX.gulp(); }
      if (c.inhale) {
        c.inhale -= dt; c.vx = 0;
        if (adx < vw * 0.9) P.vx += sign(c.x - P.x) * P.h * 16 * dt;
        if (Math.random() < 0.8) { const a = rand(Math.PI * 2), r = c.h * rand(2, 4); particles.push({ kind: 'suck', x: c.x + c.face * c.w * 0.4 + Math.cos(a) * r, y: c.y - c.h * 0.7 + Math.sin(a) * r, tx: c.x + c.face * c.w * 0.4, ty: c.y - c.h * 0.7, life: 0.5, max: 0.5, color: '#000', size: c.h * 0.04 }); }
        if (c.inhale <= 0) c.inhale = 0;
        return true;
      }
      return false; // otherwise behaves as a hunter
    }
  }
  return false;
}

// ============================================================ projectiles
const SHOTS = {
  spear:   { speed: 9, grav: true, r: 0.5, color: '#8a6a40' },
  arrow:   { speed: 12, grav: true, r: 0.45, color: '#e8e0c8' },
  bullet:  { speed: 15, grav: false, r: 0.08, color: '#ffe066' },
  harpoon: { speed: 11, grav: false, r: 0.4, color: '#c8c8d0' },
  hex:     { speed: 7, grav: false, r: 0.2, color: '#e6482e' },
  goo:     { speed: 8, grav: true, r: 0.14, color: '#7dff6a', explode: true },
  boulder: { speed: 7, grav: true, r: 0.28, color: '#8a7a68', explode: true },
  coconut: { speed: 8, grav: true, r: 0.2, color: '#7a4a22' },
  shell:   { speed: 9, grav: true, r: 0.12, color: '#202020', explode: true },
  barrel:  { speed: 7, grav: true, r: 0.3, color: '#4a3a2a', explode: true },
  star:    { speed: 10, grav: false, r: 0.15, color: '#ffe066' },
  pea:     { speed: 12, grav: false, r: 0.12, color: '#7dd34a' },
  teeth:   { speed: 10, grav: true, r: 0.18, color: '#fffaf0' },
  hairball:{ speed: 7, grav: true, r: 0.26, color: '#9a9aa8', explode: true },
  plasma:  { speed: 7, grav: false, r: 0.22, color: '#ffb347' },
  laser:   { speed: 14, grav: false, r: 0.1, color: '#ff5ad8' },
};
function fireAt(c, kind, lead = 0.25) {
  const P = player, spec = SHOTS[kind];
  const sx = c.x + c.face * c.w * 0.42, sy = c.y - c.h * (c.flying ? 0.35 : 0.62);
  const tx = P.x + P.vx * lead, ty = P.y - P.h * 0.5;
  const ph = P.h, g = swim() ? 0 : 18 * ph;
  let vx, vy;
  if (spec.grav && !swim()) {
    const T = clamp(Math.abs(tx - sx) / (spec.speed * ph), 0.45, 1.6);
    vx = (tx - sx) / T; vy = (ty - sy - 0.5 * g * T * T) / T;
  } else {
    const d = Math.hypot(tx - sx, ty - sy) || 1;
    vx = (tx - sx) / d * spec.speed * ph; vy = (ty - sy) / d * spec.speed * ph;
  }
  projectiles.push({ x: sx, y: sy, vx, vy, g: spec.grav && !swim() ? g : 0, kind, r: Math.max(spec.r * c.h, ph * 0.06), life: 3, max: 3, team: 'enemy', dmg: c.boss ? dmgFrom(c, 0.5) : clamp(3 + 9 * c.mass / P.mass, 2, 24) * cycleMul(), cause: c.sp.cause || 'SHOT', boss: c.boss });
  SFX.shoot(kind);
}
function updateProjectiles(dt) {
  const p = player;
  const pr = p.active ? rectOfPlayer(p) : null;
  for (const b of projectiles) {
    b.life -= dt;
    b.vy += b.g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.team === 'player') {
      for (const c of creatures) {
        if (!c.alive || c.ally || (b.pierce && c.fireCD > realT)) continue;
        const cr = rectOf(c);
        if (b.x + b.r < cr.x0 || b.x - b.r > cr.x1 || b.y + b.r < cr.y0 || b.y - b.r > cr.y1) continue;
        c.fireCD = realT + 0.15;
        if (canEat(c)) {
          if (b.kind === 'web') { c.webbed = 3; c.stun = 3; damageCreature(c, 0, true); addText(c.x, c.y - c.h, 'WRAPPED', THEME.fg || '#fff', 11, 0.7); }
          else { killCreature(c, false); stats.kills++; gain(0, ptsOf(c) * 0.6, c.x, c.y - c.h); }
        } else {
          damageCreature(c, b.dmg, true);
          if (!c.boss && c.alive) {
            if (b.kind === 'goo') { c.glued = 1.6; c.stun = Math.max(c.stun, 1.6); }
            if (b.kind === 'web') { c.webbed = 3; c.stun = Math.max(c.stun, 3); }
          }
        }
        if (!b.pierce) { b.dead = true; break; }
      }
      if (b.dead) {
        if (b.kind === 'goo') burst(b.x, b.y, 8, GOO, b.r * 6, b.r * 0.5);
        continue;
      }
      const gy = groundY(b.x);
      if (spaceMode) { const P = nearestPlanet(b.x, b.y); if (Math.hypot(b.x - P.x, b.y - P.y) < P.r) { b.dead = true; burst(b.x, b.y, 4, NEON, b.r * 4, b.r * 0.4, { grav: 0 }); } continue; }
      if (b.y > gy) { b.dead = true; burst(b.x, gy, 5, b.kind === 'goo' ? GOO : [THEME.fg || '#fff'], b.r * 4, b.r * 0.4, { angle: -Math.PI / 2, spread: 1 }); }
      continue;
    }
    const gy = groundY(b.x);
    if (pr && !p.dead) {
      const hr = Math.max(b.r * 0.5, p.h * 0.08);
      if (b.x + hr > pr.x0 && b.x - hr < pr.x1 && b.y + hr > pr.y0 && b.y - hr < pr.y1) {
        b.dead = true;
        hurtPlayer(b.dmg, b.cause, b.x - b.vx);
        if (SHOTS[b.kind].explode) { burst(b.x, b.y, 14, b.kind === 'goo' ? GOO : ['#ff7a1a', '#ffd23a', '#555'], p.h * 3, p.h * 0.1); SFX.squish(); }
        continue;
      }
    }
    if (spaceMode) { const P = nearestPlanet(b.x, b.y); if (Math.hypot(b.x - P.x, b.y - P.y) < P.r) { b.dead = true; burst(b.x, b.y, 4, NEON, b.r * 4, b.r * 0.4, { grav: 0 }); } continue; }
    if (b.y > gy || (swim() && b.y < SURF)) {
      b.dead = true;
      const cols = b.kind === 'goo' ? GOO : b.kind === 'boulder' ? STONE : ['#d8c8a0'];
      burst(b.x, gy, SHOTS[b.kind].explode ? 12 : 3, cols, b.r * (SHOTS[b.kind].explode ? 6 : 2), b.r * 0.4, { angle: -Math.PI / 2, spread: 1.2 });
      if (b.boss && SHOTS[b.kind].explode) { SFX.boom(); shake(4); if (pr && Math.abs(p.x - b.x) < b.r * 4 + p.w * 0.3 && Math.abs(p.y - gy) < p.h) hurtPlayer(b.dmg * 0.6, b.cause, b.x); }
    }
  }
  projectiles = projectiles.filter((b) => !b.dead && b.life > 0);
}

// ============================================================ player update
function rectOfPlayer(p) {
  if (openMode) { const hw = p.w * 0.36, hh = p.h * 0.38; return { x0: p.x - hw, x1: p.x + hw, y0: p.y - hh, y1: p.y + hh }; }
  if (roam()) { const hw = p.w * 0.38, hd = p.h * 0.36; return { x0: p.x - hw, x1: p.x + hw, y0: p.y - hd, y1: p.y + hd }; }
  const hw = Math.min(p.w * 0.32, p.h * 0.75) + (p.pounce > 0 ? p.w * 0.12 : 0);
  const cx = p.x + (p.pounce > 0 ? p.face * p.w * 0.1 : 0);
  return { x0: cx - hw, x1: cx + hw, y0: p.y - p.h * 0.82, y1: p.y };
}
function rectOf(c) {
  if (c.vec) { const hw = c.w * 0.38, hh = c.h * 0.38; return { x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y + hh }; }
  if (c.model) { const hw = c.w * 0.4, hd = c.h * 0.34; return { x0: c.x - hw, x1: c.x + hw, y0: c.y - hd, y1: c.y + hd }; }
  if (c.boss && c.bdef.ai === 'kraken') return { x0: c.x - c.w * 0.38, x1: c.x + c.w * 0.38, y0: c.y - c.h * 0.95, y1: c.y };
  const hw = c.w * (c.sp.hbw || 0.72) / 2, hh = c.h * (c.sp.hbh || 0.78);
  if (c.spKey === 'ptero') return { x0: c.x - hw, x1: c.x + hw, y0: c.y - c.h * 0.8, y1: c.y - c.h * 0.2 };
  return { x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y };
}
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

function updatePlayer(dt, inp) {
  const p = player, f = form();
  p.shownMass = lerp(p.shownMass, p.mass, Math.min(1, dt * 4));
  playerDims(p);
  const h = p.h, maxV = f.speed * h * (p.frenzyT > 0 ? 1.45 : 1), g = G * h;
  p.pounceCD -= dt; p.smashCD -= dt; p.invuln -= dt; p.biteCD -= dt; p.hurtFlash -= dt; p.roarAnim -= dt; p.eatT -= dt;
  p.comboT -= dt; if (p.comboT <= 0) p.combo = 0;

  let jumpP = inp.jumpP;
  if (!p.dead) {
    const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (spaceMode || orbitMode) { /* handled by spaceStep / orbitStep below */ }
    else if (swim()) {
      const ay = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      if (roam() && (ax || ay)) { const L = Math.hypot(ax, ay); p.hx = ax / L; p.hy = ay / L; }
      if (p.rollT > 0) { if (roam()) { p.vx = p.hx * maxV * 2.4; p.vy = p.hy * maxV * 2.4; } /* rolling keeps its velocity */ }
      else if (p.pounce > 0) p.pounce -= dt;
      else {
        p.vx = approach(p.vx, ax * maxV, 7 * maxV * dt);
        p.vy = approach(p.vy, ay * maxV * 0.9, 7 * maxV * dt);
      }
      if (ax) p.face = ax;
      if (inp.pounceP && p.pounceCD <= 0) {
        let dx = ax, dy = ay; if (!dx && !dy) { dx = roam() ? p.hx : p.face; dy = roam() ? p.hy : 0; } const L = Math.hypot(dx, dy);
        p.pounce = 0.3; p.pounceCD = CD.pounce; p.vx = dx / L * maxV * 2.8; p.vy = dy / L * maxV * 2.8;
        SFX.pounce(); burst(p.x - p.face * p.w * 0.4, p.y - h * 0.4, 8, ['#c8e8ff', '#ffffff'], h * 2, h * 0.08, { grav: -0.2 });
      }
      if (roam()) { // a real jump, in the third dimension
        if (jumpP && p.jumps > 0) {
          p.vz = Math.sqrt(2 * g * f.jump * h) * (p.jumps < 2 ? 0.9 : 1); p.jumps--;
          burst(p.x, p.y - p.z, 6, CONFETTI, h * 2, h * 0.08, { grav: 0.4 });
          SFX.boing();
        }
        if (!inp.jump && p.vz > 0) p.vz -= g * dt * 1.6;
      }
    } else {
      if (p.rollT > 0) p.vx = p.face * maxV * 2.4;
      else if (p.pounce > 0) p.pounce -= dt;
      else {
        p.vx = approach(p.vx, ax * maxV, (p.onGround ? 12 : 6) * maxV * dt);
        if (ax && !p.beam) p.face = ax;
      }
      if (p.climb) { // scaling a building: hold toward the wall, SPACE to wall-jump off
        if (ax !== p.climb || p.leaping) p.climb = 0;
        else {
          const top = groundY(p.x + p.climb * p.w * 0.45);
          if (top >= p.y - h * 0.05) { p.x += p.climb * p.w * 0.45; p.y = top; p.vy = 0; p.climb = 0; p.onGround = true; burst(p.x, p.y, 6, ['#bbbbbb', '#777777'], h * 2, h * 0.08, { angle: -Math.PI / 2, spread: 1 }); }
          else { p.vx = 0; p.vy = -maxV * 1.35; p.jumps = 1; if (Math.random() < dt * 10) burst(p.x + p.climb * p.w * 0.3, p.y - h * 0.5, 1, ['#999999', '#555555'], h, h * 0.08); }
          if (p.climb && jumpP) { p.vx = -p.climb * maxV * 1.3; p.vy = -Math.sqrt(2 * g * f.jump * h) * 0.9; p.face = -p.climb; p.climb = 0; jumpP = false; SFX.jump(); }
        }
      }
      if (jumpP && p.jumps > 0 && !p.stomping && !p.climb) {
        p.vy = -Math.sqrt(2 * g * f.jump * h) * (p.jumps < (f.jumps || 2) ? 0.9 : 1);
        if (!p.onGround) burst(p.x, p.y, 8, ['#fff', '#e8e0c8'], h * 3, h * 0.07, { grav: 0.2 });
        else burst(p.x, p.y, 6, STYLE === 'cartoon' ? GOO : ['#b8946a', '#d8c8a0'], h * 2, h * 0.08, { angle: -Math.PI / 2, spread: 1.2 });
        p.jumps--; p.onGround = false;
        if (f.bouncy) SFX.boing(); else SFX.jump();
      }
      if (!inp.jump && p.vy < 0 && p.pounce <= 0) p.vy += g * dt * 1.6;
      if (f.glide && inp.jump && p.vy > 0 && !p.stomping) p.vy = Math.min(p.vy, g * 0.12);
      if (inp.pounceP && p.pounceCD <= 0) {
        p.pounce = 0.26; p.pounceCD = CD.pounce;
        p.vx = p.face * maxV * 2.7; p.vy = Math.min(p.vy, -g * 0.11);
        p.onGround = false;
        SFX.pounce();
        burst(p.x - p.face * p.w * 0.4, p.y - h * 0.3, 8, ['#ffffff', '#e8e0c8'], h * 2, h * 0.07, { grav: 0 });
      }
      if (inp.stompP && f.smash) {
        if (p.smashCD > 0) { if (!p.onGround) addText(p.x, p.y - h * 1.3, 'SMASH ' + p.smashCD.toFixed(1) + 's', '#aaa', 10, 0.5, -20); }
        else if (!p.onGround && !p.stomping && groundY(p.x) - p.y > h * 0.4) { p.stomping = true; p.vy = h * 34; p.vx *= 0.25; p.pounce = 0; }
      }
    }
    for (let i = 0; i < 3; i++) if (inp.abilP && inp.abilP[i]) useAbility(i);
    const drain = (event && event.t === 'frenzy') || clearT > 0 ? 0 : (1.9 + Math.min(2.6, eraT / 100)) * cycleMul();
    p.belly -= drain * dt;
    if (p.belly <= 0) { die('STARVED'); return; }
    if (p.belly < 25) SFX.beat();
    updatePowers(dt);
  } else { p.vx *= 0.9; if (water()) p.vy = approach(p.vy, h * 0.6, h * dt); else if (roam()) p.vy *= 0.9; }

  if (spaceMode) spaceStep(p, f, p.dead ? {} : inp, dt, maxV, g, h, p.dead ? false : jumpP);
  else if (orbitMode) orbitStep(p, f, p.dead ? {} : inp, dt, maxV, h);
  else if (swim()) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    const gy = groundY(p.x), top = SURF + p.h * 0.5;
    if (p.y > gy) { p.y = gy; p.vy = Math.min(0, p.vy); }
    if (p.y < top) { p.y = top; p.vy = Math.max(0, p.vy); if (water() && Math.random() < 0.3) burst(p.x, SURF, 2, ['#ffffff', '#c8e8ff'], h * 2, h * 0.08, { angle: -Math.PI / 2, spread: 0.8, grav: 1 }); }
    p.onGround = p.y >= gy - 1;
    if (roam()) {
      p.vz -= g * dt; p.z += p.vz * dt;
      if (p.z <= 0) { if (p.vz < -g * 0.3) burst(p.x, p.y, 6, ['#a6f08a', '#ffffff'], h * 2, h * 0.07, { grav: 0.3 }); p.z = 0; p.vz = 0; p.jumps = f.jumps || 2; }
      p.onGround = p.z <= 0;
    }
    p.phase += dt * (Math.hypot(p.vx, p.vy) / h) * 1.6 + dt * 2;
    if (water() && Math.random() < dt * 3) particles.push({ kind: 'bubble', x: p.x + p.face * p.w * 0.3, y: p.y - p.h * 0.7, vx: rand(-5, 5), vy: -p.h * rand(1, 2), life: 2, max: 2, size: p.h * rand(0.04, 0.09), grav: 0, color: '#fff' });
  } else {
    if (p.leaping && p.vy > 0) { p.leaping = false; p.stomping = true; p.vy = h * 22; }
    if (!p.climb) p.vy += g * dt * (p.pounce > 0 ? 0.5 : 1);
    if (houseMode && inp.down && p.onGround && p.plat && !p.dead) { p.dropT = 0.22; p.onGround = false; }
    p.dropT = (p.dropT || 0) - dt;
    const ox = p.x, oy = p.y;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (cityMode && p.x !== ox) { // walls: buildings block you — push into one to climb it
      const dir = sign(p.x - ox);
      if (groundY(p.x + dir * p.w * 0.3) < p.y - h * 0.3) {
        p.x = ox; p.vx = 0; p.pounce = 0;
        if (!p.dead && (inp.right ? 1 : 0) - (inp.left ? 1 : 0) === dir && !p.stomping && !p.leaping) p.climb = dir;
      }
    }
    const gy = houseMode ? floorAt(p.x, p.dropT > 0 ? oy + 3 : oy) : groundY(p.x);
    const plat = houseMode ? lastPlat : null;
    if (p.y >= gy) {
      p.plat = plat;
      if (plat && plat.kind === 'bouncy' && p.vy > g * 0.12 && !p.dead) { // beds and sofas are trampolines
        p.y = gy; p.vy = -Math.max(p.vy * 0.85, Math.sqrt(2 * g * h * 4)); p.onGround = false; p.jumps = f.jumps || 2; p.squash = 0.15; SFX.spring();
        burst(p.x, gy, 6, ['#ffffff', '#ffd6e8'], h * 2, h * 0.07, { angle: -Math.PI / 2, spread: 1 });
        if (p.stomping) stompImpact();
      } else if (!p.onGround) {
        if (p.stomping) stompImpact();
        else if (p.vy > g * 0.35) {
          burst(p.x, gy, 6, STYLE === 'cartoon' ? GOO : STYLE === 'film' ? ['#9a9a9a', '#5a5a5a'] : ['#b8946a', '#d8c8a0'], h * 2, h * 0.07, { angle: -Math.PI / 2, spread: 1.4 });
          if (f.bouncy && p.vy > g * 0.5) { p.squash = 0.18; }
        }
      }
      if (p.vy >= 0) { p.y = gy; p.vy = 0; p.onGround = true; p.jumps = f.jumps || 2; } // (a trampoline bounce leaves vy < 0)
    } else if (p.onGround && gy - p.y < h * 0.35 && p.vy >= 0) { p.y = gy; p.vy = 0; }
    else p.onGround = false;
    if (p.stomping && p.onGround) p.stomping = false;
    if (houseMode && p.onGround && !p.dead) {
      const P = floorAt(p.x, p.y) === p.y ? lastPlat : null;
      p.plat = P;
      if (P && P.kind === 'keys') { // walk across the keyboard to play it
        const k = clamp(Math.floor((p.x - P.x0) / ((P.x1 - P.x0) / P.keys)), 0, P.keys - 1), id = P.cell + ':' + k;
        if (p.lastKey !== id) { p.lastKey = id; SFX.note(pianoKeyHz(k)); pressedKeys2[id] = realT; particles.push({ kind: 'note', x: p.x, y: P.top - h * 0.3, vx: rand(-20, 20), vy: -h * 2, life: 1.2, max: 1.2, size: h * 0.3, grav: -0.05, color: pick(['#ff7a59', '#5ac8ff', '#b46aff', '#3ab87a']) }); }
      } else p.lastKey = null;
      if (P && P.kind === 'stove' && stoveHot(P)) { p.stoveT = (p.stoveT || 0) - dt; if (p.stoveT <= 0) { p.stoveT = 0.6; hurtPlayer(7 * cycleMul(), 'TOASTED ON THE STOVE', p.x - p.face); burst(p.x, p.y, 6, ['#ff7a1a', '#ffd23a'], h * 2, h * 0.1, { grav: -0.3 }); } }
    } else if (houseMode) p.lastKey = null;
    p.phase += dt * (Math.abs(p.vx) / h) * 2.2;
  }
  p.squash = Math.max(0, (p.squash || 0) - dt);
  if (f.aura && Math.random() < 0.5) burst(p.x + rand(-p.w, p.w) * 0.4, p.y - rand(p.h), 1, [f.aura, '#ffffff'], h * 0.5, h * 0.06, { grav: -0.1, life: 0.6 });
  if (p.frenzyT > 0 && Math.random() < 0.6) burst(p.x - p.face * p.w * 0.4, p.y - p.h * 0.5, 1, ['#c01010', '#ff3030'], h, h * 0.1, { grav: 0, life: 0.5, kind: 'smoke' });

  if (p.dead) return;
  const pr = rectOfPlayer(p);
  for (const c of creatures) {
    if (!c.alive || c.ally) continue;
    if (!overlap(pr, rectOf(c))) continue;
    if (roam() && Math.abs(p.z - c.z) > (p.h + c.h) * 0.42) continue; // jump to reach parrots; jump over a charging hog
    if (canEat(c)) { eatWhole(c); continue; }
    if (p.biteCD <= 0) {
      const pouncing = p.pounce > 0;
      p.biteCD = p.frenzyT > 0 ? 0.18 : 0.35;
      const weak = c.boss && c.bdef.ai === 'kraken' && c.state === 'open';
      damageCreature(c, p.mass * (pouncing ? 1.0 : 0.35) * (weak ? 1.6 : 1) * (p.frenzyT > 0 ? (c.boss ? 1.4 : 2.5) : 1));
      if (p.frenzyT > 0) p.belly = Math.min(100, p.belly + 1.5);
      if (c.sp.vehicle) SFX.metal(); else SFX.bite();
      burst(lerp(p.x, c.x, 0.5), p.y - p.h * 0.6, 8, chunkColors(c), p.h * 3, p.h * 0.07);
      if (c.flying && c.alive && !c.boss) { c.flying = false; c.stun = 2; }
      if (pouncing) {
        p.pounce = 0; p.vx = -p.face * maxV * 0.9; p.vy = swim() ? -maxV * 0.3 : -g * 0.18; p.onGround = false; p.invuln = Math.max(p.invuln, 0.3);
        freeze = Math.max(freeze, 0.05); shake(5);
      }
    }
    if (c.alive && c.hurtCD <= 0 && canHurtByContact(c)) {
      c.hurtCD = 0.8;
      hurtPlayer(dmgFrom(c, c.boss ? 0.7 : c.sp.grav ? 0.45 : 1), c.boss ? 'CRUSHED BY ' + c.bdef.name : (c.sp.cause || 'HURT'), c.x);
      if (p.dead) return;
    }
  }
  for (const co of corpses) {
    if (co.meat <= 0) continue;
    if (Math.abs(co.x - p.x) < co.w * 0.45 + p.w * 0.2 && Math.abs(co.y - p.y) < (roam() ? (p.h + co.h) * 0.35 : p.h + co.h)) {
      const bite = Math.min(co.meat, p.mass * 1.1 * dt + 0.02);
      co.meat -= bite;
      gain(bite, 0, co.x, co.y);
      p.score += Math.round(co.pts * bite / co.maxMeat * cycle);
      if (Math.random() < dt * 8) {
        if (co.metal) SFX.metal(); else if (STYLE === '3d') SFX.squish(); else SFX.crunch();
        burst(co.x + rand(-co.w, co.w) * 0.3, co.y - co.h * 0.5, 3, co.metal ? METAL : chunkColors(), p.h * 2.5, p.h * 0.07, { up: swim() ? 0 : p.h * 2 });
      }
      p.eatT = 0.2;
      if (co.meat <= 0) { addText(co.x, co.y - co.h, co.metal ? 'SCRAP!' : 'BONES!', '#e8e0c8', 12, 0.8); addCombo(); }
    }
  }
}

// THE SOLAR SYSTEM: thrust in any direction and coast; planets and moons pull on you
function orbitStep(p, f, inp, dt, maxV, h) {
  const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), ay = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
  if (!p.dead) {
    if (ax || ay) { const L = Math.hypot(ax, ay); p.hx = ax / L; p.hy = ay / L; p.vx += p.hx * maxV * 3 * dt; p.vy += p.hy * maxV * 3 * dt; if (Math.random() < dt * 20) burst(p.x - p.hx * p.w * 0.5, p.y - p.hy * p.h * 0.5, 1, ['#bfe8ff', '#ffffff'], h * 1.5, h * 0.06, { grav: 0, life: 0.4 }); }
    if (ax && !p.beam) p.face = ax;
    if (p.rollT > 0) { p.vx = p.hx * maxV * 2.6; p.vy = p.hy * maxV * 2.6; }
    else if (p.pounce > 0) p.pounce -= dt;
    if (inp.pounceP && p.pounceCD <= 0) { p.pounce = 0.3; p.pounceCD = CD.pounce; p.vx = p.hx * maxV * 2.8; p.vy = p.hy * maxV * 2.8; SFX.pounce(); burst(p.x - p.hx * p.w * 0.5, p.y - p.hy * p.h * 0.5, 10, ['#ffd27a', '#ffffff'], h * 3, h * 0.08, { grav: 0 }); }
  }
  for (const c of creatures) { // gravity: anything with real gravity that you can't eat yet pulls you toward it
    if (!c.alive || !c.sp.grav || canEat(c)) continue;
    const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy) || 1, R = c.h * 0.5;
    if (d > R * 7) continue;
    const a = maxV * (c.boss ? 2.6 : 1.8) * Math.min(1, Math.pow(R * 2 / d, 2));
    p.vx += dx / d * a * dt; p.vy += dy / d * a * dt;
    const min = R + p.h * 0.35;
    if (d < min) { p.x = c.x - dx / d * min; p.y = c.y - dy / d * min; const n = (p.vx * dx + p.vy * dy) / d; if (n > 0) { p.vx -= dx / d * n * 1.5; p.vy -= dy / d * n * 1.5; } }
  }
  if (f.pull && !p.dead) victims((c) => { // a black hole swallows what strays too close
    if (!canEat(c)) return;
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
    if (d > h * 5) return;
    c.vx += dx / d * h * 8 * dt; c.vy += dy / d * h * 8 * dt;
    if (Math.random() < dt * 6) particles.push({ kind: 'suck', x: c.x, y: c.y, tx: p.x, ty: p.y, life: 0.5, max: 0.5, color: '#ffb347', size: h * 0.06 });
  });
  const sp = Math.hypot(p.vx, p.vy), cap = maxV * (p.pounce > 0 || p.rollT > 0 ? 3 : 1.7);
  if (sp > cap) { p.vx *= cap / sp; p.vy *= cap / sp; }
  const drag = Math.pow(p.dead ? 0.5 : 0.62, dt); p.vx *= drag; p.vy *= drag;
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.onGround = false;
  p.phase += dt * 2;
}
// NEON ORBIT: run around little planets; each pulls you toward its centre
function spaceStep(p, f, inp, dt, maxV, g, h, jumpP) {
  const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  let P = nearestPlanet(p.x, p.y);
  let dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const tx = -uy, ty = ux;
  let vn = p.vx * ux + p.vy * uy, vt = p.vx * tx + p.vy * ty;
  const rest = P.r + h * 0.45, onG = d <= rest + 2;
  if (!p.dead) {
    if (p.pounce > 0) p.pounce -= dt;
    else if (p.rollT <= 0) vt = approach(vt, ax * maxV, (onG ? 12 : 3) * maxV * dt);
    if (ax && !p.beam) p.face = ax;
    if (jumpP && p.jumps > 0 && !p.stomping) {
      vn = Math.max(vn, 0) + Math.sqrt(2 * g * f.jump * h) * (onG ? 1.35 : 0.9); p.jumps--; p.onGround = false;
      burst(p.x - ux * h * 0.4, p.y - uy * h * 0.4, 8, NEON, h * 2, h * 0.07, { grav: 0 }); SFX.jump();
    }
    if (inp.pounceP && p.pounceCD <= 0) {
      p.pounce = 0.3; p.pounceCD = CD.pounce; vt = p.face * maxV * 2.8; if (onG) vn = Math.max(vn, maxV * 0.5);
      SFX.pounce(); burst(p.x - tx * p.face * p.w * 0.4, p.y - ty * p.face * p.w * 0.4, 8, ['#ffffff', f.col], h * 2, h * 0.07, { grav: 0 });
    }
    if (inp.stompP && f.smash) {
      if (p.smashCD > 0) { if (!onG) addText(p.x, p.y - h, 'SMASH ' + p.smashCD.toFixed(1) + 's', '#aaa', 10, 0.5, -20); }
      else if (!onG && !p.stomping && d - rest > h * 0.4) { p.stomping = true; vn = -h * 34; vt *= 0.25; p.pounce = 0; }
    }
  }
  const gk = clamp(Math.pow((P.r + h * 3) / d, 2), 0.25, 1);
  const floating = inp.jump && !onG && !p.stomping; // hold SPACE to drift further
  vn -= g * gk * (floating ? 0.55 : 1) * (p.pounce > 0 ? 0.5 : 1) * dt;
  if (onG && vn < 0) vn = 0;
  p.vx = ux * vn + tx * vt; p.vy = uy * vn + ty * vt;
  if (p.dead) { p.vx *= 0.97; p.vy *= 0.97; }
  p.x += p.vx * dt; p.y += p.vy * dt;
  P = nearestPlanet(p.x, p.y); dx = p.x - P.x; dy = p.y - P.y; d = Math.hypot(dx, dy) || 1; ux = dx / d; uy = dy / d;
  const rest2 = P.r + h * 0.45, n = p.vx * ux + p.vy * uy;
  if (d < rest2 || (d < rest2 + 2.5 && n <= 0)) { // standing on (or sinking into) the surface
    p.x = P.x + ux * rest2; p.y = P.y + uy * rest2;
    if (n < 0) { p.vx -= ux * n; p.vy -= uy * n; }
    if (!p.onGround) {
      if (p.stomping) stompImpact();
      else if (n < -g * 0.3) burst(p.x - ux * h * 0.45, p.y - uy * h * 0.45, 8, NEON, h * 2, h * 0.07, { grav: 0 });
    }
    p.onGround = true; p.jumps = f.jumps || 2; p.stomping = false;
  } else p.onGround = false;
  p.planet = P; p.upA = Math.atan2(uy, ux);
  p.hx = -uy * p.face; p.hy = ux * p.face;
  p.phase += dt * (Math.abs(vt) / h) * 2.2;
  if (!p.trail) p.trail = [];
  const last = p.trail[0];
  if (!last || Math.hypot(last[0] - p.x, last[1] - p.y) > h * 0.1) { p.trail.unshift([p.x, p.y]); if (p.trail.length > 90) p.trail.pop(); }
}

// ============================================================ creature AI
function turnToward(c, dir, dt, delay = 0.3) {
  if (dir === c.face) { c.turnT = 0; return; }
  c.turnT += dt;
  if (c.turnT > delay) { c.face = dir; c.turnT = 0; }
}
function wander(c, dt, spd, still = 0.35, k = 0.5) {
  if (c.t <= 0) { c.t = rand(0.8, 2.6); c.vx = Math.random() < still ? 0 : sign(rand(-1, 1)) * spd * rand(k * 0.5, k); if (c.vx) c.face = sign(c.vx); }
}
function updateSwimmer(c, dt, P, dx, adx, dirP, big, edible, vw) {
  const sp = c.sp, h = c.h, spd = sp.spd * h;
  const dy = P ? (P.y - P.h * 0.5) - (c.y - h * 0.5) : 0;
  let tx = 0, ty = 0;
  const steer = (vx, vy, acc = 3) => { c.vx = approach(c.vx, vx, spd * acc * dt); c.vy = approach(c.vy, vy, spd * acc * dt); };
  if (openMode && P && !c.boss && c.state !== 'stampede' && Math.hypot(dx, dy) > vw * 1.15) { const L = Math.hypot(dx, dy); steer(dx / L * spd * 0.8, dy / L * spd * 0.8, 2); if (c.vx) c.face = sign(c.vx); return; }
  if (c.state === 'stampede') { steer(c.face * spd * 3, 0, 6); }
  else switch (sp.ai) {
    case 'drift': { // dead satellites, lost gloves, moons: they just drift
      if (c.t <= 0) { c.t = rand(3, 6); c.tx = rand(-1, 1) * spd * 0.6; c.ty = rand(-1, 1) * spd * 0.6; }
      steer(c.tx || 0, c.ty || 0, 0.6);
      break;
    }
    case 'rammer': { // lines up on you... then fires its engine
      const L = Math.hypot(dx, dy) || 1;
      if (c.state === 'tele') { steer(0, 0, 6); c.face = sign(dx); if (c.t <= 0) { c.state = 'ram'; c.t = 1.3; c.vx = dx / L * spd * 4.5; c.vy = dy / L * spd * 4.5; SFX.whoosh(); } }
      else if (c.state === 'ram') { if (Math.random() < 0.6) burst(c.x - c.vx * 0.02, c.y - c.vy * 0.02, 1, ['#ffd27a', '#ffffff', '#ff8a3a'], h, h * 0.12, { grav: 0, life: 0.4 }); if (c.t <= 0) { c.state = 'idle'; c.cd = rand(2.5, 4); } }
      else if (edible && L < P.h * 6) steer(-dx / L * spd, -dy / L * spd, 3);
      else if (big && L < vw * 0.55 && c.cd <= 0) { c.state = 'tele'; c.t = 0.8; addText(c.x, c.y - c.h, '!', '#ff3b3b', 22, 0.7, -20); }
      else { if (c.t <= 0) { c.t = rand(2, 4); c.tx = rand(-1, 1) * spd * 0.5; c.ty = rand(-1, 1) * spd * 0.5; } steer(c.tx || 0, c.ty || 0, 1); }
      break;
    }
    case 'school': {
      if (P && P.mass > c.mass * 1.1 && Math.hypot(dx, dy) < P.h * 6) { const L = Math.hypot(dx, dy) || 1; steer(-dx / L * spd * 1.2, -dy / L * spd * 1.2, 5); }
      else {
        if (c.t <= 0) { c.t = rand(1, 3); c.tx = rand(-1, 1) * spd; c.ty = sp.bottom ? 0 : rand(-0.5, 0.5) * spd; }
        steer(c.tx || 0, c.ty || 0, 1.5);
        if (Math.abs(c.x - focusX()) > vw * 1.1) c.tx = sign(focusX() - c.x) * spd * 0.6;
      }
      break;
    }
    case 'drifter': {
      c.phase += dt * 2;
      const pulse = Math.max(0, Math.sin(c.phase * 1.3));
      tx = (Math.abs(c.x - focusX()) > vw * 0.9 ? sign(focusX() - c.x) : Math.sin(c.seed * 9 + realT * 0.2)) * spd * 0.4;
      ty = -pulse * spd * 1.6 + spd * 0.5;
      if (big && P && Math.hypot(dx, dy) < P.h * 5) tx += sign(dx) * spd * 0.5;
      steer(tx, ty, 2);
      break;
    }
    case 'hunter': {
      const range = c.angry ? vw * 1.3 : Math.max(h * 6, vw * 0.6);
      if (big && Math.hypot(dx, dy) < range) {
        if (c.state !== 'chase') { c.state = 'chase'; addText(c.x, c.y - c.h * 1.1, '!', '#ff3b3b', 22, 0.8, -20); }
        const L = Math.hypot(dx, dy) || 1, v = Math.min(spd * 1.2, form().speed * P.h * 0.8);
        steer(dx / L * v, dy / L * v, 3);
      } else if (edible && Math.hypot(dx, dy) < P.h * 6) { const L = Math.hypot(dx, dy) || 1; steer(-dx / L * spd, -dy / L * spd, 4); c.state = 'flee'; }
      else { c.state = 'idle'; if (c.t <= 0) { c.t = rand(1.5, 3); c.tx = rand(-1, 1) * spd * 0.4; c.ty = rand(-0.3, 0.3) * spd; } steer(c.tx || 0, c.ty || 0, 1.5); }
      break;
    }
    case 'ranged': {
      if (c.state === 'aim') { steer(0, 0, 4); if (P) c.face = dirP; if (c.t <= 0) { if (P) fireAt(c, sp.shot); c.state = 'idle'; c.cd = rand(sp.rof[0], sp.rof[1]); } }
      else if (edible && Math.hypot(dx, dy) < P.h * 5) { const L = Math.hypot(dx, dy) || 1; steer(-dx / L * spd * 1.2, -dy / L * spd * 1.2, 4); }
      else if (P && adx < vw * 0.85 && c.mass > P.mass * 0.06) {
        c.face = dirP;
        const pref = vw * 0.34, L = Math.hypot(dx, dy) || 1;
        const k = L > pref * 1.2 ? 0.8 : L < pref * 0.6 && big ? -0.7 : 0;
        steer(dx / L * spd * k, k === 0 ? clamp(dy / h * spd * 0.3, -spd * 0.6, spd * 0.6) : dy / L * spd * k, 3);
        if (c.cd <= 0 && L < vw * 0.7) { c.state = 'aim'; c.t = 0.45; c.actT = c.actMax = 0.5; }
      } else { if (c.t <= 0) { c.t = rand(1.5, 3); c.tx = rand(-1, 1) * spd * 0.4; } steer(c.tx || 0, 0, 1.5); }
      break;
    }
  }
  if (c.vx) c.face = sp.ai === 'ranged' && P && c.state !== 'flee' ? c.face : sign(c.vx);
}
function updateCreature(c, dt) {
  const P = player && player.active && !player.dead ? player : null;
  const dx = P ? P.x - c.x : 0, adx = Math.abs(dx), dirP = sign(dx);
  const sp = c.sp, h = c.h, spd = sp.spd * h;
  c.t -= dt; c.cd -= dt; c.flash -= dt; c.hurtCD -= dt; c.fleeT -= dt; c.actT -= dt; c.glued -= dt; c.webbed -= dt;
  const big = P && isBigger(c), edible = P && canEat(c);
  const vw = viewW();

  if (c.ally) { updateAlly(c, dt, vw); return; }
  if (c.pin) { c.vx = 0; c.stun = 0; } // tutorial targets stay put
  else if (c.stun > 0 && !(c.boss && c.bdef.ai === 'kraken')) {
    c.stun -= dt;
    c.vx *= Math.pow(0.05, dt);
    if (c.swim) c.vy *= Math.pow(0.1, dt);
    if (Math.random() < dt * 6 && c.glued <= 0 && c.webbed <= 0) burst(c.x + rand(-0.3, 0.3) * c.w, c.y - c.h * 1.05, 1, ['#fff6a8', '#ffffff'], h * 0.6, h * 0.08, { grav: 0, life: 0.5 });
    if (c.stun <= 0 && sp.ai === 'flyer') { c.flying = true; c.state = 'climb'; c.t = 1.2; }
  } else if (c.boss && P && bossAI(c, dt, P, dx, adx, dirP, vw)) {
    // boss handled
  } else if (c.swim) {
    updateSwimmer(c, dt, P, dx, adx, dirP, big, edible, vw);
  } else if (c.state === 'stampede') {
    c.vx = c.face * spd * (sp.vehicle ? 1.4 : 3.4);
  } else {
    switch (sp.ai) {
      case 'skitter': case 'hopper': {
        if (P && P.mass > c.mass * 1.1 && (adx < P.h * 6 || c.fleeT > 0)) {
          c.face = -dirP; c.vx = c.face * spd * (c.gold ? 1.5 : 1.15);
          if (sp.screams && Math.random() < dt * 0.5) addText(c.x, c.y - c.h * 1.3, pick(['EEK!', 'AAAH!', 'HELP!', 'RUN!', 'IT\'S ALIVE!']), '#ffffff', 9, 0.8, -30);
          if (c.onGround && Math.random() < dt * (sp.ai === 'hopper' ? 4 : 1.8)) { c.vy = -h * rand(6, 10); c.onGround = false; }
        } else {
          wander(c, dt, spd, 0.35, 0.6);
          if (c.onGround && Math.random() < dt * (sp.ai === 'hopper' && c.vx ? 3 : 0.3)) { c.vy = -h * 5; c.onGround = false; }
        }
        break;
      }
      case 'static': c.vx = 0; break;
      case 'turret': {
        c.vx = 0;
        if (P && adx < vw * 0.6 && c.mass > P.mass * 0.06 && !edible && c.cd <= 0) { c.face = dirP; fireAt(c, sp.shot); c.cd = rand(sp.rof[0], sp.rof[1]); c.actT = c.actMax = 0.3; }
        break;
      }
      case 'boat': {
        if (!c.dir) c.dir = c.face;
        if (Math.abs(c.x - focusX()) > vw * 1.2) c.dir = sign(focusX() - c.x);
        c.face = c.dir; c.vx = approach(c.vx, c.dir * spd, spd * dt);
        c.y = SURF + h * 0.42 + Math.sin(realT * 1.5 + c.seed * 9) * h * 0.04;
        if (P && adx < vw * 0.5 && c.cd <= 0 && !edible) { spawnHazard(c.x, 'charge'); c.cd = rand(2.2, 3.4); }
        c.x += c.vx * dt;
        return;
      }
      case 'driver': { // cars & trucks patrol their street — and run you over
        if (!c.dir) c.dir = c.face;
        if (Math.abs(c.x - focusX()) > vw * 1.2) c.dir = sign(focusX() - c.x);
        else if (edible && adx < P.h * 6) c.dir = -dirP;
        else if (big && adx < vw * 0.55 && Math.abs(P.y - c.y) < h * 1.5 && c.cd <= 0) { c.dir = dirP; c.cd = rand(2, 4); }
        c.face = c.dir;
        c.vx = approach(c.vx, c.dir * spd, spd * 1.5 * dt);
        break;
      }
      case 'dropper': { // spiders hang from the ceiling on a thread, and drop when you pass under
        c.phase += dt;
        if (!c.dropped) {
          c.flying = true; c.vx = 0; c.vy = 0;
          if (c.hangY === undefined) c.hangY = c.y;
          c.y = c.hangY + Math.sin(realT * 1.4 + c.seed * 6) * h * 0.4;
          if (P && (big || c.angry) && adx < Math.max(h * 1.2, P.w) && P.y > c.y) { c.dropped = true; c.flying = false; c.vy = h * 3; c.angry = true; addText(c.x, c.y - h, '!', '#ff3b3b', 22, 0.7, -20); }
          else if (edible && adx < P.h * 3) c.hangY -= h * 2 * dt;
          break;
        }
        const range = c.angry ? vw * 1.2 : vw * 0.6;
        if (big && adx < range) { turnToward(c, dirP, dt, 0.3); c.vx = approach(c.vx, c.turnT > 0 ? 0 : c.face * Math.min(spd * 1.2, form().speed * P.h * 0.75), spd * 4 * dt); if (c.onGround && P.y < c.y - h * 1.5 && Math.random() < dt * 2) { c.vy = -Math.sqrt(2 * G * h * (c.y - P.y + h)); c.onGround = false; } }
        else if (edible && adx < P.h * 6) { c.face = -dirP; c.vx = c.face * spd; }
        else wander(c, dt, spd, 0.4, 0.5);
        break;
      }
      case 'flyer': {
        c.phase += dt * 6;
        let gy = houseMode ? floorAt(c.x, c.y) : groundY(c.x);
        if (cityMode) gy = Math.min(gy, groundY(c.x + c.face * h * 4), P ? P.y - P.h * 1.2 : 0);
        if (c.state === 'dive') {
          if (c.t <= 0 || c.y > gy - h * 0.3) { c.state = 'climb'; c.t = 1.4; c.cd = rand(2.5, 4); }
        } else if (c.state === 'climb') {
          c.vy = approach(c.vy, -spd * 1.2, spd * 4 * dt);
          c.vx = approach(c.vx, c.face * spd, spd * 2 * dt);
          if (c.t <= 0 || c.y < gy - h * 4) c.state = 'patrol';
        } else {
          c.state = 'patrol';
          const alt = h * 3.2;
          const targetY = gy - (edible && adx < P.h * 6 ? alt * 1.5 : alt) + Math.sin(c.phase * 0.3) * h * 0.6;
          c.vy = approach(c.vy, clamp((targetY - c.y) * 2, -spd, spd), spd * 3 * dt);
          if (Math.abs(c.x - focusX()) > vw * 0.9) c.face = sign(focusX() - c.x);
          else if (c.t <= 0) { c.t = rand(2, 5); if (Math.random() < 0.4) c.face *= -1; }
          if (edible && adx < P.h * 5) c.face = -dirP;
          c.vx = approach(c.vx, c.face * spd * 0.7, spd * 2 * dt);
          if (sp.dive && big && P && adx < Math.max(h * 7, vw * 0.4) && c.cd <= 0 && c.y < P.y - P.h) {
            c.state = 'dive'; c.t = 1.3;
            const tx = P.x + P.vx * 0.3, ty = P.y - P.h * 0.5;
            const d = Math.hypot(tx - c.x, ty - c.y) || 1;
            c.vx = (tx - c.x) / d * spd * 2.3; c.vy = (ty - c.y) / d * spd * 2.3;
            c.face = sign(c.vx);
            SFX.whistle();
          }
          if (sp.shot && P && !edible && adx < vw * 0.55 && c.cd <= 0 && c.mass > P.mass * 0.06) { fireAt(c, sp.shot, 0.1); c.cd = rand(sp.rof[0], sp.rof[1]); c.actT = c.actMax = 0.3; }
        }
        break;
      }
      case 'charger': {
        if (c.state === 'tele') { c.vx = 0; if (c.t <= 0) { c.state = 'charge'; c.t = 1.5; SFX.stomp(); } }
        else if (c.state === 'charge') {
          c.vx = c.face * spd * 3.8;
          if (sp.hop && c.onGround) { c.vy = -h * 4; c.onGround = false; }
          if (Math.random() < dt * 20) burst(c.x - c.face * c.w * 0.4, c.y, 1, STYLE === 'cartoon' ? GOO : ['#b8946a', '#d8c8a0'], h, h * 0.08, { angle: -Math.PI / 2, spread: 1 });
          if (c.t <= 0) { c.state = 'idle'; c.cd = rand(2, 3.5); c.t = 1; c.angry = false; }
        } else if (edible && (adx < P.h * 6 || c.fleeT > 0)) { c.face = -dirP; c.vx = c.face * spd * 2.2; }
        else if (big && (c.angry || adx < Math.max(h * 5, P.h * 5)) && adx < vw * 0.7 && c.cd <= 0 && Math.abs(P.y - c.y) < h * 3) { c.face = dirP; c.state = 'tele'; c.t = 0.75; }
        else wander(c, dt, spd, 0.5, 0.4);
        break;
      }
      case 'tank': {
        if (c.state === 'swing') {
          c.vx = 0;
          if (c.t <= 0) {
            c.state = 'idle'; c.cd = 1.4;
            const behind = P && dirP === -c.face && adx < c.w * 0.75 && Math.abs(P.y - c.y) < c.h * 1.2;
            ring(c.x - c.face * c.w * 0.45, c.y - c.h * 0.4, h * 0.2, h * 1.2, '#ffffff', 0.25, 3);
            SFX.bite();
            if (behind && big) hurtPlayer(dmgFrom(c, 0.9), sp.cause, c.x);
          }
        } else if (big && dirP === -c.face && adx < c.w * 0.7 && Math.abs(P.y - c.y) < c.h * 1.2 && c.cd <= 0) { c.state = 'swing'; c.t = 0.45; }
        else if (edible && adx < P.h * 6) { c.face = -dirP; c.vx = c.face * spd * 1.6; }
        else wander(c, dt, spd, 0.4, 0.5);
        break;
      }
      case 'hunter': {
        const range = c.boss || c.angry ? vw * 1.5 : Math.max(h * 6, vw * 0.65);
        if (big && adx < range && (c.chaseT < 7 || c.boss)) {
          if (c.state !== 'chase') { c.state = 'chase'; SFX.enemyRoar(); addText(c.x, c.y - c.h * 1.1, '!', '#ff3b3b', 22, 0.8, -20); }
          c.chaseT += dt;
          turnToward(c, dirP, dt, 0.35);
          const v = Math.min(spd * 1.2, form().speed * P.h * (c.boss ? 0.88 : 0.8));
          c.vx = approach(c.vx, c.turnT > 0 ? 0 : c.face * v, v * 3 * dt);
          if (sp.hop && c.onGround && Math.abs(c.vx) > v * 0.3) { c.vy = -h * 4.5; c.onGround = false; }
          if (c.boss && c.onGround && adx < h * 3 && c.cd <= 0) { c.vy = -h * 9; c.onGround = false; c.vx = c.face * v * 1.6; c.cd = rand(3, 5); }
        } else if (edible && adx < P.h * 7) { c.state = 'flee'; c.face = -dirP; c.vx = c.face * spd * 0.9; }
        else {
          if (c.state === 'chase') { c.state = 'idle'; c.t = 2; }
          if (adx > range) c.chaseT = Math.max(0, c.chaseT - dt * 2);
          wander(c, dt, spd, 0.3, 0.35);
          if (c.chaseT >= 7 && c.t <= 0.1) c.chaseT = 0;
        }
        break;
      }
      case 'giant': {
        if (c.state === 'lift') {
          if (c.t <= 0) {
            c.state = 'idle'; c.cd = 1.3;
            shake(P ? clamp(10 - adx / h, 2, 10) : 2);
            SFX.stomp();
            burst(c.x + c.face * c.w * 0.15, c.y, 12, STYLE === 'cartoon' ? GOO : ['#b8946a', '#d8c8a0'], h * 1.5, h * 0.05, { angle: -Math.PI / 2, spread: 1.4 });
            if (P && big && adx < c.w * 0.45 && P.onGround) hurtPlayer(dmgFrom(c), sp.cause, c.x - dirP);
          }
          c.vx = 0;
        } else {
          if (big && adx < c.w * 0.45 && P.onGround && c.cd <= 0) { c.state = 'lift'; c.t = 0.45; }
          if (edible && adx < P.h * 6) { c.face = -dirP; c.vx = c.face * spd * 2.2; }
          else wander(c, dt, spd, 0.3, 1);
        }
        break;
      }
      case 'melee': {
        if (c.state === 'atk') {
          c.vx = 0;
          if (c.t <= 0) {
            c.state = 'idle'; c.cd = rand(1, 1.8);
            if (P && big && adx < c.w * 0.6 + P.w * 0.35 && Math.abs(P.y - c.y) < Math.max(c.h, P.h) * 1.2) hurtPlayer(dmgFrom(c, 0.7), sp.cause, c.x);
          }
        } else if (edible && (adx < P.h * 5 || c.fleeT > 0)) { c.face = -dirP; c.vx = c.face * spd * 1.3; }
        else if (big && adx < vw * 0.8) {
          turnToward(c, dirP, dt, 0.15);
          if (adx > c.w * 0.45 + P.w * 0.3) { c.vx = c.face * spd * 1.2; if (sp.hop && c.onGround) { c.vy = -h * 4; c.onGround = false; } }
          else { c.vx = 0; if (c.cd <= 0) { c.state = 'atk'; c.t = 0.45; c.actT = c.actMax = 0.45; } }
        } else wander(c, dt, spd, 0.4, 0.5);
        break;
      }
      case 'ranged': {
        if (c.state === 'aim') {
          c.vx = 0; if (P) c.face = dirP;
          if (c.t <= 0) { if (P) fireAt(c, sp.shot); c.state = 'idle'; c.cd = rand(sp.rof[0], sp.rof[1]); }
        } else if (edible && adx < P.h * 5) { c.face = -dirP; c.vx = c.face * spd * 1.3; }
        else if (P && adx < vw * 0.85 && c.mass > P.mass * 0.06) {
          c.face = dirP;
          const pref = vw * 0.36;
          if (adx > pref * 1.2) c.vx = c.face * spd * 0.8;
          else if (adx < pref * 0.55 && big) c.vx = -c.face * spd * 0.7;
          else c.vx = 0;
          if (c.cd <= 0 && adx < vw * 0.7) { c.state = 'aim'; c.t = 0.4; c.actT = c.actMax = 0.6; }
        } else wander(c, dt, spd, 0.4, 0.5);
        break;
      }
    }
  }

  c.x += c.vx * dt;
  if (cityMode && !c.flying && c.vx) { // walls: most things turn around; hunters and bosses jump up
    const dir = sign(c.vx), fy = groundY(c.x + dir * c.w * 0.35);
    if (fy < c.y - c.h * 0.3) {
      c.x -= c.vx * dt;
      if ((c.boss || sp.ai === 'hunter') && c.onGround) { c.vy = -Math.sqrt(2 * G * h * (c.y - fy + h * 0.5)); c.onGround = false; }
      else if (c.onGround) { c.vx = -c.vx; c.face = -c.face; if (c.dir) c.dir = -c.dir; c.t = Math.max(c.t, 0.8); }
    }
  }
  if (roam()) { // parrots fly, bunnies hop, a pouncing lion arcs through the air
    if (sp.fly && c.stun <= 0) { c.z = lerp(c.z, c.h * sp.fly * (1 + 0.15 * Math.sin(realT * 3 + c.seed * 9)), Math.min(1, dt * 3)); c.vz = 0; }
    else {
      if (sp.hops && c.z <= 0 && Math.hypot(c.vx, c.vy) > c.h * 0.8 && Math.random() < dt * 4) c.vz = c.h * 6;
      c.vz -= G * c.h * dt; c.z = Math.max(0, c.z + c.vz * dt); if (c.z <= 0) c.vz = 0;
    }
  }
  if (c.swim) {
    c.y += c.vy * dt;
    if (spaceMode && !c.boss) pushOutOfPlanet(c);
    const gy = groundY(c.x);
    c.y = clamp(c.y, SURF + h * 0.6, gy);
    c.onGround = c.y >= gy - 1;
    if (c.sp.bottom) c.y = lerp(c.y, gy, Math.min(1, dt * 3));
  } else if (c.flying && (c.stun <= 0 || c.boss)) {
    c.y += c.vy * dt;
    const gy = groundY(c.x);
    if (c.y > gy) c.y = gy;
  } else if (!(c.boss && c.bdef.ai === 'kraken')) {
    const oy = c.y;
    c.vy += G * h * dt; c.y += c.vy * dt;
    const gy = houseMode ? floorAt(c.x, oy) : groundY(c.x);
    const plat = houseMode ? lastPlat : null;
    if (c.y >= gy && plat && plat.kind === 'bouncy' && c.vy > G * h * 0.12) { c.y = gy; c.vy = -c.vy * 0.7; c.onGround = false; }
    else if (c.y >= gy) {
      if (c.boss && !c.onGround && plat && plat.kind === 'keys') { [0, 4, 7, 11].forEach((k) => SFX.note(pianoKeyHz(k) / 2, 0.08)); addText(c.x, c.y - c.h, 'PLONK!', '#ffffff', 16); }
      c.y = gy; c.vy = 0; c.onGround = true;
    }
    else if (c.onGround && gy - c.y < h * 0.4 && c.vy >= 0) { c.y = gy; c.vy = 0; }
    else c.onGround = false;
  }
  c.phase += dt * (Math.abs(c.vx) / h) * 2.4;
  if (c.boss && P && adx > vw * 1.3 && c.bdef.ai !== 'kraken') { c.x = P.x - dirP * vw * 0.85; c.y = c.swim ? P.y : groundY(c.x); }
}
function updateAlly(c, dt, vw) {
  c.life -= dt;
  if (c.life <= 0) { c.alive = false; burst(c.x, c.y - c.h * 0.5, 14, ['#000', '#7affea'], c.h * 2, c.h * 0.2, { kind: 'smoke', grav: -0.1 }); return; }
  let tgt = null, bd = vw * 0.9;
  for (const o of creatures) { if (!o.alive || o.ally) continue; const d = Math.abs(o.x - c.x) + Math.abs(o.y - c.y) * 0.5; if (d < bd) { bd = d; tgt = o; } }
  const spd = c.sp.spd * c.h;
  if (tgt) {
    c.face = sign(tgt.x - c.x); c.vx = approach(c.vx, c.face * spd, spd * 4 * dt);
    if (c.onGround && (tgt.y < c.y - c.h || Math.random() < dt * 0.8)) { c.vy = -c.h * 8; c.onGround = false; }
    if (overlap(rectOf(c), rectOf(tgt))) {
      c.actT = c.actMax = 0.3;
      if (!tgt.boss && tgt.mass < c.mass * 1.4) { killCreature(tgt); stats.kills++; gain(0, ptsOf(tgt) * 0.5, tgt.x, tgt.y - tgt.h); }
      else damageCreature(tgt, c.mass * 2 * dt, true);
    }
  } else { const P = player; c.face = sign(P.x - c.x); c.vx = approach(c.vx, Math.abs(P.x - c.x) > P.w ? c.face * spd : 0, spd * 3 * dt); }
  c.x += c.vx * dt;
  c.vy += G * c.h * dt; c.y += c.vy * dt;
  const gy = groundY(c.x);
  if (c.y >= gy) { c.y = gy; c.vy = 0; c.onGround = true; } else c.onGround = false;
  c.phase += dt * (Math.abs(c.vx) / c.h) * 2.4;
}

// ============================================================ events & hazards
function spawnHazard(tx, kind = ERA.hazard) {
  const vh = cam.viewH;
  let ty = groundY(tx);
  let T = kind === 'bolt' ? 1.2 : 1.5;
  let sx = tx + rand(-1, 1) * vh * 0.8, sy = ty - vh * 1.4;
  if (kind === 'bolt') { sx = tx; sy = ty - vh * 2; }
  if (kind === 'block') { ty = houseMode ? floorAt(tx, player && player.active ? player.y - player.h : 0) : ty; sx = tx + rand(-1, 1) * vh * 0.2; sy = ty - vh * 1.4; T = 1.4; }
  if (kind === 'comet') {
    const P = player && player.active ? player : cam;
    tx = P.x + rand(-1, 1) * vh * 0.45; ty = P.y + rand(-1, 1) * vh * 0.35;
    const a = rand(Math.PI * 2); sx = tx + Math.cos(a) * vh * 1.3; sy = ty + Math.sin(a) * vh * 1.3; T = 1.7;
  }
  if (kind === 'gift') { ty = clamp((player && player.active ? player.y : SURF * 0.5) + rand(-1, 1) * vh * 0.3, SURF + 40, -10); sx = tx; sy = ty - vh * 1.4; }
  if (kind === 'charge') { sx = tx; sy = SURF; T = 2.4; if (player && player.active) ty = clamp(player.y - player.h * 0.5 + rand(-1, 1) * player.h, SURF + 80, groundY(tx)); }
  const r = Math.max(30, (player && player.active ? player.h : 40) * (kind === 'bolt' ? 1.1 : kind === 'block' ? 0.9 : 1.45));
  meteors.push({ x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy) / T, tx, ty, r, t: T, T, kind });
  if (kind === 'bolt') SFX.blip(); else if (kind !== 'charge') SFX.whistle();
  meteors[meteors.length - 1].seed = Math.random();
}
function hazardColors(kind) {
  return { meteor: ['#ff7a1a', '#ffd23a', '#ff3b1a', '#3a2a20', '#6a5a50'], goo: GOO, charge: ['#ffd27a', '#ffffff', '#5a6a80'], gift: CONFETTI, block: CONFETTI, comet: ['#ff8a3a', '#ffe066', '#ffffff', '#ff5ad8'], shell: ['#ffffff', '#bbbbbb', '#666666', '#222222'] }[kind];
}
function meteorImpact(m) {
  const R = m.r * 1.35;
  SFX.boom(); shake(m.kind === 'gift' ? 10 : 16);
  if (m.kind === 'goo') SFX.squish();
  ring(m.tx, m.ty, m.r * 0.3, R * 1.3, m.kind === 'goo' ? '#7dff6a' : m.kind === 'gift' || m.kind === 'block' ? '#ff5ad8' : m.kind === 'comet' ? '#ffe066' : m.kind === 'shell' ? '#ffffff' : '#ffd27a', 0.5, 8);
  burst(m.tx, m.ty, 50, hazardColors(m.kind), R * 4, m.r * 0.14, { angle: -Math.PI / 2, spread: m.kind === 'charge' ? Math.PI : 1.4, up: swim() ? 0 : R * 2, life: 1.1 });
  if (m.kind === 'meteor' || m.kind === 'shell') burst(m.tx, m.ty - m.r * 0.5, 18, m.kind === 'shell' ? ['#e8e8e8', '#9a9a9a', '#4a4a4a'] : ['#5a4a40', '#7a6a60', '#2a2420'], R * 1.2, m.r * 0.35, { grav: -0.15, life: 1.6, kind: 'smoke' });
  if (m.kind === 'gift') { addText(m.tx, m.ty - m.r, pick(['SURPRISE!', 'TA-DA!', 'FOR YOU!']), '#ff5ad8', 13, 0.9); if (Math.random() < 0.5) makeCreature('chick', Math.max(0.5, (player && player.active ? player.mass : 2) * 0.3), m.tx, { gold: true, y: m.ty }); }
  if (m.kind === 'charge') for (let i = 0; i < 12; i++) particles.push({ kind: 'bubble', x: m.tx + rand(-1, 1) * R, y: m.ty + rand(-1, 1) * R, vx: rand(-20, 20), vy: -R * rand(1, 3), life: 2, max: 2, size: m.r * rand(0.05, 0.15), grav: 0, color: '#fff' });
  if (!swim() && !houseMode) scorches.push({ x: m.tx, r: R * 1.1, life: 12, color: m.kind === 'goo' ? 'rgba(120,255,100,' : 'rgba(20,10,5,' });
  for (const c of creatures) {
    if (!c.alive || c.boss || c.ally) continue;
    const d = Math.hypot(c.x - m.tx, (c.y - c.h * 0.5) - m.ty);
    if (d < R + c.w * 0.3) {
      if (c.mass < (player && player.active ? player.mass : 10) * 3 || d < R * 0.6) killCreature(c, m.kind === 'meteor');
      else { c.hp -= c.maxHp * 0.4; c.stun = 1.5; c.flash = 0.2; if (c.hp <= 0) killCreature(c, true); }
    }
  }
  const p = player;
  if (p && p.active && !p.dead) {
    const d = roam() ? Math.hypot(p.x - m.tx, p.y - m.ty) + p.z : Math.hypot(p.x - m.tx, (p.y - p.h * 0.5) - m.ty);
    if (d < R + p.w * 0.25) {
      if (form().final) { addText(p.x, p.y - p.h * 1.3, 'IMMUNE!', THEME.accent, 16, 1); if (roam()) p.vz = p.h * 6; else if (!swim()) { p.vy = -p.h * 6; p.onGround = false; } }
      else hurtPlayer(26 * cycleMul(), { meteor: "METEOR'D", goo: 'DROWNED IN GOO', charge: 'DEPTH-CHARGED', gift: 'FLATTENED BY A PRESENT', block: 'BONKED BY A TOY BLOCK', comet: 'HIT BY A COMET', shell: 'SHELLED BY THE ARMY' }[m.kind], m.tx);
    }
  }
}
function startEvent() {
  const p = player;
  const options = ERA.events.filter((e) => e.name !== lastEvent);
  const ev = pick(options);
  lastEvent = ev.name;
  const vw = viewW();
  event = { t: ev.t, time: ev.t === 'hazard' ? 13 : ev.t === 'frenzy' ? 10 : 8, mt: 0, name: ev.name };
  showBanner(ev.name, ev.color, 2.5, ev.sub || '');
  if (ev.t === 'hazard' || ev.t === 'raid' || ev.t === 'stampede') SFX.alarm();
  if (ev.t === 'stampede') {
    const side = sign(rand(-1, 1));
    banner.sub = side > 0 ? '<<< incoming from the right' : 'incoming from the left >>>';
    for (let i = 0; i < 9; i++) {
      const c = makeCreature(ev.sp, Math.max(1.2, p.mass * rand(0.4, 1.8)), p.x + side * (vw * 0.75 + i * p.h * 2.6), swim() ? { y: clamp(p.y - p.h * 0.5 + rand(-2, 2) * p.h, SURF + 60, groundY(p.x) - 20) } : {});
      c.state = 'stampede'; c.face = -side;
    }
  }
  if (ev.t === 'frenzy') {
    SFX.gold();
    for (let i = 0; i < 12; i++) makeCreature(ERA.golden, Math.max(0.5, p.mass * rand(0.2, 0.5)), p.x + sign(rand(-1, 1)) * rand(vw * 0.25, vw * 0.9), { gold: true });
  }
  if (ev.t === 'raid') {
    for (let i = 0; i < ev.n; i++) {
      const c = makeCreature(pick(ev.sp), Math.max(1.2, p.mass * rand(0.6, 1.6)), p.x + sign(rand(-1, 1)) * rand(vw * 0.5, vw * 0.95), { angry: true });
      c.cd = rand(0.5, 3);
    }
  }
}
function updateEvents(dt) {
  const p = player;
  if (!p.active) return;
  if (bossT > 0) { bossT -= dt; if (bossT <= 0 && !boss) spawnBoss(); }
  if (clearT > 0) { clearT -= dt; if (clearT <= 0) startWarp(); }
  if (event) {
    event.time -= dt;
    if (event.t === 'hazard') {
      event.mt -= dt;
      if (event.mt <= 0) { event.mt = rand(0.35, 0.75); spawnHazard(p.x + p.vx * 1.2 + rand(-1, 1) * viewW() * 0.55); }
    }
    if (event.time <= 0) { event = null; eventT = rand(28, 40); }
  } else if (!boss && clearT <= 0) {
    eventT -= dt;
    if (eventT <= 0) startEvent();
  }
  if (eraT > 50 && clearT <= 0) {
    meteorRandT -= dt;
    if (meteorRandT <= 0) { meteorRandT = rand(6, 14) / (1 + eraT / 300); spawnHazard(p.x + rand(-1, 1) * viewW() * 0.6); }
  }
  SFX.setIntensity(event || boss ? 1 : p.belly < 25 ? 0.7 : 0.2);
}

// ============================================================ main update
const HINTS = [
  'eat anything smaller than you  ▼',
  'bigger things?  POUNCE [SHIFT] to bite, then back off',
  'downed beasts leave a feast — stand on it to munch',
  'evolve into the final form to face this world\'s boss',
];
function update(dt, inp) {
  if (inp.muteP) SFX.toggleMute();
  if (state === 'title') {
    if (inp.leftP || inp.rightP) { titleEra = (titleEra + (inp.rightP ? 1 : -1) + ERAS.length) % ERAS.length; SFX.blip(); startTitle(); return; }
    const L = titleLayout(), hit = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    const over = [L.start, L.tut, ...L.cards].some((r) => hit(r, mouseX, mouseY));
    cvs.style.cursor = over ? 'pointer' : 'default';
    for (const [x, y] of uiClicks.splice(0)) {
      const card = L.cards.find((r) => hit(r, x, y));
      if (card && card.i !== titleEra) { titleEra = card.i; SFX.blip(); startTitle(); return; }
      if (hit(L.start, x, y)) { cvs.style.cursor = ''; startGame(titleEra); return; }
      if (hit(L.tut, x, y)) { cvs.style.cursor = ''; startTutorial(); return; }
    }
    if (inp.startKeyP) { cvs.style.cursor = ''; startGame(titleEra); return; }
    if (inp.tutP) { cvs.style.cursor = ''; startTutorial(); return; }
    cam.x += 70 * dt;
    if (Math.random() < dt * 0.12) spawnHazard(cam.x + rand(-200, 400));
  }
  uiClicks.length = Math.min(uiClicks.length, 4);
  if (state === 'paused') { if (inp.pauseP || inp.startP) state = 'play'; return; }
  if (state === 'play' && tut && inp.pauseP) { startTitle(); return; } // ESC leaves the tutorial
  if (state === 'play' && inp.pauseP) { state = 'paused'; return; }
  if (state === 'dead') { deadT += dt; if (deadT > 0.8 && inp.startP) { tut = null; titleEra = clamp(eraIdx, 0, ERAS.length - 1); startTitle(); } return; }
  if (state === 'victory') { victoryT += dt; if (victoryT > 1.5 && inp.startP) { cycle++; loadEra(0, true); state = 'warp'; warpT = 1; warped = true; warpFirst = true; } return; }
  if (state === 'warp') { updateWarp(dt); if (state === 'warp' && warped && warpT < 3.2) return; }

  if (freeze > 0) { freeze -= dt; return; }
  let sdt = dt;
  if (slowmo > 0) { slowmo -= dt; sdt *= 0.3; }
  if (state === 'dying') { deadT += dt; if (deadT > 1.8) { state = 'dead'; deadT = 0; } }

  if (state === 'play' || state === 'dying' || state === 'warp') {
    gameT += sdt; eraT += sdt;
    updatePlayer(sdt, state === 'play' || (state === 'warp' && warped) ? inp : {});
    if (state === 'play' && tut) updateTutorial(sdt, inp);
    if (state === 'play' && !tut) {
      updateEvents(sdt);
      const p = player;
      if (p.form < ERA.forms.length - 1 && p.mass >= ERA.at[p.form + 1]) evolve();
    }
    if (state === 'play' && tut && player.form < 1 && player.mass >= ERA.at[1]) evolve();
    if (state === 'play' && !tut) {
      if (eraIdx === 0 && cycle === 1 && eraT > 8 && eraT < 40 && (!hint || hint.t <= 0) && hintIdx < HINTS.length) hint = { text: HINTS[hintIdx++], t: 7 };
    }
  }
  if (hint) hint.t -= dt;
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }

  if (state !== 'warp' && !tut) updateSpawning(sdt);
  const fx = focusX(), vw = viewW();
  for (const c of creatures) if (c.alive) updateCreature(c, sdt);
  const fyy = player && player.active ? player.y : cam.y;
  creatures = creatures.filter((c) => c.alive && (c.boss || c.ally || (openMode ? Math.hypot(c.x - fx, c.y - fyy) < vw * 2 : Math.abs(c.x - fx) < vw * 2.4)));
  if (boss && !boss.alive) boss = null;
  corpses = corpses.filter((co) => { co.life -= sdt; return co.meat > 0 && co.life > 0 && Math.abs(co.x - fx) < vw * 3; });
  for (const co of corpses) {
    if (co.yo < 0) co.yo = Math.min(0, co.yo + co.h * 8 * sdt);
    if (co.sinks) { co.y = Math.min(groundY(co.x), co.y + co.h * 0.8 * sdt); }
    if (co.metal && Math.random() < sdt * 3) burst(co.x + rand(-0.3, 0.3) * co.w, co.y - co.h * 0.5, 1, water() ? ['#ffffff'] : ['#4a4a4a', '#6a6a6a'], co.h * 0.4, co.h * 0.2, { grav: -0.08, kind: water() ? 'sq' : 'smoke', life: 1.2 });
  }
  scorches = scorches.filter((s) => (s.life -= sdt) > 0);
  updateProjectiles(sdt);

  for (const m of meteors) {
    m.t -= sdt; m.x += m.vx * sdt; m.y += m.vy * sdt;
    if (m.kind !== 'gift' && m.kind !== 'block' && Math.random() < 0.9) {
      if (m.kind === 'charge') { if (Math.random() < 0.4) particles.push({ kind: 'bubble', x: m.x, y: m.y - m.r * 0.3, vx: rand(-10, 10), vy: -m.r * 2, life: 1.5, max: 1.5, size: m.r * 0.06, grav: 0, color: '#fff' }); }
      else burst(m.x + rand(-1, 1) * m.r * 0.15, m.y, 2, hazardColors(m.kind), m.r * 0.5, m.r * 0.16, { grav: 0, life: 0.5 });
    }
    if (m.t <= 0) { meteorImpact(m); m.done = true; }
  }
  meteors = meteors.filter((m) => !m.done);

  for (const pa of particles) {
    pa.life -= sdt;
    if (pa.kind === 'ring' || pa.kind === 'beamcol' || pa.kind === 'bolt') continue;
    if (pa.kind === 'suck') { const k = Math.min(1, sdt * 7); pa.x = lerp(pa.x, pa.tx, k); pa.y = lerp(pa.y, pa.ty, k); continue; }
    if (pa.kind === 'bubble') { pa.x += Math.sin(realT * 3 + pa.y * 0.05) * 10 * sdt + pa.vx * sdt; pa.y += pa.vy * sdt; if (pa.y < SURF) pa.life = 0; continue; }
    const g = (player ? player.h : 40) * 30 * pa.grav;
    pa.vy += g * sdt; pa.x += pa.vx * sdt; pa.y += pa.vy * sdt;
    if (swim()) { pa.vx *= 0.96; pa.vy *= 0.96; }
    if (pa.kind === 'smoke') { pa.vx *= 0.97; pa.vy *= 0.97; pa.size *= 1 + sdt * 0.8; }
    if (pa.kind === 'sq' && pa.grav > 0.5) { const gy = groundY(pa.x); if (pa.y > gy) { pa.y = gy; pa.vy *= -0.3; pa.vx *= 0.6; } }
  }
  particles = particles.filter((pa) => pa.life > 0);
  for (const t of texts) { t.life -= dt; t.oy = (t.oy || 0) + t.vy * dt; } // floats up the screen, whatever way the camera faces
  texts = texts.filter((t) => t.life > 0);

  let tx, ty, tvh;
  if (player.active) {
    const p = player;
    tvh = Math.max(p.h * 7.2, 230) * (boss ? 1.15 : 1);
    tx = p.x + p.face * viewW() * 0.1 + p.vx * 0.25;
    if (orbitMode) { tx = p.x + p.vx * 0.35; ty = p.y + p.vy * 0.35; }
    else if (spaceMode) {
      const ux = Math.cos(p.upA), uy = Math.sin(p.upA);
      tx = p.x + ux * p.h * 1.2 + p.vx * 0.2; ty = p.y + uy * p.h * 1.2 + p.vy * 0.2;
      cam.rot += angDiff(-Math.PI / 2 - p.upA, cam.rot) * Math.min(1, dt * 4);
    } else if (swim()) ty = clamp(p.y - p.h * 0.4 + p.vy * 0.15, SURF + cam.viewH * 0.1, groundY(p.x) - cam.viewH * 0.3);
    else ty = Math.min(p.y - p.h * 1.6, groundY(p.x) - cam.viewH * 0.22);
    // during the Kraken fight, lean toward the seabed — but never so far that the player leaves the screen
    if (boss && boss.bdef.ai === 'kraken') ty = Math.min(lerp(ty, Math.max(ty, groundY(p.x) - cam.viewH * 0.32), 0.6), p.y - p.h * 0.5 + cam.viewH * 0.3);
  } else { tvh = 420; tx = cam.x; ty = openMode ? cam.y : swim() ? groundY(cam.x) - 260 : groundY(cam.x) - 150; }
  if (H > W) tvh *= 1.25;
  cam.viewH = lerp(cam.viewH, tvh, Math.min(1, dt * 1.5));
  cam.zoom = H / cam.viewH;
  cam.x = lerp(cam.x, tx, Math.min(1, dt * 5));
  cam.y = lerp(cam.y, ty, Math.min(1, dt * 4));
  bgFar += (cam.x - prevCamX) * cam.zoom * 0.08;
  bgMid += (cam.x - prevCamX) * cam.zoom * 0.28;
  prevCamX = cam.x;
  cam.shake = Math.max(0, cam.shake - dt * 40);
  flash = Math.max(0, flash - dt);
}

// ============================================================ rendering: backgrounds (one per world)
function silhouette(color, off, fn, step = 6, stroke) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let sx = 0; sx <= W + step; sx += step) ctx.lineTo(sx, fn(sx + off));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke[0]; ctx.lineWidth = stroke[1]; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function skyGrad(c0, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(0.85, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function doomLevel() {
  const doom = event && event.t === 'hazard' ? 1 : boss ? 0.45 : 0;
  skyDoom = lerp(skyDoom, doom, 0.02);
  return skyDoom;
}
const toScreen = (x, y) => {
  const dx = (x - cam.x) * cam.zoom, dy = (y - cam.y) * cam.zoom;
  if (!cam.rot) return [dx + W / 2, dy + H / 2];
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  return [c * dx - s * dy + W / 2, s * dx + c * dy + H / 2];
};
function drawBackground() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true;
  const T = THEME, hz = H * 0.62, dm = doomLevel();
  switch (ERA.theme) {
    case 'jungle': {
      const dusk = (Math.sin(realT / 40) + 1) / 2 * 0.7;
      const cols = [0, 1, 2].map((i) => lerpColor(lerpColor(T.sky[i], T.dusk[i], dusk), T.doom[i], dm * 0.85));
      skyGrad(...cols);
      const sunY = H * 0.28 + Math.sin(realT / 40) * H * 0.08;
      ctx.fillStyle = 'rgba(255,240,200,0.22)'; ctx.beginPath(); ctx.arc(W * 0.72, sunY, H * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = dm > 0.5 ? '#ffb070' : '#fff4d0'; ctx.beginPath(); ctx.arc(W * 0.72, sunY, H * 0.07, 0, Math.PI * 2); ctx.fill();
      const farCol = lerpColor(T.far, T.farDoom, dm);
      silhouette(farCol, bgFar, (u) => {
        let y = hz - 60 - Math.sin(u * 0.004) * 40 - Math.sin(u * 0.0013 + 1) * 70 - Math.sin(u * 0.011) * 10;
        const cell = Math.floor(u / 700), cx = cell * 700 + 350, d = Math.abs(u - cx);
        if (hash(cell) < 0.55 && d < 220) y = Math.min(y, hz - 230 + d * 0.9 + (d < 40 ? 20 : 0));
        return Math.round(y / 3) * 3;
      });
      for (let cell = Math.floor(bgFar / 700) - 1; cell <= Math.floor((bgFar + W) / 700) + 1; cell++) {
        if (hash(cell) >= 0.55) continue;
        const sx = cell * 700 + 350 - bgFar, sy = hz - 215;
        ctx.fillStyle = `rgba(255,${(120 + dm * 40) | 0},40,${0.55 + Math.sin(realT * 3 + cell) * 0.2})`; ctx.fillRect(sx - 30, sy - 4, 60, 8);
        for (let i = 0; i < 5; i++) { const tt = (realT * 0.15 + i / 5 + hash(cell + i)) % 1; ctx.fillStyle = `rgba(${(60 + dm * 40) | 0},50,55,${0.35 * (1 - tt)})`; ctx.beginPath(); ctx.arc(sx + Math.sin(tt * 4 + i) * 20 + tt * 60, sy - tt * 200, 18 + tt * 50, 0, Math.PI * 2); ctx.fill(); }
      }
      const midCol = lerpColor(T.mid, '#3a2020', dm * 0.6);
      const midY = (u) => Math.round((hz + 10 - Math.sin(u * 0.003 + 2) * 35 - Math.sin(u * 0.009) * 12) / 3) * 3;
      silhouette(midCol, bgMid, midY);
      for (let cell = Math.floor(bgMid / 90) - 1; cell <= Math.floor((bgMid + W) / 90) + 1; cell++) {
        if (hash(cell * 3.1) > 0.5) continue;
        const u = cell * 90 + hash(cell) * 40;
        drawPalm(u - bgMid, midY(u) + 4, 60 + hash(cell + 9) * 70, hash(cell + 2) - 0.5, midCol, midCol, 1);
      }
      break;
    }
    case 'goo': {
      skyGrad(...[0, 1, 2].map((i) => lerpColor(T.sky[i], T.doom[i], dm * 0.6)));
      for (let i = 0; i < 70; i++) { const x = ((hash(i) * W * 1.4 - bgFar * 0.15) % W + W) % W, y = hash(i + 40) * H * 0.55, s = 1 + hash(i + 7) * 3; ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.abs(Math.sin(realT * 2 + i))})`; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); }
      const sp = IMG.goo_space1;
      if (sp && sp.width) { ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.8; const s = H * 0.7 / sp.height, w = sp.width * s, off = ((bgFar * 0.4) % w + w) % w; for (let x = -off; x < W; x += w) ctx.drawImage(sp, x, H * 0.02, w, H * 0.7); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      // giant ringed planet
      const px = W * 0.78, py = H * 0.24, pr = H * 0.13;
      ctx.lineWidth = Math.max(4, H * 0.008); ctx.strokeStyle = T.outline;
      const pg = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
      pg.addColorStop(0, '#ffe08a'); pg.addColorStop(1, '#ff8a3a');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5ad8ff'; ctx.lineWidth = pr * 0.12; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.7, pr * 0.35, -0.25, Math.PI * 0.05, Math.PI * 0.95, true); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(px - pr * 0.45, py - pr * 0.45, pr * 0.22, pr * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
      const bump = (u, base, a, f) => base - Math.abs(Math.sin(u * f)) * a - Math.abs(Math.sin(u * f * 2.3 + 1)) * a * 0.4;
      silhouette(lerpColor(T.far, '#2a5a2a', dm * 0.4), bgFar, (u) => bump(u, hz - 40, 110, 0.0045), 5, [T.outline, Math.max(4, H * 0.008)]);
      silhouette(lerpColor(T.mid, '#3a8a3a', dm * 0.4), bgMid, (u) => bump(u, hz + 30, 70, 0.007), 5, [T.outline, Math.max(4, H * 0.008)]);
      for (let cell = Math.floor(bgMid / 160) - 1; cell <= Math.floor((bgMid + W) / 160) + 1; cell++) {
        if (hash(cell * 2.3) > 0.45) continue;
        const sx = cell * 160 + hash(cell) * 80 - bgMid, by = bump(cell * 160 + hash(cell) * 80, hz + 30, 70, 0.007) + 6, hh = 50 + hash(cell + 3) * 70;
        drawMushroom(sx, by, hh, ['#ff5aa0', '#5ad8ff', '#ffe066', '#b46aff'][Math.floor(hash(cell + 5) * 4)], T.outline, Math.max(3, H * 0.006));
      }
      break;
    }
    case 'deep': {
      // water column colour depends on how deep the camera is
      const topY = cam.y - cam.viewH / 2, botY = cam.y + cam.viewH / 2;
      const depthCol = (y) => { const k = clamp((y - SURF) / (T.depth * 1.1), 0, 1); return k < 0.33 ? lerpColor(T.water[0], T.water[1], k / 0.33) : k < 0.66 ? lerpColor(T.water[1], T.water[2], (k - 0.33) / 0.33) : lerpColor(T.water[2], T.water[3], (k - 0.66) / 0.34); };
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, depthCol(topY)); g.addColorStop(1, depthCol(botY));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const [, sy] = toScreen(0, SURF);
      if (sy > -10) {
        const sg = ctx.createLinearGradient(0, 0, 0, Math.max(1, sy)); sg.addColorStop(0, T.sky[0]); sg.addColorStop(1, T.sky[1]);
        ctx.fillStyle = sg; ctx.fillRect(0, 0, W, Math.max(0, sy));
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < 6; i++) { const cx = ((hash(i) * W * 1.5 - bgFar * 0.3) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1, cy = sy * (0.2 + hash(i + 3) * 0.5); ctx.beginPath(); ctx.ellipse(cx, cy, 60, 18, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      const lightA = clamp(1 - (cam.y - SURF) / (T.depth * 0.8), 0, 1);
      const li = IMG.deep_light;
      if (li && li.width && lightA > 0.02) {
        ctx.globalAlpha = 0.35 * lightA; const lw = W * 0.5, lh = lw * li.height / li.width;
        for (let k = -1; k < 3; k++) { const x = ((k * lw * 0.9 - bgFar * 0.3) % (W + lw) + W + lw) % (W + lw) - lw; ctx.drawImage(li, x, Math.max(sy, 0) - lh * 0.1, lw, lh); }
        ctx.globalAlpha = 1;
      }
      // Atlantis parallax layers anchored to the sea floor
      const [, floorY] = toScreen(0, 0);
      const layer = (key, par, alpha, scale, yoff) => {
        const im = IMG[key]; if (!im || !im.width) return;
        const h = H * scale, w = im.width * h / im.height, off = ((bgMid * par) % w + w) % w;
        const y = Math.min(H - h * 0.45, H - h * 0.85 + (floorY - H * 0.85) * (0.25 + par * 0.5) + yoff * H);
        ctx.globalAlpha = alpha;
        for (let x = -off; x < W; x += w) ctx.drawImage(im, x, y, w, h);
        ctx.globalAlpha = 1;
      };
      layer('deep_bg_far', 0.15, 0.35, 0.42, 0.05);
      const tm = IMG.deep_temple;
      if (tm && tm.width) { const h = H * 0.45, w = tm.width * h / tm.height, x = W * 0.5 - ((bgMid * 0.25) % (W * 3)) + W, y = Math.min(H - h * 0.5, H - h + (floorY - H * 0.85) * 0.3); ctx.globalAlpha = 0.3; ctx.drawImage(tm, x, y, w, h); ctx.globalAlpha = 1; }
      layer('deep_bg_mid', 0.3, 0.55, 0.22, 0.04);
      layer('deep_bg_near', 0.5, 0.75, 0.28, 0.03);
      const fog = ctx.createLinearGradient(0, 0, 0, H); fog.addColorStop(0, 'rgba(10,30,54,0)'); fog.addColorStop(1, 'rgba(4,12,24,0.35)');
      ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'house': {
      const par = 0.45, z = cam.zoom * par;
      const sx = (wx) => W / 2 + (wx - cam.x * 0.6) * z, sy = (wy) => H / 2 + (wy - cam.y) * z;
      ctx.fillStyle = '#f7dfc2'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f2d2ae'; // wallpaper stripes
      const sw = 90 * z, off = ((sx(0) % (sw * 2)) + sw * 2) % (sw * 2);
      for (let x = off - sw * 2; x < W; x += sw * 2) ctx.fillRect(x, 0, sw, H);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (let x = off - sw * 2; x < W; x += sw) for (let y = ((sy(0) % (sw * 1.6)) + sw * 1.6) % (sw * 1.6) - sw * 1.6; y < H; y += sw * 1.6) { ctx.beginPath(); ctx.arc(x + sw * 0.5, y, Math.max(1.5, sw * 0.08), 0, Math.PI * 2); ctx.fill(); }
      const c0 = Math.floor((cam.x * 0.6 - W / z) / 1400) - 1, c1 = Math.floor((cam.x * 0.6 + W / z) / 1400) + 1;
      for (let i = c0; i <= c1; i++) { // windows, picture frames, a clock
        const r = hash(i * 2.3 + 7), bx = i * 1400 + 200;
        if (r < 0.4) {
          const x0 = sx(bx), y0 = sy(-1500), w = 600 * z, h = 800 * z;
          const sg = ctx.createLinearGradient(0, y0, 0, y0 + h); sg.addColorStop(0, '#7fc8ff'); sg.addColorStop(1, '#d8f0ff');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 - 16 * z, y0 - 16 * z, w + 32 * z, h + 32 * z);
          ctx.fillStyle = sg; ctx.fillRect(x0, y0, w, h);
          ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(x0 + w * 0.72, y0 + h * 0.25, 60 * z, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff'; for (const [cx, cy] of [[0.25, 0.3], [0.5, 0.55]]) { ctx.beginPath(); ctx.ellipse(x0 + w * cx, y0 + h * cy, 70 * z, 24 * z, 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = '#7cc46a'; ctx.beginPath(); ctx.ellipse(x0 + w * 0.5, y0 + h, w * 0.6, h * 0.18, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + w / 2 - 6 * z, y0, 12 * z, h); ctx.fillRect(x0, y0 + h / 2 - 6 * z, w, 12 * z);
          ctx.fillStyle = '#e8708a'; // curtains
          for (const s of [-1, 1]) { ctx.beginPath(); const cx = s < 0 ? x0 - 30 * z : x0 + w + 30 * z; ctx.moveTo(cx, y0 - 40 * z); ctx.quadraticCurveTo(cx + s * -120 * z, y0 + h * 0.4, cx + s * -40 * z, y0 + h + 60 * z); ctx.lineTo(cx + s * 60 * z, y0 + h + 60 * z); ctx.lineTo(cx + s * 60 * z, y0 - 40 * z); ctx.fill(); }
        } else if (r < 0.75) {
          const x0 = sx(bx + 100), y0 = sy(-1300 - hash(i) * 300), w = (260 + hash(i + 1) * 160) * z, h = (200 + hash(i + 2) * 140) * z;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 - 10 * z, y0 - 10 * z, w + 20 * z, h + 20 * z);
          ctx.fillStyle = ['#c89058', '#8a6a9a', '#5a8a7a'][Math.floor(hash(i + 3) * 3)]; ctx.fillRect(x0, y0, w, h);
          ctx.fillStyle = '#f8f0e0'; ctx.fillRect(x0 + 14 * z, y0 + 14 * z, w - 28 * z, h - 28 * z);
          ctx.fillStyle = ['#ff9a7a', '#7ab8e8', '#9ad07a'][Math.floor(hash(i + 4) * 3)]; ctx.beginPath(); ctx.moveTo(x0 + 14 * z, y0 + h - 14 * z); ctx.lineTo(x0 + w * 0.45, y0 + h * 0.4); ctx.lineTo(x0 + w * 0.7, y0 + h * 0.65); ctx.lineTo(x0 + w - 14 * z, y0 + h * 0.35); ctx.lineTo(x0 + w - 14 * z, y0 + h - 14 * z); ctx.fill();
        } else {
          const cx = sx(bx + 300), cy = sy(-1600), R = 110 * z;
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff9a7a'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#4a3a3a'; ctx.lineCap = 'round';
          const tm = Date.now() / 1000;
          ctx.lineWidth = 8 * z; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(tm / 600) * R * 0.45, cy - Math.cos(tm / 600) * R * 0.45); ctx.stroke();
          ctx.lineWidth = 5 * z; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(tm / 10) * R * 0.7, cy - Math.cos(tm / 10) * R * 0.7); ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, sy(-120), W, 120 * z + 2); // baseboard
      ctx.fillStyle = '#e8d2b8'; ctx.fillRect(0, sy(-30), W, 30 * z + 2);
      { const fg = ctx.createLinearGradient(0, sy(0), 0, H); fg.addColorStop(0, '#9a6438'); fg.addColorStop(1, '#c08452'); ctx.fillStyle = fg; ctx.fillRect(0, sy(0), W, H); } // far floor
      break;
    }
    case 'sol': ctx.fillStyle = '#020308'; ctx.fillRect(0, 0, W, H); break; // three.js draws the real sky
    case 'neon': {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
      g.addColorStop(0, '#140a30'); g.addColorStop(1, '#030209');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const cr = Math.cos(cam.rot), sr = Math.sin(cam.rot), D = Math.max(W, H) * 1.6;
      const put = (px, py) => [W / 2 + cr * px - sr * py, H / 2 + sr * px + cr * py];
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) { // nebulae
        const ox = ((hash(k) * D - cam.x * 0.03 * cam.zoom) % D + D) % D - D / 2, oy = ((hash(k + 4) * D - cam.y * 0.03 * cam.zoom) % D + D) % D - D / 2;
        const [x, y] = put(ox, oy), r = D * (0.18 + hash(k + 8) * 0.12);
        const ng = ctx.createRadialGradient(x, y, 0, x, y, r);
        ng.addColorStop(0, ['rgba(255,58,240,0.16)', 'rgba(58,255,216,0.12)', 'rgba(120,80,255,0.16)', 'rgba(255,138,58,0.1)'][k]); ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let layer = 0; layer < 3; layer++) { // parallax starfield
        const par = [0.04, 0.1, 0.22][layer], n = [90, 60, 35][layer], sz = [1, 1.6, 2.4][layer];
        for (let i = 0; i < n; i++) {
          const ox = ((hash(i * 3.1 + layer * 50) * D - cam.x * par * cam.zoom) % D + D) % D - D / 2, oy = ((hash(i * 7.7 + layer * 90) * D - cam.y * par * cam.zoom) % D + D) % D - D / 2;
          const [x, y] = put(ox, oy);
          if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
          ctx.fillStyle = `rgba(${layer === 2 ? '200,255,250' : '255,255,255'},${0.35 + 0.55 * Math.abs(Math.sin(realT * (1 + hash(i)) + i))})`;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }
      // a distant wireframe gas giant
      { const ox = ((1300 - cam.x * 0.06 * cam.zoom) % D + D) % D - D / 2, oy = ((-500 - cam.y * 0.06 * cam.zoom) % D + D) % D - D / 2; const [x, y] = put(ox, oy), r = H * 0.22;
        ctx.strokeStyle = 'rgba(180,106,255,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x, y, r * Math.abs(Math.cos(realT * 0.1 + k * 0.5)), r, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,90,216,0.4)'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.35, -0.3, 0, Math.PI * 2); ctx.stroke(); }
      if ((realT * 0.37) % 1 < 0.04) { const a = hash(Math.floor(realT * 0.37)) * Math.PI * 2, x = W * hash(Math.floor(realT * 0.37) + 3), y = H * 0.3 * hash(Math.floor(realT * 0.37) + 7), k = ((realT * 0.37) % 1) / 0.04; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * k * 300, y + Math.sin(a) * k * 300); ctx.lineTo(x + Math.cos(a) * (k * 300 - 120), y + Math.sin(a) * (k * 300 - 120)); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'cube': { // only seen if WebGL is unavailable: a flat, sunny lawn
      ctx.fillStyle = '#7ee06a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#90ec78';
      const s = 200 * cam.zoom, off = ((-cam.x * cam.zoom) % (s * 2) + s * 2) % (s * 2);
      for (let x = off - s * 2; x < W; x += s * 2) ctx.fillRect(x, 0, s, H);
      const [, ty] = toScreen(0, SURF);
      if (ty > 0) { skyGrad(...T.sky); ctx.fillStyle = '#3fb04a'; ctx.fillRect(0, ty - 30, W, H); ctx.fillStyle = '#7ee06a'; ctx.fillRect(0, ty, W, H); }
      break;
    }
    case 'film': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#08080c'); g.addColorStop(0.65, '#34343a'); g.addColorStop(1, '#55555c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 80; i++) { const x = ((hash(i) * W * 1.4 - bgFar * 0.05) % W + W) % W, y = hash(i + 40) * H * 0.55; if (Math.sin(realT * 3 + i * 7) > -0.7) ctx.fillRect(x, y, 1.5, 1.5); }
      // moon
      const mx = W * 0.8, my = H * 0.18, mr = H * 0.085;
      const mg = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3); mg.addColorStop(0, 'rgba(255,255,240,0.35)'); mg.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
      ctx.fillStyle = '#ecece4'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,120,120,0.35)';
      [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.1, 0.35, 0.12], [0.35, -0.35, 0.1]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(mx + a * mr, my + b * mr, r * mr, 0, Math.PI * 2); ctx.fill(); });
      // a flying saucer, wobbling on its (visible) string
      const ux = ((realT * 28 + 300) % (W + 600)) - 300, uy = H * 0.3 + Math.sin(realT * 1.7) * H * 0.02, us = H * 0.045;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ux, 0); ctx.lineTo(ux, uy - us * 0.3); ctx.stroke();
      ctx.save(); ctx.translate(ux, uy); ctx.rotate(Math.sin(realT * 2.3) * 0.12);
      ctx.fillStyle = '#9a9a9a'; ctx.beginPath(); ctx.ellipse(0, 0, us, us * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.ellipse(0, -us * 0.12, us * 0.4, us * 0.32, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; for (let k = -2; k <= 2; k++) if ((Math.floor(realT * 6) + k) % 2) { ctx.beginPath(); ctx.arc(k * us * 0.35, us * 0.05, us * 0.06, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      // searchlights sweeping the sky
      for (let k = 0; k < 3; k++) {
        const bx = ((W * (0.2 + k * 0.33) - bgFar * 0.15) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1, a = -Math.PI / 2 + Math.sin(realT * 0.35 + k * 2.1) * 0.55, L = H * 1.3;
        const lg = ctx.createLinearGradient(bx, H, bx + Math.cos(a) * L, H + Math.sin(a) * L);
        lg.addColorStop(0, 'rgba(255,255,255,0.28)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(bx - 6, H); ctx.lineTo(bx + Math.cos(a - 0.07) * L, H + Math.sin(a - 0.07) * L); ctx.lineTo(bx + Math.cos(a + 0.07) * L, H + Math.sin(a + 0.07) * L); ctx.lineTo(bx + 6, H); ctx.fill();
      }
      const skyline = (off, base, col, cw, hmax, lit) => {
        for (let cell = Math.floor(off / cw) - 1; cell <= Math.floor((off + W) / cw) + 1; cell++) {
          const x = cell * cw - off, bw = cw * (0.6 + hash(cell * 1.7) * 0.4), top = base - (30 + hash(cell * 3.1) * hmax);
          ctx.fillStyle = col; ctx.fillRect(x, top, bw, H - top);
          if (hash(cell * 5.3) > 0.8) { ctx.fillRect(x + bw * 0.45, top - hmax * 0.25, bw * 0.1, hmax * 0.25); }
          ctx.fillStyle = lit;
          for (let wy = top + 8; wy < H; wy += 14) for (let wx = x + 5; wx < x + bw - 6; wx += 11) if (hash(cell * 31 + wx * 0.37 + wy * 0.71) > 0.72) ctx.fillRect(wx, wy, 4, 6);
        }
      };
      skyline(bgFar * 0.5, hz - 20, '#202026', 70, 140, 'rgba(255,255,220,0.35)');
      skyline(bgMid * 0.7, hz + 60, '#141418', 110, 200, 'rgba(255,255,220,0.5)');
      break;
    }
  }
}
function drawPalm(x, y, hgt, lean, trunkCol, leafCol, unit) {
  ctx.strokeStyle = trunkCol; ctx.lineWidth = Math.max(unit * 4, hgt * 0.06); ctx.lineCap = 'butt';
  const tx = x + lean * hgt * 0.5, ty = y - hgt;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * hgt * 0.05, y - hgt * 0.5, tx, ty); ctx.stroke();
  ctx.strokeStyle = leafCol; ctx.lineWidth = Math.max(unit * 3, hgt * 0.05);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55, L = hgt * 0.42;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.7, ty + Math.sin(a) * L * 0.8, tx + Math.cos(a) * L * 1.2, ty + Math.sin(a) * L * 0.5 + L * 0.45); ctx.stroke();
  }
}
function drawMushroom(x, y, hgt, cap, outline, lw) {
  ctx.lineWidth = lw; ctx.strokeStyle = outline;
  ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.roundRect(x - hgt * 0.1, y - hgt * 0.7, hgt * 0.2, hgt * 0.7, hgt * 0.06); ctx.fill(); ctx.stroke();
  ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x, y - hgt * 0.7, hgt * 0.42, hgt * 0.3, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + (k - 1) * hgt * 0.2, y - hgt * (0.82 + (k % 2) * 0.06), hgt * 0.05, 0, Math.PI * 2); ctx.fill(); }
}
function drawDeadTree(x, y, hgt, col, seed) {
  ctx.strokeStyle = col; ctx.lineCap = 'round';
  const branch = (bx, by, a, len, w, d) => {
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    if (d > 0) { branch(ex, ey, a - 0.5 - hash(seed + d) * 0.3, len * 0.68, w * 0.62, d - 1); branch(ex, ey, a + 0.45 + hash(seed - d) * 0.3, len * 0.62, w * 0.62, d - 1); }
  };
  branch(x, y, -Math.PI / 2 + (hash(seed) - 0.5) * 0.2, hgt * 0.45, Math.max(2, hgt * 0.05), 3);
  ctx.lineCap = 'butt';
}
function drawPine(x, y, hgt, col, snow) {
  for (let i = 0; i < 4; i++) {
    const w = hgt * (0.36 - i * 0.07), yb = y - hgt * (0.15 + i * 0.2), yt = yb - hgt * 0.32;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, yb); ctx.lineTo(x, yt); ctx.lineTo(x + w, yb); ctx.fill();
  }
}

// ============================================================ rendering: world
let shX = 0, shY = 0;
function worldTransform() {
  const z = cam.zoom, c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  ctx.setTransform(DPR * z * c, DPR * z * s, -DPR * z * s, DPR * z * c, DPR * (W / 2 + shX - z * (c * cam.x - s * cam.y)), DPR * (H / 2 + shY - z * (s * cam.x + c * cam.y)));
  ctx.imageSmoothingEnabled = !!ERA.smooth;
}
function viewBounds() {
  if (cam.rot) { const r = Math.hypot(W, H) / 2 / cam.zoom; return { x0: cam.x - r, x1: cam.x + r, y0: cam.y - r, y1: cam.y + r }; }
  const hw = W / 2 / cam.zoom, hh = H / 2 / cam.zoom;
  return { x0: cam.x - hw, x1: cam.x + hw, y0: cam.y - hh, y1: cam.y + hh };
}
function drawDecor(vb) {
  const cell = 170, u = 1 / cam.zoom;
  for (let i = Math.floor(vb.x0 / cell) - 2; i <= Math.floor(vb.x1 / cell) + 2; i++) {
    const r = hash(i * 1.37);
    if (r > 0.5) continue;
    const x = i * cell + hash(i + 0.7) * cell * 0.7;
    const gy = groundY(x) + 6;
    const hgt = 90 + hash(i + 0.3) * 220;
    switch (ERA.theme) {
      case 'jungle':
        if (r < 0.28) drawPalm(x, gy, hgt, hash(i + 5) - 0.5, '#6b4a2e', '#2f8a3a', u);
        else {
          ctx.strokeStyle = '#3f9a3c'; ctx.lineWidth = Math.max(3 * u, hgt * 0.035);
          const hh = hgt * 0.35;
          for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.38; ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + Math.cos(a) * hh * 0.6, gy + Math.sin(a) * hh, x + Math.cos(a) * hh * 1.1, gy + Math.sin(a) * hh * 0.6); ctx.stroke(); }
        }
        break;
      case 'goo':
        if (r < 0.25) drawMushroom(x, gy, hgt * 0.8, ['#ff5aa0', '#5ad8ff', '#ffe066', '#b46aff'][Math.floor(hash(i + 5) * 4)], THEME.outline, Math.max(3 * u, hgt * 0.025));
        else if (r < 0.4) { // eyeball stalk
          const sh = hgt * 0.6, lw = Math.max(3 * u, hgt * 0.03);
          ctx.strokeStyle = THEME.outline; ctx.lineWidth = lw * 3; ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + Math.sin(realT + i) * sh * 0.2, gy - sh * 0.5, x, gy - sh); ctx.stroke();
          ctx.strokeStyle = '#7dff6a'; ctx.lineWidth = lw * 1.8; ctx.stroke();
          const blink = (realT + hash(i) * 10) % 4 < 0.12;
          ctx.fillStyle = '#fff'; ctx.strokeStyle = THEME.outline; ctx.lineWidth = lw;
          ctx.beginPath(); ctx.ellipse(x, gy - sh, sh * 0.16, blink ? sh * 0.02 : sh * 0.16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (!blink) { ctx.fillStyle = THEME.outline; const lx = player && player.active ? clamp((player.x - x) / 400, -1, 1) * sh * 0.06 : 0; ctx.beginPath(); ctx.arc(x + lx, gy - sh, sh * 0.07, 0, Math.PI * 2); ctx.fill(); }
        }
        break;
      case 'deep':
        if (r < 0.35) { // kelp, sketchy double stroke
          const sh = hgt * 1.3;
          for (let pass = 0; pass < 2; pass++) {
            ctx.strokeStyle = pass ? 'rgba(60,110,90,0.9)' : 'rgba(20,40,40,0.9)'; ctx.lineWidth = Math.max(2 * u, hgt * (pass ? 0.03 : 0.05));
            ctx.beginPath(); ctx.moveTo(x, gy);
            for (let k = 1; k <= 10; k++) { const yy = gy - sh * k / 10, sway = Math.sin(realT * 1.2 + k * 0.6 + i) * hgt * 0.08 * (k / 10); ctx.lineTo(x + sway + (pass ? 2 : 0), yy); }
            ctx.stroke();
          }
        } else if (r < 0.45) { ctx.fillStyle = '#1a1c24'; ctx.strokeStyle = '#4a5260'; ctx.lineWidth = Math.max(2 * u, 3); ctx.beginPath(); ctx.ellipse(x, gy - hgt * 0.05, hgt * 0.22, hgt * 0.12, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); }
        break;
      case 'film': {
        const gy0 = groundY(x);
        ctx.lineCap = 'round';
        if (gy0 === 0) {
          if (r < 0.3) { // street lamp with a cone of light
            const lh = 120;
            ctx.fillStyle = 'rgba(255,255,230,0.12)'; ctx.beginPath(); ctx.moveTo(x + 18, -lh + 8); ctx.lineTo(x - 30, 0); ctx.lineTo(x + 66, 0); ctx.fill();
            ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -lh); ctx.quadraticCurveTo(x, -lh - 12, x + 18, -lh - 4); ctx.stroke();
            ctx.fillStyle = '#f8f8e8'; ctx.beginPath(); ctx.ellipse(x + 18, -lh + 3, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
          } else if (r < 0.38) { ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x - 6, -18, 12, 18); ctx.beginPath(); ctx.arc(x, -18, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 10, -12, 20, 4); }
        } else {
          if (r < 0.18) { // water tower
            const s = 40 + hash(i + 2) * 20;
            ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x - s * 0.4, gy0); ctx.lineTo(x - s * 0.3, gy0 - s); ctx.moveTo(x + s * 0.4, gy0); ctx.lineTo(x + s * 0.3, gy0 - s); ctx.moveTo(x - s * 0.36, gy0 - s * 0.5); ctx.lineTo(x + s * 0.36, gy0 - s * 0.5); ctx.stroke();
            ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x - s * 0.42, gy0 - s * 1.8, s * 0.84, s * 0.8);
            ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, gy0 - s * 1.8); ctx.lineTo(x, gy0 - s * 2.2); ctx.lineTo(x + s * 0.5, gy0 - s * 1.8); ctx.fill();
          } else if (r < 0.3) { // antenna with a blinking light
            const s = 60 + hash(i + 4) * 80;
            ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, gy0); ctx.lineTo(x, gy0 - s); ctx.moveTo(x - 10, gy0 - s * 0.6); ctx.lineTo(x + 10, gy0 - s * 0.6); ctx.moveTo(x - 6, gy0 - s * 0.8); ctx.lineTo(x + 6, gy0 - s * 0.8); ctx.stroke();
            if ((realT + hash(i)) % 1.2 < 0.6) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, gy0 - s, 4, 0, Math.PI * 2); ctx.fill(); }
          } else if (r < 0.36) { // rooftop billboard
            ctx.fillStyle = '#222'; ctx.fillRect(x - 3, gy0 - 30, 6, 30); ctx.fillRect(x + 57, gy0 - 30, 6, 30);
            ctx.fillStyle = '#d8d8d0'; ctx.fillRect(x - 10, gy0 - 72, 80, 44);
            ctx.fillStyle = '#111'; ctx.font = 'bold 13px "Special Elite", monospace'; ctx.textAlign = 'center';
            const ad = ["EAT AT JOE'S", 'ATOM COLA', 'DRIVE-IN!', 'BUY BONDS', 'VOTE NO ON 7'][Math.floor(hash(i + 8) * 5)];
            ctx.fillText(ad, x + 30, gy0 - 45);
          }
        }
        ctx.lineCap = 'butt';
        break;
      }
    }
  }
}
function groundPath(x0, x1, step, yOff = 0) {
  for (let x = x0; x <= x1; x += step) { const y = groundY(x) + yOff; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
}
function drawGround(vb) {
  const T = THEME;
  const step = Math.max(2, 5 / cam.zoom);
  const x0 = vb.x0 - step * 2, x1 = vb.x1 + step * 2, bottom = vb.y1 + 50;
  ctx.beginPath(); ctx.moveTo(x0, bottom); groundPath(x0, x1, step); ctx.lineTo(x1, bottom); ctx.closePath();
  switch (ERA.theme) {
    case 'jungle': {
      const g = ctx.createLinearGradient(0, cam.y - 100, 0, bottom); g.addColorStop(0, T.dirtA); g.addColorStop(1, T.dirtB);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(40,24,14,0.35)'; ctx.lineWidth = Math.max(3 / cam.zoom, 6);
      for (const off of [40, 95, 170]) { ctx.beginPath(); for (let x = x0; x <= x1; x += step * 2) { const y = groundY(x) + off + Math.sin(x * 0.01 + off) * 8; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      drawScorches();
      const gw = Math.max(4 / cam.zoom, 7);
      ctx.strokeStyle = T.grassA; ctx.lineWidth = gw; ctx.lineJoin = 'round'; ctx.beginPath(); groundPath(x0, x1, step, gw * 0.4); ctx.stroke();
      ctx.strokeStyle = T.grassB; ctx.lineWidth = gw * 0.35; ctx.beginPath(); groundPath(x0, x1, step, -gw * 0.1); ctx.stroke();
      for (let i = Math.floor(x0 / 28); i <= x1 / 28; i++) {
        const r = hash(i * 0.913), x = i * 28 + r * 28, y = groundY(x);
        if (r < 0.35) { ctx.fillStyle = T.tuft; const th = 8 + hash(i) * 10; ctx.beginPath(); ctx.moveTo(x - 5, y + 2); ctx.lineTo(x - 2, y - th); ctx.lineTo(x, y + 2); ctx.lineTo(x + 3, y - th * 0.8); ctx.lineTo(x + 6, y + 2); ctx.fill(); }
        else if (r > 0.93) { ctx.fillStyle = T.rock; ctx.fillRect(x - 6, y - 5, 12, 8); }
      }
      break;
    }
    case 'goo': {
      const g = ctx.createLinearGradient(0, cam.y - 100, 0, bottom); g.addColorStop(0, T.dirtA); g.addColorStop(1, T.dirtB);
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = Math.floor(x0 / 60); i <= x1 / 60; i++) for (let k = 0; k < 3; k++) { const x = i * 60 + hash(i + k * 7) * 60, y = groundY(x) + 30 + k * 50 + hash(i * 3 + k) * 30; ctx.beginPath(); ctx.arc(x, y, 6 + hash(i + k) * 10, 0, Math.PI * 2); ctx.fill(); }
      drawScorches();
      const gw = Math.max(5 / cam.zoom, 12);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = T.outline; ctx.lineWidth = gw * 1.6; ctx.beginPath(); groundPath(x0, x1, step, gw * 0.5); ctx.stroke();
      ctx.strokeStyle = T.grassA; ctx.lineWidth = gw; ctx.beginPath(); groundPath(x0, x1, step, gw * 0.5); ctx.stroke();
      ctx.strokeStyle = T.grassB; ctx.lineWidth = gw * 0.25; ctx.beginPath(); groundPath(x0, x1, step, gw * 0.25); ctx.stroke();
      ctx.fillStyle = T.grassA; ctx.strokeStyle = T.outline; ctx.lineWidth = gw * 0.3;
      for (let i = Math.floor(x0 / 90); i <= x1 / 90; i++) { if (hash(i * 1.9) > 0.4) continue; const x = i * 90 + hash(i) * 60, y = groundY(x) + gw, d = 8 + hash(i + 2) * 14; ctx.beginPath(); ctx.ellipse(x, y + d * 0.6, d * 0.5, d, 0, 0, Math.PI); ctx.fill(); ctx.stroke(); }
      break;
    }
    case 'deep': {
      ctx.fillStyle = T.sand; ctx.fill();
      ctx.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) { ctx.strokeStyle = pass ? 'rgba(160,170,190,0.45)' : T.sandTop; ctx.lineWidth = Math.max(2 / cam.zoom, pass ? 2 : 5); ctx.beginPath(); for (let x = x0; x <= x1; x += step) { const y = groundY(x) + (pass ? Math.sin(x * 0.07) * 2 + 4 : 0); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(160,170,190,0.25)';
      for (let i = Math.floor(x0 / 40); i <= x1 / 40; i++) { const r = hash(i * 0.7), x = i * 40 + r * 40; if (r < 0.4) { ctx.beginPath(); ctx.ellipse(x, groundY(x) + 10 + r * 30, 4 + r * 8, 2 + r * 4, 0, 0, Math.PI * 2); ctx.fill(); } }
      // surface line
      const [, sy] = toScreen(0, SURF);
      if (sy > -20 && sy < H + 20) {
        ctx.strokeStyle = 'rgba(230,246,255,0.9)'; ctx.lineWidth = Math.max(2 / cam.zoom, 4);
        ctx.beginPath(); for (let x = x0; x <= x1; x += step * 2) { const y = SURF + Math.sin(x * 0.02 + realT * 2) * 6 + Math.sin(x * 0.05 - realT * 3) * 3; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      }
      break;
    }
    case 'film': {
      ctx.fillStyle = '#26262a'; ctx.fillRect(x0, 0, x1 - x0, bottom);
      ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x0, 0, x1 - x0, 5);
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x0, 5, x1 - x0, 3);
      ctx.fillStyle = '#c8c8c0';
      for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) ctx.fillRect(x, 36, 30, 4);
      for (let i = Math.floor(x0 / CITY) - 1; i <= Math.floor(x1 / CITY) + 1; i++) {
        const b = building(i);
        if (!b) continue;
        const shade = Math.floor(58 + hash(i * 3.3) * 50), bw = b.x1 - b.x0;
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 4})`; ctx.fillRect(b.x0, b.top, bw, -b.top + 5);
        ctx.fillStyle = `rgb(${shade + 40},${shade + 40},${shade + 40})`; ctx.fillRect(b.x0 - 3, b.top, bw + 6, 7);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(b.x1 - bw * 0.12, b.top + 7, bw * 0.12, -b.top - 2);
        const cols = Math.max(2, Math.floor((bw - 16) / 22)), gap = (bw - 16) / cols;
        for (let ry = b.top + 22; ry < -34; ry += 28) for (let k = 0; k < cols; k++) {
          const hv = hash(i * 17.3 + ry * 0.13 + k * 3.7);
          const lit = hv > 0.55 && !(hv > 0.93 && Math.sin(realT * 9 + k) > 0.3);
          ctx.fillStyle = lit ? '#f4f0d0' : '#1c1c20';
          ctx.fillRect(b.x0 + 8 + k * gap + gap * 0.2, ry, gap * 0.6, 15);
        }
        ctx.fillStyle = '#141414'; ctx.fillRect(b.x0 + bw / 2 - 9, -26, 18, 26);
      }
      drawScorches();
      break;
    }
    case 'cube': break;
    case 'house': {
      ctx.fillStyle = '#c98f5a'; ctx.fillRect(x0, 0, x1 - x0, bottom);
      ctx.fillStyle = 'rgba(90,50,20,0.25)';
      for (let x = Math.floor(x0 / 260) * 260; x < x1; x += 260) ctx.fillRect(x + (Math.floor(x / 260) % 2) * 130, 0, 3, bottom);
      for (let y = 40; y < bottom; y += 40) ctx.fillRect(x0, y, x1 - x0, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0, 0, x1 - x0, 4);
      for (let i = Math.floor(x0 / HCELL) - 1; i <= Math.floor(x1 / HCELL) + 1; i++) drawFurniture(furniture(i));
      break;
    }
    case 'neon': {
      const R = Math.hypot(W, H) / 2 / cam.zoom + 400;
      for (let i = Math.floor((cam.x - R) / PCELL); i <= Math.ceil((cam.x + R) / PCELL); i++) for (let j = Math.floor((cam.y - R) / PCELL); j <= Math.ceil((cam.y + R) / PCELL); j++) {
        const P = planetAt(i, j);
        if (Math.hypot(P.x - cam.x, P.y - cam.y) > R + P.r) continue;
        drawPlanet(P);
      }
      break;
    }
  }
}
// ---- HOME SWEET GIANT HOME: furniture drawn as stickers (white die-cut edge + soft shadow)
function stk(build, fill, ow) {
  ctx.save();
  ctx.shadowColor = 'rgba(60,40,70,0.28)'; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5; ctx.shadowBlur = 6;
  build(); ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ow * 2; ctx.stroke();
  ctx.restore();
  build(); ctx.fillStyle = fill; ctx.fill();
}
const rr = (x, y, w, h, r) => () => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
function drawFurniture(F) {
  const x = F.x0, ow = Math.max(3 / cam.zoom, 5);
  const box = (a, top, b, bot, fill, r = 8) => stk(rr(x + a, top, b - a, bot - top, r), fill, ow);
  const books = (a) => { box(a, -70, a + 110, 0, '#e8645a', 4); box(a + 6, -70, a + 104, -48, '#ffffff', 2); box(a + 20, -140, a + 90, -70, '#5a8ae8', 4); box(a + 26, -128, a + 84, -118, '#ffe066', 2); };
  switch (F.kind) {
    case 'rug':
      ctx.fillStyle = '#e88a9a'; ctx.beginPath(); ctx.ellipse(x + 550, 6, 480, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.ellipse(x + 550, 6, 440, 18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      for (const [a, top, col, l] of [[300, -80, '#ff7a59', 'A'], [380, -80, '#5ac8ff', 'B'], [340, -160, '#ffd23a', 'C'], [720, -80, '#7dd34a', 'D']]) {
        box(a, top, a + 80, top + 80, col, 8);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 54px "Chewy", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(l, x + a + 40, top + 60);
      }
      break;
    case 'piano': {
      books(20);
      box(320, -200, 340, 0, '#3a2a2a', 4); box(660, -200, 680, 0, '#3a2a2a', 4); box(300, -200, 700, -170, '#4a3030', 10);
      box(90, -520, 910, -40, '#2a2028', 18);
      box(110, -40, 150, 0, '#2a2028', 4); box(850, -40, 890, 0, '#2a2028', 4);
      box(120, -490, 880, -330, '#3a2c34', 10);
      ctx.fillStyle = '#d8b060'; ctx.font = 'bold 34px "Chewy", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CHOMPWAY & SONS', x + 500, -400);
      const P = F.plats.find((q) => q.kind === 'keys'), kw = (P.x1 - P.x0) / P.keys;
      box(110, -310, 890, -250, '#1a1418', 6);
      for (let k = 0; k < P.keys; k++) {
        const pressed = realT - (pressedKeys2[F.i + ':' + k] || -9) < 0.18;
        ctx.fillStyle = pressed ? '#ffd27a' : '#fffdf6'; ctx.fillRect(P.x0 + k * kw + 1.5, P.top + (pressed ? 5 : 0), kw - 3, 52);
        if ([0, 1, 3, 4, 5].includes(k % 7) && k < P.keys - 1) { ctx.fillStyle = '#1a1418'; ctx.fillRect(P.x0 + (k + 0.65) * kw, P.top + (pressed ? 5 : 0), kw * 0.7, 30); }
      }
      box(430, -600, 570, -520, '#3a2c34', 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 445, -592, 110, 64);
      ctx.fillStyle = '#3a2c34'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 452, -580 + k * 14, 96, 2);
      break;
    }
    case 'kitchen': {
      box(80, -150, 240, 0, '#e85a5a', 10); box(95, -150, 225, -128, '#ffffff', 6);
      box(250, -250, 330, 0, '#9aa8b8', 12);
      box(300, -340, 1060, 0, '#d89a5a', 6);
      for (let k = 0; k < 4; k++) { box(320 + k * 185, -320, 490 + k * 185, -20, '#e8b070', 8); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x + 470 + k * 185, -200, 8, 50); }
      box(290, -370, 1070, -340, '#e8e8f0', 6);
      const S = F.plats.find((q) => q.kind === 'stove'), hot = stoveHot(S);
      box(640, -372, 860, -350, '#2a2a30', 4);
      for (const bx of [700, 800]) {
        if (hot) { const g = ctx.createRadialGradient(x + bx, -372, 4, x + bx, -372, 46); g.addColorStop(0, 'rgba(255,170,60,0.9)'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + bx, -380, 50, 22, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = hot ? '#ff5a2a' : '#4a4a52'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x + bx, -374, 40, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + bx, -374, 22, 4, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if (hot && Math.random() < 0.3) burst(x + rand(660, 840), -380, 1, ['#ff7a1a', '#ffd23a'], 30, 6, { grav: -0.2, life: 0.6 });
      box(380, -470, 500, -370, '#c8ccd8', 18); ctx.fillStyle = '#2a2a30'; ctx.fillRect(x + 405, -470, 30, 8); ctx.fillRect(x + 445, -470, 30, 8);
      box(520, -560, 600, -370, '#ffd23a', 4); ctx.save(); ctx.translate(x + 560, -465); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#e8645a'; ctx.font = 'bold 30px "Chewy", sans-serif'; ctx.textAlign = 'center'; ctx.fillText("CHOMP-O's", 0, 10); ctx.restore();
      box(300, -760, 1060, -640, '#d89a5a', 6);
      for (let k = 0; k < 4; k++) box(320 + k * 185, -745, 490 + k * 185, -655, '#e8b070', 8);
      box(880, -650, 1000, -630, '#a06a3a', 4); for (let k = 0; k < 4; k++) box(890 + k * 28, -700, 912 + k * 28, -650, ['#e85a5a', '#ffd23a', '#7dd34a', '#ffffff'][k], 6);
      break;
    }
    case 'table': {
      books(420);
      for (const a of [60, 870]) { box(a + 10, -240, a + 30, 0, '#a06a3a', 4); box(a + 140, -240, a + 160, 0, '#a06a3a', 4); box(a, -240, a + 170, -215, '#c88a50', 6); }
      box(60, -450, 95, -240, '#c88a50', 6); box(1005, -450, 1040, -240, '#c88a50', 6);
      box(240, -400, 275, 0, '#a06a3a', 6); box(825, -400, 860, 0, '#a06a3a', 6);
      box(200, -410, 900, -380, '#c88a50', 8);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x + 210, -385); for (let k = 0; k <= 14; k++) ctx.lineTo(x + 210 + k * 48, -330 + (k % 2) * 18); ctx.lineTo(x + 890, -385); ctx.fill();
      ctx.fillStyle = '#e8645a'; for (let k = 0; k < 7; k++) ctx.fillRect(x + 220 + k * 96, -385, 48, 30);
      break;
    }
    case 'shelf': {
      books(80);
      box(250, -770, 850, 0, '#8a5a3a', 8); box(270, -750, 830, -10, '#6a4228', 4);
      for (const t of [-150, -300, -450, -600, -750]) box(250, t, 850, t + 18, '#a06a3a', 4);
      for (const t of [-150, -300, -450, -600]) for (let k = 0; k < 5; k++) {
        const bx = 300 + k * 105 + hash(t + k) * 20, bh = 70 + hash(t * 3 + k) * 50, col = ['#e85a5a', '#5a8ae8', '#ffd23a', '#7dd34a', '#b46aff', '#ff9a3a'][Math.floor(hash(t + k * 7) * 6)];
        if (hash(t * 7 + k) < 0.3) continue;
        box(bx, t + 150 - bh - 2, bx + 34, t + 148, col, 4);
      }
      break;
    }
    case 'sofa':
      box(120, -40, 160, 0, '#6a4228', 4); box(940, -40, 980, 0, '#6a4228', 4);
      box(100, -170, 1000, -40, '#2aa8a0', 20);
      box(230, -380, 870, -160, '#38c0b8', 30);
      for (let k = 0; k < 3; k++) box(250 + k * 205, -170, 440 + k * 205, -130, '#5ad8d0', 20);
      box(100, -270, 230, -40, '#2aa8a0', 30); box(870, -270, 1000, -40, '#2aa8a0', 30);
      box(560, -300, 700, -170, '#ffd27a', 30);
      break;
    case 'bed':
      books(0);
      box(80, -150, 960, -20, '#a06a3a', 8); box(100, -20, 140, 0, '#8a5a3a', 4); box(900, -20, 940, 0, '#8a5a3a', 4);
      box(80, -230, 960, -150, '#fffaf2', 26);
      box(80, -220, 700, -140, '#ff9ac0', 24); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x + 140 + k * 95, -185, 14, 0, Math.PI * 2); ctx.fill(); }
      box(760, -290, 940, -225, '#ffffff', 30);
      box(940, -470, 1060, 0, '#8a5a3a', 30);
      break;
  }
}
function drawPlanet(P) {
  const col = NEON[P.col], r = P.r, lw = Math.max(2 / cam.zoom, r * 0.012);
  const halo = ctx.createRadialGradient(P.x, P.y, r * 0.85, P.x, P.y, r * 1.45);
  halo.addColorStop(0, col + '55'); halo.addColorStop(1, col + '00');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(P.x, P.y, r * 1.45, 0, Math.PI * 2); ctx.fill();
  if (P.ring) { ctx.strokeStyle = col + '66'; ctx.lineWidth = lw * 3; ctx.beginPath(); ctx.ellipse(P.x, P.y, r * 1.75, r * 0.32, P.seed * 3, Math.PI, Math.PI * 2); ctx.stroke(); }
  const body = ctx.createRadialGradient(P.x - r * 0.3, P.y - r * 0.3, r * 0.1, P.x, P.y, r);
  body.addColorStop(0, '#1a1236'); body.addColorStop(1, '#07040f');
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = col + '55'; ctx.lineWidth = lw * 0.7;
  const spin = realT * 0.25 * (P.seed > 0.5 ? 1 : -1) + P.seed * 6;
  for (let k = 0; k < 6; k++) { const a = spin + k * Math.PI / 6; ctx.beginPath(); ctx.ellipse(P.x, P.y, r * Math.abs(Math.cos(a)), r, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (let k = -2; k <= 2; k++) { const yy = P.y + k * r * 0.36, rr = Math.sqrt(Math.max(0, r * r - (k * r * 0.36) ** 2)); ctx.beginPath(); ctx.ellipse(P.x, yy, rr, rr * 0.12, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) { ctx.strokeStyle = pass ? col : col + '44'; ctx.lineWidth = pass ? lw : lw * 5; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = lw; // neon crystals on the surface
  for (let k = 0; k < 6; k++) {
    const a = P.seed * 20 + k * 1.05 + hash(P.i + k) * 0.4, s = r * (0.06 + hash(P.j + k) * 0.08);
    const bx = P.x + Math.cos(a) * r, by = P.y + Math.sin(a) * r, nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx;
    ctx.beginPath(); ctx.moveTo(bx - tx * s * 0.4, by - ty * s * 0.4); ctx.lineTo(bx + nx * s * 1.6, by + ny * s * 1.6); ctx.lineTo(bx + tx * s * 0.4, by + ty * s * 0.4); ctx.stroke();
  }
  if (P.ring) { ctx.strokeStyle = col; ctx.lineWidth = lw * 1.5; ctx.beginPath(); ctx.ellipse(P.x, P.y, r * 1.75, r * 0.32, P.seed * 3, 0, Math.PI); ctx.stroke(); }
}
// ---- glowing vector creatures (NEON ORBIT). Origin = centre, facing +x.
function glow(col, lw, build, fillA = 0.12) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  build();
  if (fillA) { ctx.globalAlpha = fillA; ctx.fillStyle = col; ctx.fill(); }
  ctx.strokeStyle = col; ctx.globalAlpha = 0.22; ctx.lineWidth = lw * 4; ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = lw; ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.65; ctx.lineWidth = lw * 0.35; ctx.stroke();
  ctx.globalAlpha = 1;
}
function vecEyes(x, y, r, col, look = 0) {
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + r * 0.35 * (look || 1), y, r * 0.5, 0, Math.PI * 2); ctx.fill();
}
function drawVecShape(kind, w, h, t, col, seed = 0) {
  const lw = Math.max(1.6 / cam.zoom, h * 0.05);
  switch (kind) {
    case 'mote': {
      glow(col, lw, () => { ctx.beginPath(); ctx.arc(0, 0, h * 0.28, 0, Math.PI * 2); }, 0.6);
      glow(col, lw * 0.7, () => { ctx.beginPath(); for (let k = 0; k < 4; k++) { const a = t * 2 + k * Math.PI / 2; ctx.moveTo(Math.cos(a) * h * 0.36, Math.sin(a) * h * 0.36); ctx.lineTo(Math.cos(a) * h * 0.6, Math.sin(a) * h * 0.6); } }, 0);
      break;
    }
    case 'astro': {
      const fl = Math.sin(t * 6) * 0.5;
      glow(col, lw, () => { ctx.beginPath(); ctx.moveTo(-w * 0.2, h * 0.12); ctx.lineTo(-w * 0.45, h * 0.02 + fl * h * 0.2); ctx.moveTo(w * 0.2, h * 0.12); ctx.lineTo(w * 0.45, h * 0.02 - fl * h * 0.2); ctx.moveTo(-w * 0.12, h * 0.36); ctx.lineTo(-w * 0.22, h * 0.52 - fl * h * 0.1); ctx.moveTo(w * 0.12, h * 0.36); ctx.lineTo(w * 0.22, h * 0.52 + fl * h * 0.1); }, 0);
      glow(col, lw, () => { ctx.beginPath(); ctx.roundRect(-w * 0.22, h * 0.02, w * 0.44, h * 0.36, h * 0.08); }, 0.2);
      glow(col, lw, () => { ctx.beginPath(); ctx.arc(0, -h * 0.2, h * 0.24, 0, Math.PI * 2); }, 0.15);
      glow('#3affd8', lw, () => { ctx.beginPath(); ctx.ellipse(h * 0.06, -h * 0.2, h * 0.14, h * 0.1, 0, 0, Math.PI * 2); }, 0.5);
      break;
    }
    case 'tri': {
      glow(col, lw, () => { ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(-w * 0.45, -h * 0.42); ctx.lineTo(-w * 0.22, 0); ctx.lineTo(-w * 0.45, h * 0.42); ctx.closePath(); });
      glow('#ff8a3a', lw, () => { ctx.beginPath(); ctx.moveTo(-w * 0.28, 0); ctx.lineTo(-w * (0.5 + 0.18 * Math.abs(Math.sin(t * 30))), 0); }, 0);
      break;
    }
    case 'jelly': {
      glow(col, lw, () => { ctx.beginPath(); ctx.ellipse(0, -h * 0.05, w * 0.42, h * 0.32, 0, Math.PI, 0); ctx.closePath(); }, 0.2);
      glow(col, lw * 0.8, () => { ctx.beginPath(); for (let k = 0; k < 4; k++) { const x = -w * 0.3 + k * w * 0.2; ctx.moveTo(x, -h * 0.05); ctx.bezierCurveTo(x + Math.sin(t * 3 + k) * w * 0.15, h * 0.15, x - Math.sin(t * 3 + k) * w * 0.15, h * 0.35, x, h * 0.5); } }, 0);
      break;
    }
    case 'rock': {
      glow(col, lw, () => { ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + t * 0.3 * (seed > 0.5 ? 1 : -1), r = h * 0.5 * (0.72 + 0.28 * hash(seed * 100 + k)); k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }, 0.15);
      glow(col, lw * 0.6, () => { ctx.beginPath(); const a = t * 0.3 * (seed > 0.5 ? 1 : -1); ctx.arc(Math.cos(a) * h * 0.15, Math.sin(a) * h * 0.15, h * 0.1, 0, Math.PI * 2); ctx.moveTo(Math.cos(a + 2) * h * 0.2 + h * 0.07, Math.sin(a + 2) * h * 0.2); ctx.arc(Math.cos(a + 2) * h * 0.2, Math.sin(a + 2) * h * 0.2, h * 0.07, 0, Math.PI * 2); }, 0);
      break;
    }
    case 'diamond': {
      glow(col, lw, () => { ctx.beginPath(); ctx.moveTo(0, -h * 0.5); ctx.lineTo(w * 0.34, 0); ctx.lineTo(0, h * 0.5); ctx.lineTo(-w * 0.34, 0); ctx.closePath(); }, 0.15);
      vecEyes(0, 0, h * 0.11, '#ff3af0');
      break;
    }
    case 'saucer': {
      glow(col, lw, () => { ctx.beginPath(); ctx.ellipse(0, -h * 0.02, w * 0.2, h * 0.26, 0, Math.PI, 0); }, 0.15);
      ctx.fillStyle = col; for (const ex of [-0.07, 0.07]) { ctx.beginPath(); ctx.arc(ex * w, -h * 0.12, h * 0.05, 0, Math.PI * 2); ctx.fill(); }
      glow(col, lw, () => { ctx.beginPath(); ctx.ellipse(0, h * 0.06, w * 0.5, h * 0.16, 0, 0, Math.PI * 2); }, 0.2);
      for (let k = 0; k < 5; k++) if ((Math.floor(t * 8) + k) % 2) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc((k - 2) * w * 0.17, h * 0.08, h * 0.04, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'shark': {
      glow(col, lw, () => { ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.02); ctx.quadraticCurveTo(w * 0.3, -h * 0.3, w * 0.04, -h * 0.3); ctx.lineTo(-w * 0.06, -h * 0.55); ctx.lineTo(-w * 0.18, -h * 0.26); ctx.quadraticCurveTo(-w * 0.34, -h * 0.18, -w * 0.38, 0); ctx.lineTo(-w * 0.52, -h * 0.36 + Math.sin(t * 8) * h * 0.08); ctx.lineTo(-w * 0.46, 0); ctx.lineTo(-w * 0.52, h * 0.32 + Math.sin(t * 8) * h * 0.08); ctx.lineTo(-w * 0.36, h * 0.06); ctx.quadraticCurveTo(0, h * 0.34, w * 0.5, h * 0.02); }, 0.15);
      glow(col, lw * 0.6, () => { ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(w * (0.12 - k * 0.05), -h * 0.08); ctx.lineTo(w * (0.1 - k * 0.05), h * 0.08); } ctx.moveTo(w * 0.42, h * 0.08); for (let k = 0; k < 4; k++) ctx.lineTo(w * (0.38 - k * 0.04), h * (k % 2 ? 0.08 : 0.15)); }, 0);
      vecEyes(w * 0.3, -h * 0.07, h * 0.06, '#ff3a3a');
      break;
    }
    case 'serpent': { // the head
      const jaw = 0.12 + Math.abs(Math.sin(t * 4)) * 0.18;
      glow(col, lw * 1.2, () => { ctx.beginPath(); ctx.moveTo(-w * 0.35, -h * 0.3); ctx.lineTo(w * 0.2, -h * 0.32); ctx.lineTo(w * 0.55, -h * jaw); ctx.lineTo(w * 0.1, -h * 0.02); ctx.lineTo(w * 0.5, h * jaw); ctx.lineTo(w * 0.15, h * 0.3); ctx.lineTo(-w * 0.35, h * 0.3); ctx.closePath(); }, 0.2);
      glow('#ffe066', lw, () => { ctx.beginPath(); ctx.moveTo(-w * 0.1, -h * 0.3); ctx.lineTo(-w * 0.45, -h * 0.75); ctx.moveTo(-w * 0.25, -h * 0.3); ctx.lineTo(-w * 0.62, -h * 0.6); }, 0);
      vecEyes(w * 0.1, -h * 0.16, h * 0.07, '#ff3a3a');
      break;
    }
    case 'octo': { // player 2: mantle up, tentacles down
      glow(col, lw, () => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const x = -w * 0.32 + k * w * 0.13; ctx.moveTo(x, h * 0.1); ctx.bezierCurveTo(x + Math.sin(t * 4 + k) * w * 0.15, h * 0.25, x - Math.sin(t * 4 + k * 1.3) * w * 0.2, h * 0.4, x + (k - 2.5) * w * 0.06, h * 0.5); } }, 0);
      glow(col, lw, () => { ctx.beginPath(); ctx.moveTo(-w * 0.34, h * 0.12); ctx.quadraticCurveTo(-w * 0.4, -h * 0.35, 0, -h * 0.52); ctx.quadraticCurveTo(w * 0.4, -h * 0.35, w * 0.34, h * 0.12); ctx.closePath(); }, 0.2);
      glow(col, lw * 0.7, () => { ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.25); ctx.lineTo(-w * 0.5, -h * 0.32); ctx.lineTo(-w * 0.33, -h * 0.12); ctx.moveTo(w * 0.3, -h * 0.25); ctx.lineTo(w * 0.5, -h * 0.32); ctx.lineTo(w * 0.33, -h * 0.12); }, 0);
      vecEyes(w * 0.02, -h * 0.02, h * 0.09, '#140a30', 1); vecEyes(w * 0.2, -h * 0.02, h * 0.09, '#140a30', 1);
      break;
    }
    case 'whale': { // player 3
      glow(col, lw, () => { ctx.beginPath(); ctx.moveTo(w * 0.5, -h * 0.02); ctx.quadraticCurveTo(w * 0.48, -h * 0.38, w * 0.1, -h * 0.36); ctx.quadraticCurveTo(-w * 0.3, -h * 0.32, -w * 0.4, -h * 0.08); ctx.lineTo(-w * 0.56, -h * 0.42 + Math.sin(t * 3) * h * 0.06); ctx.lineTo(-w * 0.48, -h * 0.02); ctx.lineTo(-w * 0.58, h * 0.22 + Math.sin(t * 3) * h * 0.06); ctx.lineTo(-w * 0.36, h * 0.06); ctx.quadraticCurveTo(-w * 0.1, h * 0.36, w * 0.25, h * 0.3); ctx.quadraticCurveTo(w * 0.5, h * 0.24, w * 0.5, -h * 0.02); }, 0.18);
      glow(col, lw * 0.6, () => { ctx.beginPath(); ctx.moveTo(w * 0.48, h * 0.06); ctx.quadraticCurveTo(w * 0.3, h * 0.12, w * 0.12, h * 0.08); for (let k = 0; k < 4; k++) { ctx.moveTo(w * (0.3 - k * 0.1), h * 0.18); ctx.lineTo(w * (0.22 - k * 0.1), h * 0.27); } ctx.moveTo(w * 0.05, h * 0.18); ctx.quadraticCurveTo(-w * 0.05, h * 0.42, w * 0.12, h * 0.4); }, 0);
      const stars = [[0.15, -0.2], [0, -0.12], [-0.12, -0.2], [-0.25, -0.1], [0.05, 0.02]];
      ctx.strokeStyle = col + '88'; ctx.lineWidth = lw * 0.4; ctx.beginPath(); stars.forEach(([a, b], i) => i ? ctx.lineTo(a * w, b * h) : ctx.moveTo(a * w, b * h)); ctx.stroke();
      ctx.fillStyle = '#ffffff'; for (const [a, b] of stars) { ctx.beginPath(); ctx.arc(a * w, b * h, h * 0.025 * (1 + Math.sin(t * 5 + a * 9) * 0.4), 0, Math.PI * 2); ctx.fill(); }
      vecEyes(w * 0.33, -h * 0.1, h * 0.05, '#140a30', 1);
      if (Math.sin(t * 0.7) > 0.95) glow('#3affd8', lw * 0.6, () => { ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.36); ctx.quadraticCurveTo(w * 0.05, -h * 0.7, -w * 0.05, -h * 0.75); ctx.moveTo(w * 0.1, -h * 0.36); ctx.quadraticCurveTo(w * 0.15, -h * 0.7, w * 0.25, -h * 0.75); }, 0);
      break;
    }
    case 'worm': { // player 1 head (the body is drawn along its trail)
      glow(col, lw, () => { ctx.beginPath(); ctx.arc(0, 0, h * 0.34, 0, Math.PI * 2); }, 0.25);
      glow(col, lw * 0.7, () => { ctx.beginPath(); ctx.moveTo(w * 0.05, -h * 0.3); ctx.quadraticCurveTo(w * 0.15, -h * 0.6, w * 0.3, -h * 0.62); ctx.moveTo(-w * 0.1, -h * 0.3); ctx.quadraticCurveTo(-w * 0.05, -h * 0.65, w * 0.1, -h * 0.72); }, 0);
      ctx.fillStyle = '#ffffff'; for (const [a, b] of [[0.3, -0.62], [0.1, -0.72]]) { ctx.beginPath(); ctx.arc(a * w, b * h, h * 0.05, 0, Math.PI * 2); ctx.fill(); }
      vecEyes(w * 0.12, -h * 0.06, h * 0.09, '#140a30', 1); vecEyes(w * 0.28, -h * 0.04, h * 0.08, '#140a30', 1);
      glow(col, lw * 0.6, () => { ctx.beginPath(); ctx.arc(w * 0.2, h * 0.12, h * 0.1, 0.2, Math.PI - 0.2); }, 0);
      break;
    }
  }
}
// two passes: a white sticker edge (with shadow), then the colours
function dollPass(fn) {
  ctx.save(); ctx.shadowColor = 'rgba(60,40,70,0.3)'; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 4; ctx.shadowBlur = 5;
  fn(true); ctx.restore(); fn(false);
}
function drawHuman(age, w, h, t, o) {
  const ow = Math.max(2.5 / cam.zoom, h * 0.045), hurt = o.hurt, dead = o.dead;
  const C = (c) => (hurt ? '#ff8a8a' : dead ? '#9a9aa8' : c);
  const skin = C('#ffd2b0'), sw = Math.sin(t * 1.6), mv = o.moving ? 1 : 0, air = o.air;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const limb = (edge, x1, y1, x2, y2, wd, col) => { ctx.strokeStyle = edge ? '#ffffff' : col; ctx.lineWidth = wd + (edge ? ow * 2 : 0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const limb3 = (edge, x1, y1, x2, y2, x3, y3, wd, col) => { ctx.strokeStyle = edge ? '#ffffff' : col; ctx.lineWidth = wd + (edge ? ow * 2 : 0); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke(); };
  const blob = (edge, build, col) => { build(); if (edge) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ow * 2; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fill(); } else { ctx.fillStyle = col; ctx.fill(); } };
  const circ = (x, y, r) => () => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); };
  const ell = (x, y, rx, ry, a = 0) => () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); };
  const eyes = (x, y, r, glasses) => {
    ctx.fillStyle = '#2a2030'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r * 3.2, y, r, 0, Math.PI * 2); ctx.fill();
    if (glasses) { ctx.strokeStyle = '#4a3a3a'; ctx.lineWidth = r * 0.6; ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, Math.PI * 2); ctx.moveTo(x + r * 3.2 + r * 2.1, y); ctx.arc(x + r * 3.2, y, r * 2.1, 0, Math.PI * 2); ctx.stroke(); }
  };
  if (age === 'baby') { // crawling
    const c1 = Math.sin(t * 2.2) * mv, c2 = -c1;
    dollPass((e) => {
      limb3(e, -w * 0.18, -h * 0.35, -w * 0.25 + c1 * w * 0.08, -h * 0.05, -w * 0.45, -h * 0.12, h * 0.16, skin);
      limb(e, w * 0.16, -h * 0.42, w * 0.22 + c2 * w * 0.08, -h * 0.02, h * 0.14, skin);
      blob(e, ell(-w * 0.04, -h * 0.42, w * 0.3, h * 0.24), C('#9ad8ff'));
      blob(e, ell(-w * 0.27, -h * 0.4, w * 0.15, h * 0.2), C('#ffffff'));
      limb(e, w * 0.06, -h * 0.4, w * 0.12 + c1 * w * 0.08, -h * 0.02, h * 0.14, skin);
      blob(e, circ(w * 0.3, -h * 0.6, h * 0.31), skin);
    });
    ctx.strokeStyle = C('#c88a50'); ctx.lineWidth = h * 0.05; ctx.beginPath(); ctx.arc(w * 0.27, -h * 0.92, h * 0.07, Math.PI * 0.2, Math.PI * 1.6); ctx.stroke();
    eyes(w * 0.3, -h * 0.64, h * 0.035);
    ctx.fillStyle = C('#ff8ab0'); ctx.beginPath(); ctx.arc(w * 0.47, -h * 0.5, h * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,120,0.35)'; ctx.beginPath(); ctx.arc(w * 0.22, -h * 0.52, h * 0.05, 0, Math.PI * 2); ctx.fill();
    return;
  }
  const P = { kid: { head: 0.2, torso: [0.42, 0.78], shirt: '#e85a5a', pants: '#3a6ad8', hair: '#8a5a2a' }, adult: { head: 0.13, torso: [0.46, 0.86], shirt: '#3ab87a', pants: '#2a4a8a', hair: '#5a3a2a' }, grandpa: { head: 0.14, torso: [0.44, 0.82], shirt: '#a04a5a', pants: '#8a7a6a', hair: '#ffffff' } }[age];
  const hip = -h * P.torso[0], sh = -h * P.torso[1], hr = h * P.head, lean = age === 'grandpa' ? 0.22 : 0;
  const stride = air ? 0.5 : sw * 0.55 * mv, legL = h * P.torso[0];
  const foot = (s) => air ? [w * 0.12 * s, -h * 0.12] : [Math.sin(s * stride) * legL * 0.9 * (s > 0 ? 1 : -1) * 0.5 + 0, 0];
  const hx = Math.sin(lean) * (hip - sh) * -1, hy = sh + h * 0.02, headX = hx + hr * 0.25, headY = hy - hr * 0.95;
  const armSw = o.act ? -1.6 : sw * 0.6 * mv;
  dollPass((e) => {
    for (const s of [-1, 1]) { const fx = Math.sin(stride * s) * legL * 0.55, fy = air ? -h * 0.1 * (s + 1.5) : 0; limb3(e, 0, hip, fx * 0.5 + w * 0.04, hip * 0.45, fx, fy - h * 0.02, h * 0.13, s < 0 ? C(P.pants) : C(P.pants)); blob(e, ell(fx + w * 0.08, fy - h * 0.025, h * 0.08, h * 0.04), C('#3a2a2a')); }
    limb(e, hx * 0.6, sh + h * 0.06, hx * 0.6 - Math.sin(armSw) * h * 0.3, sh + h * 0.06 + Math.cos(armSw) * h * 0.3, h * 0.1, C(P.shirt));
    blob(e, () => { ctx.beginPath(); ctx.moveTo(-w * 0.2, hip + h * 0.02); ctx.lineTo(w * 0.2, hip + h * 0.02); ctx.lineTo(hx + w * 0.2, sh); ctx.quadraticCurveTo(hx, sh - h * 0.05, hx - w * 0.2, sh); ctx.closePath(); }, C(P.shirt));
    if (age === 'kid') blob(e, () => { ctx.beginPath(); ctx.rect(-w * 0.19, hip - (hip - sh) * 0.55, w * 0.38, h * 0.05); }, C('#ffffff'));
    if (age === 'grandpa') blob(e, () => { ctx.beginPath(); ctx.rect(hx * 0.5 - w * 0.03, sh + h * 0.04, w * 0.06, (hip - sh) * 0.9); }, C('#ffe8c8'));
    blob(e, circ(headX, headY, hr), skin);
    // front arm (+ cane / vacuum / slingshot)
    const ax0 = hx * 0.8 + w * 0.05, ay0 = sh + h * 0.06;
    const fa = age === 'grandpa' ? (o.caneT > 0 ? -2.4 + (0.32 - o.caneT) / 0.32 * 3.4 : 0.6 + sw * 0.15 * mv) : o.act ? -1.3 : -sw * 0.6 * mv;
    const hxx = ax0 + Math.sin(fa) * h * 0.3, hyy = ay0 + Math.cos(fa) * h * 0.3;
    if (age === 'grandpa') { const ca = fa + Math.PI * 0.02, L = h * 0.5; limb(e, hxx, hyy, hxx + Math.sin(ca) * L, hyy + Math.cos(ca) * L, h * 0.05, C('#7a4a2a')); ctx.strokeStyle = e ? '#ffffff' : C('#7a4a2a'); ctx.lineWidth = h * 0.05 + (e ? ow * 2 : 0); ctx.beginPath(); ctx.arc(hxx - Math.cos(ca) * h * 0.05, hyy + Math.sin(ca) * h * 0.05, h * 0.06, -ca - Math.PI, -ca); ctx.stroke(); }
    if (o.vac && age === 'adult') { limb3(e, hxx, hyy, hxx + h * 0.35, hyy + h * 0.1, hxx + h * 0.55, -h * 0.03, h * 0.05, C('#8a8a9a')); blob(e, ell(hxx + h * 0.6, -h * 0.04, h * 0.1, h * 0.04), C('#e85a5a')); }
    limb(e, ax0, ay0, hxx, hyy, h * 0.1, C(P.shirt));
    blob(e, circ(hxx, hyy, h * 0.05), skin);
  });
  // hair & face (no sticker edge needed)
  if (age === 'kid') { ctx.fillStyle = C('#3a6ad8'); ctx.beginPath(); ctx.arc(headX, headY - hr * 0.15, hr * 1.02, Math.PI, 0); ctx.fill(); ctx.fillRect(headX, headY - hr * 0.25, hr * 1.4, hr * 0.22); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(headX, headY - hr * 0.8, hr * 0.15, 0, Math.PI * 2); ctx.fill(); }
  if (age === 'adult') { ctx.fillStyle = C(P.hair); ctx.beginPath(); ctx.arc(headX - hr * 0.1, headY - hr * 0.2, hr * 1.02, Math.PI * 0.95, Math.PI * 1.9); ctx.quadraticCurveTo(headX + hr * 0.6, headY - hr * 0.6, headX - hr * 0.1, headY - hr * 0.2); ctx.fill(); }
  if (age === 'grandpa') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(headX - hr * 0.75, headY, hr * 0.35, hr * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(headX + hr * 0.45, headY + hr * 0.45, hr * 0.42, hr * 0.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(headX - hr * 0.2, headY - hr * 0.6, hr * 0.15, 0, Math.PI * 2); ctx.fill(); }
  eyes(headX + hr * 0.25, headY - hr * 0.05, hr * 0.1, age === 'grandpa');
  ctx.strokeStyle = '#a04a4a'; ctx.lineWidth = hr * 0.08; ctx.beginPath(); ctx.arc(headX + hr * 0.45, headY + hr * 0.3, hr * 0.22, 0.2, Math.PI - 0.6); ctx.stroke();
  if (age === 'kid' && o.act) { ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = h * 0.03; ctx.beginPath(); ctx.moveTo(headX + hr * 1.6, headY + hr * 0.6); ctx.lineTo(headX + hr * 2.2, headY - hr * 0.2); ctx.moveTo(headX + hr * 1.6, headY + hr * 0.6); ctx.lineTo(headX + hr * 2.4, headY + hr * 0.5); ctx.stroke(); }
}
function drawPD(kind, w, h, t, red, gold, flash, moving) {
  const ow = Math.max(2 / cam.zoom, h * 0.05);
  const C = (c) => (flash ? '#ffffff' : gold ? '#ffd23a' : c);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'crumb') {
    const build = () => { ctx.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, r = h * (0.42 + hash(k * 3.3 + w) * 0.12); const px = Math.cos(a) * r * 1.1, py = -h * 0.42 + Math.sin(a) * r * 0.85; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); };
    dollPass((e) => { build(); if (e) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ow * 2; ctx.stroke(); } else { ctx.fillStyle = C('#e0a860'); ctx.fill(); } });
    ctx.fillStyle = C('#5a3420'); for (const [a, b] of [[-0.2, -0.5], [0.2, -0.35], [0.05, -0.65]]) { ctx.beginPath(); ctx.arc(a * w, b * h, h * 0.08, 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  // an ant, side view
  const col = C(red ? '#d0442a' : '#2a2030'), st = moving ? Math.sin(t * 14) : 0;
  dollPass((e) => {
    ctx.strokeStyle = e ? '#ffffff' : col; ctx.lineWidth = h * 0.06 + (e ? ow * 2 : 0);
    ctx.beginPath();
    for (let k = -1; k <= 1; k++) { const bx = k * w * 0.1, ph = (k % 2 ? st : -st) * w * 0.08; ctx.moveTo(bx, -h * 0.42); ctx.lineTo(bx + w * 0.08 * k + ph, -h * 0.65); ctx.lineTo(bx + w * 0.14 * k - ph, 0); }
    ctx.moveTo(w * 0.36, -h * 0.65); ctx.quadraticCurveTo(w * 0.42, -h * 1.05, w * 0.58, -h * 1.0);
    ctx.stroke();
    for (const [x, y, rx, ry] of [[-w * 0.3, -h * 0.5, w * 0.2, h * 0.3], [0, -h * 0.45, w * 0.12, h * 0.17], [w * 0.32, -h * 0.55, w * 0.13, h * 0.2]]) {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      if (e) { ctx.lineWidth = ow * 2; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fill(); } else { ctx.fillStyle = col; ctx.fill(); }
    }
  });
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(w * 0.37, -h * 0.6, h * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(w * 0.39, -h * 0.6, h * 0.035, 0, Math.PI * 2); ctx.fill();
}
function drawVecCreature(c) {
  const col = c.flash > 0 ? '#ffffff' : c.gold ? '#ffd23a' : c.sp.col;
  const t = realT + c.seed * 10;
  if (c.boss && c.segP) { // OUROBOROS' body, tail first
    for (let i = c.segP.length - 1; i >= 0; i--) {
      const [x, y] = c.segP[i], r = c.h * 0.42 * (1 - i / 16), sc = i % 2 ? '#ff3af0' : '#b46aff';
      ctx.save(); ctx.translate(x, y);
      glow(c.flash > 0 ? '#ffffff' : sc, Math.max(1.6 / cam.zoom, c.h * 0.05), () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); for (let k = 0; k < 3; k++) { const a = realT * 0.8 + i + k * 2.1; ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45); } }, 0.15);
      ctx.restore();
    }
  }
  ctx.save(); ctx.translate(c.x, c.y);
  const oriented = c.vec === 'tri' || c.vec === 'shark' || c.vec === 'serpent';
  if (oriented) {
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > c.h * 0.1) c.vang = Math.atan2(c.vy, c.vx);
    const a = c.vang !== undefined ? c.vang : (c.face > 0 ? 0 : Math.PI);
    ctx.rotate(a); if (Math.cos(a) < 0) ctx.scale(1, -1);
  } else { ctx.rotate(-cam.rot); ctx.scale(c.face, 1); }
  if (c.stun > 0) ctx.rotate(Math.sin(realT * 18) * 0.25);
  drawVecShape(c.vec, c.w, c.h, t, col, c.seed);
  ctx.restore();
}
function drawVecPlayer(p, f) {
  const col = p.hurtFlash > 0 ? '#ff4a4a' : p.dead ? '#56607a' : p.frenzyT > 0 ? '#ff3030' : f.col;
  const t = realT + p.phase * 0.3;
  if (f.vec === 'worm' && p.trail) { // a segmented body trailing behind the head
    const gap = p.h * 0.26, segs = []; let acc = 0, k = 1;
    for (let i = 1; i < p.trail.length && segs.length < 7; i++) { acc += Math.hypot(p.trail[i][0] - p.trail[i - 1][0], p.trail[i][1] - p.trail[i - 1][1]); if (acc >= gap * k) { segs.push(p.trail[i]); k++; } }
    for (let i = segs.length - 1; i >= 0; i--) { const [x, y] = segs[i]; ctx.save(); ctx.translate(x, y); glow(i % 2 ? col : '#b8ff3a', Math.max(1.6 / cam.zoom, p.h * 0.045), () => { ctx.beginPath(); ctx.arc(0, 0, p.h * (0.3 - i * 0.025), 0, Math.PI * 2); }, 0.2); ctx.restore(); }
  }
  if (f.aura) { ctx.fillStyle = f.aura + '1a'; ctx.beginPath(); ctx.arc(p.x, p.y, p.h * 0.95, 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.upA === undefined ? -Math.PI / 2 : p.upA) + Math.PI / 2);
  let sx = 1, sy = 1;
  if (p.pounce > 0) { sx = 1.18; sy = 0.86; }
  if (p.stomping) { sx = 0.85; sy = 1.2; }
  if (!p.onGround && !p.pounce && !p.stomping) { sy = 1.06; sx = 0.95; }
  if (p.dead) ctx.rotate(p.face * Math.PI / 2 * Math.min(1, (realT - p.deathT) * 2));
  ctx.scale(p.face * sx, sy);
  drawVecShape(f.vec, p.w, p.h, t, col);
  ctx.restore();
}
function drawScorches() {
  for (const s of scorches) {
    ctx.fillStyle = (s.color || 'rgba(20,10,5,') + Math.min(0.6, s.life / 12 * 0.6) + ')';
    ctx.beginPath(); ctx.ellipse(s.x, groundY(s.x) + 4, s.r, s.r * 0.18, Math.atan(groundSlope(s.x)), 0, Math.PI * 2); ctx.fill();
  }
}
function drawShadowBlob(x, w, h, y) {
  if (swim()) return;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, (houseMode ? floorAt(x, y === undefined ? 0 : y) : groundY(x)) + 2, w * 0.38, Math.max(2, h * 0.06), 0, 0, Math.PI * 2); ctx.fill();
}
function styledImage(key, opts) { // the image to draw for this sprite right now
  if (opts.flash) return tinted(key, '#ffffff', 0.85);
  if (opts.gold) return tinted(key, '#ffd23a', 0.5);
  if (opts.angry) return tinted(key, '#ff2a00', 0.25);
  if (opts.tint) return tinted(key, opts.tint[0], opts.tint[1]);
  return IMG[key];
}
function creatureFrame(c, moving) {
  const S = SPRITES[c.key], sp = c.bdef && c.bdef.walkF ? c.bdef : c.sp;
  if (S.frames <= 1) return 0;
  if ((c.flash > 0 || c.stun > 0) && sp.hitF !== undefined) return sp.hitF;
  const walkF = sp.walkF || allFrames(S.frames);
  if (c.actT > 0 && sp.actF) { const k = clamp(1 - c.actT / c.actMax, 0, 0.999); return sp.actF[Math.floor(k * sp.actF.length)]; }
  if (sp.jumpF && !c.onGround) return sp.jumpF[c.vy < 0 ? 0 : 1];
  if (c.flying || c.swim || STYLE === 'cartoon' || sp.ai === 'turret') return walkF[Math.floor(realT * (STYLE === 'cartoon' ? 6 : 10) + c.seed * 10) % walkF.length];
  if (moving) return walkF[Math.floor(c.phase * 1.6) % walkF.length];
  if (sp.idleF) return sp.idleF[Math.floor(realT * 6 + c.seed * 10) % sp.idleF.length];
  return walkF[0];
}
function drawWisp(c) {
  const r = c.h * 0.5, pulse = 0.8 + 0.2 * Math.sin(realT * 5 + c.seed * 9);
  const col = c.gold ? '255,210,58' : '200,255,250';
  ctx.fillStyle = `rgba(${col},0.18)`; ctx.beginPath(); ctx.arc(c.x, c.y - r, r * 2 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(${col},0.5)`; ctx.beginPath(); ctx.arc(c.x, c.y - r, r * 1.1 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(c.x, c.y - r, r * 0.45, 0, Math.PI * 2); ctx.fill();
}
function drawKraken(c) {
  const eyeOpen = c.state === 'open';
  // tentacles behind
  const tim = IMG.deep_tentacle;
  for (const t of c.tents) {
    if (t.t < 0.9 || t.a === undefined || !tim || !tim.width) continue;
    const gy = groundY(t.x), axis = Math.atan2(-tim.height * 0.9, tim.width * 0.85), iw = t.L / Math.hypot(0.85, 0.9 * tim.height / tim.width), ih = iw * tim.height / tim.width;
    ctx.save(); ctx.translate(t.x, gy + t.L * 0.05); ctx.rotate(t.a - axis);
    if (t.side < 0) ctx.scale(1, -1);
    ctx.drawImage(tim, 0, -ih, iw, ih); ctx.restore();
  }
  for (const t of c.tents) if (t.t < 0.9) { ctx.strokeStyle = 'rgba(255,230,120,0.6)'; ctx.lineWidth = 3 / cam.zoom; ctx.beginPath(); ctx.ellipse(t.x, groundY(t.x), c.h * 0.6, c.h * 0.12, 0, 0, Math.PI * 2); ctx.stroke(); }
  // the head: a dome of ink
  const R = c.w * 0.45, cx = c.x, cy = c.y + c.h * 0.1;
  ctx.fillStyle = c.flash > 0 ? '#3a3a50' : '#0b0d14';
  ctx.beginPath(); ctx.ellipse(cx, cy, R, c.h * 1.05, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(120,140,170,0.35)'; ctx.lineWidth = Math.max(2 / cam.zoom, c.h * 0.02);
  for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx + (k - 2.5) * R * 0.25, cy - c.h * 0.4, R * 0.1, c.h * 0.4, (k - 2.5) * 0.15, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  // eye
  const em = IMG.deep_eye, S = SPRITES.deep_eye;
  const closeK = eyeOpen ? clamp((3.2 - c.eyeT) / 0.25, 0, 1) : clamp((2.4 - c.eyeT) / 0.25, 0, 1);
  const fr = eyeOpen ? Math.round((1 - closeK) * 5) : Math.round(closeK * 5);
  const ew = R * 0.75, eh = ew * S.h / S.w;
  if (em && em.width) ctx.drawImage(eyeOpen ? tinted('deep_eye', '#ffe066', 0.35) : em, fr * S.w, 0, S.w, S.h, cx - ew / 2, cy - c.h * 0.62 - eh / 2, ew, eh);
  if (eyeOpen) { ctx.strokeStyle = `rgba(255,224,102,${0.4 + 0.3 * Math.sin(realT * 8)})`; ctx.lineWidth = c.h * 0.04; ctx.beginPath(); ctx.ellipse(cx, cy - c.h * 0.62, ew * 0.7, eh * 0.9, 0, 0, Math.PI * 2); ctx.stroke(); }
}
const MODEL_COL = { 'animal-chick': '#ffe066', 'animal-bunny': '#f4f0ea', 'animal-parrot': '#ff4a4a', 'animal-pig': '#ffa8c0', 'animal-cat': '#ff9a3a', 'animal-dog': '#c8945a', 'animal-monkey': '#8a5a3a', 'animal-hog': '#8a6a5a', 'animal-cow': '#ffffff', 'animal-giraffe': '#ffd060', 'animal-elephant': '#9aa8c0', 'animal-lion': '#e8a040', 'animal-tiger': '#ff8a1a', 'animal-caterpillar': '#7dd34a' };
function drawBlockPet(model, x, y, z, w, h, face, col, lie) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.45, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(x, y - z); if (lie) ctx.rotate(Math.PI / 2 * face);
  ctx.fillStyle = col || MODEL_COL[model] || '#fff'; ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = Math.max(1.5 / cam.zoom, h * 0.04);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h * 0.9, h * 0.18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(face * w * 0.22, -h * 0.68, h * 0.1, 0, Math.PI * 2); ctx.arc(face * w * 0.42, -h * 0.68, h * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a2a'; ctx.beginPath(); ctx.arc(face * w * 0.25, -h * 0.66, h * 0.05, 0, Math.PI * 2); ctx.arc(face * w * 0.45, -h * 0.66, h * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawCreature(c) {
  if (c.sp.draw === 'wisp') { drawWisp(c); return; }
  if (c.vec) { drawVecCreature(c); return; }
  if (c.pd) { drawShadowBlob(c.x, c.w, c.h, c.y); ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.face, 1); if (c.stun > 0) ctx.rotate(Math.sin(realT * 18) * 0.15); drawPD(c.pd, c.w, c.h, c.phase + c.seed * 9, c.sp.red, c.gold, c.flash > 0, Math.abs(c.vx) > c.h * 0.2); ctx.restore(); return; }
  if (houseMode && c.sp.ai === 'dropper' && !c.dropped) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1.5 / cam.zoom, c.h * 0.02); ctx.beginPath(); ctx.moveTo(c.x, c.y - c.h * 0.6); ctx.lineTo(c.x, c.y - cam.viewH * 2); ctx.stroke(); }
  if (c.model && STYLE === 'real') { ctx.fillStyle = c.model.startsWith('planet:') ? '#8a7a6a' : '#9aa4b0'; ctx.beginPath(); ctx.arc(c.x, c.y, c.h * 0.45, 0, Math.PI * 2); ctx.fill(); return; }
  if (c.model) { drawBlockPet(c.model, c.x, c.y, c.z, c.w, c.h, c.face, c.flash > 0 ? '#ffffff' : c.gold ? '#ffd23a' : null); return; }
  if (c.boss && c.bdef.ai === 'kraken') { drawKraken(c); return; }
  const S = SPRITES[c.key];
  const threat = isBigger(c);
  const img = styledImage(c.key, { flash: c.flash > 0 && STYLE !== 'cartoon', gold: c.gold, tint: c.tint, colored: c.sp.colored, boss: c.boss, threat, angry: (c.state === 'tele' || c.state === 'charge' || c.state === 'stampede') && !c.sp.vehicle });
  const moving = Math.abs(c.vx) > c.h * 0.15;
  const anim = S.frames > 1;
  let bob = 0, sx = 1, sy = 1, rot = 0, ox = 0, flipY = false;
  if (c.swim) {
    rot = clamp(Math.atan2(c.vy, Math.abs(c.vx) + 1) * 0.5, -0.5, 0.5) * c.face * (c.faceL ? -1 : 1) * -1;
    if (c.spKey === 'jellyE') { rot = 0; sy = 1 + Math.sin(c.phase * 1.3) * 0.12; sx = 2 - sy; }
    if (c.spKey === 'eelE') rot += Math.sin(realT * 6 + c.seed * 9) * 0.12;
  } else if (c.flying) {
    if (c.sp.flap) { const f = Math.sin(c.phase * 1.4); sy = 0.8 + 0.2 * Math.abs(f); }
    rot = clamp(c.vy / (c.h * 12), -0.5, 0.5) * c.face;
    if (c.state === 'dive') rot = Math.atan2(c.vy, Math.abs(c.vx)) * 0.6 * c.face;
  } else {
    drawShadowBlob(c.x, c.w, c.h, c.y);
    if (STYLE === 'cartoon') {
      const air = !c.onGround ? clamp(-c.vy / (c.h * 20), -0.18, 0.18) : 0;
      sy = 1 + air + (c.onGround ? Math.sin(realT * 5 + c.seed * 9) * 0.04 : 0); sx = 2 - sy;
    } else if (!anim && !c.sp.vehicle) {
      bob = moving ? Math.abs(Math.sin(c.phase * 2.2)) * c.h * 0.07 : 0;
      sy = 1 + (moving ? Math.sin(c.phase * 4.4) * 0.04 : Math.sin(realT * 2 + c.homeX) * 0.02);
    }
    rot = Math.atan(groundSlope(c.x)) * 0.8 + (moving && !anim && !c.sp.vehicle ? Math.sin(c.phase * 2.2) * 0.04 : 0);
    if (c.state === 'tele') ox = Math.sin(realT * 70) * c.h * 0.03;
    if (c.state === 'swing') rot += c.face * 0.12;
    if (c.state === 'lift') rot -= c.face * 0.08 * (1 - c.t / 0.45);
  }
  if (STYLE === 'ink') rot += (hash(Math.floor(realT * 7) + c.seed * 100) - 0.5) * 0.05;
  if (c.stun > 0) { rot += Math.sin(realT * 18) * 0.12; if (!c.onGround && !c.flying && c.spKey === 'ptero') flipY = true; }
  if (c.flash > 0 && STYLE === 'cartoon') { sx *= 1.12; sy *= 0.88; }
  const fr = creatureFrame(c, moving);
  const flip = (c.face > 0) === c.faceL;
  let x = c.x + ox, y = c.y - bob;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale((flip ? -1 : 1) * sx, sy * (flipY ? -1 : 1));
  ctx.drawImage(img, fr * S.w, 0, S.w, S.h, -c.w / 2, flipY ? 0 : -c.h, c.w, c.h);
  ctx.restore();
  if (c.webbed > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5 / cam.zoom, c.h * 0.03); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(c.x - c.w * 0.5, c.y - c.h * (0.2 + k * 0.2)); ctx.lineTo(c.x + c.w * 0.5, c.y - c.h * (0.1 + k * 0.22)); ctx.stroke(); } }
  if (c.glued > 0) { ctx.fillStyle = 'rgba(125,255,106,0.75)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(c.x + (hash(c.seed * 10 + k) - 0.5) * c.w * 0.7, c.y - c.h * hash(c.seed * 20 + k), c.h * 0.14, 0, Math.PI * 2); ctx.fill(); } }
}
function drawCorpse(co) {
  const f = 0.55 + 0.45 * (co.meat / co.maxMeat);
  if (co.pd) { ctx.save(); ctx.globalAlpha = Math.min(1, co.life / 3); ctx.translate(co.x, co.y); ctx.scale(1.3 * f, 0.35 * f); drawPD(co.pd, co.w, co.h, 0, co.red, false, false, false); ctx.restore(); return; }
  if (co.vec) { ctx.save(); ctx.globalAlpha = Math.min(1, co.life / 3) * 0.7; ctx.translate(co.x, co.y); ctx.rotate(realT * 0.6 + co.seed * 6); drawVecShape(co.vec, co.w * f, co.h * f, 0, '#56607a', co.seed); ctx.restore(); return; }
  if (co.model && STYLE === 'real') return;
  if (co.model) { drawBlockPet(co.model, co.x, co.y, 0, co.w * f, co.h * f, co.face, '#9a8a8a', true); return; }
  const S = SPRITES[co.key];
  ctx.save();
  ctx.globalAlpha = co.life < 3 ? co.life / 3 : 1;
  ctx.translate(co.x, co.y + co.yo);
  if (!co.sinks) ctx.rotate(Math.atan(groundSlope(co.x)));
  const flip = (co.face > 0) === co.faceL;
  let img;
  if (co.burnt || co.mode === 'wreck') img = tinted(co.key, '#2a1408', co.mode === 'wreck' ? 0.6 : 0.5);
  else if (co.mode === 'flip') img = tinted(co.key, '#5a4a4a', 0.3);
  else img = IMG[co.key];
  if (co.mode === 'squash') {
    ctx.fillStyle = 'rgba(125,255,106,0.5)'; ctx.beginPath(); ctx.ellipse(0, -co.h * 0.05, co.w * 0.65 * f, co.h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale((flip ? -1 : 1) * 1.3 * f, 0.32 * f);
    ctx.drawImage(img, co.hitF * S.w, 0, S.w, S.h, -co.w / 2, -co.h, co.w, co.h);
  } else if (co.mode === 'flip') { ctx.scale((flip ? -1 : 1) * f, -f); ctx.drawImage(img, 0, 0, S.w, S.h, -co.w / 2, 0, co.w, co.h); }
  else { ctx.scale((flip ? -1 : 1) * f, f); ctx.drawImage(img, 0, 0, S.w, S.h, -co.w / 2, -co.h, co.w, co.h); }
  ctx.restore();
}
function drawPlayer() {
  const p = player, f = form(), S = SPRITES[f.sheet];
  if (p.invuln > 0.35 && !p.dead && p.rollT <= 0 && Math.floor(realT * 20) % 2 === 0) return;
  if (f.vec) { drawVecPlayer(p, f); return; }
  if (f.space3d) { ctx.fillStyle = f.space3d === 'blackhole' ? '#000' : '#b0a898'; ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 3 / cam.zoom; ctx.beginPath(); ctx.arc(p.x, p.y, p.h * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); return; }
  if (f.human) {
    drawShadowBlob(p.x, p.w * 1.4, p.h, p.y);
    if (f.aura) { ctx.fillStyle = f.aura + '22'; ctx.beginPath(); ctx.arc(p.x, p.y - p.h * 0.5, p.h * 0.75, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(p.x, p.y);
    let sx = 1, sy = 1;
    if (p.squash > 0) { sy = 1 - p.squash * 2; sx = 1 + p.squash * 2; }
    if (p.pounce > 0) { sx = 1.12; sy = 0.9; ctx.rotate(0.15 * p.face); }
    if (p.dead) { ctx.translate(0, -p.h * 0.3); ctx.rotate(p.face * -Math.PI / 2 * Math.min(1, (realT - p.deathT) * 2)); }
    ctx.scale(p.face * sx, sy);
    drawHuman(f.human, p.w, p.h, p.phase, { moving: Math.abs(p.vx) > p.h * 0.3, air: !p.onGround, act: p.roarAnim > 0 || p.eatT > 0, caneT: p.caneT || 0, vac: p.vacT > 0, hurt: p.hurtFlash > 0, dead: p.dead });
    ctx.restore();
    return;
  }
  if (f.model) { drawBlockPet(f.model, p.x, p.y, p.z, p.w, p.h, p.face, p.hurtFlash > 0 ? '#ff6a6a' : null, p.dead); return; }
  drawShadowBlob(p.x, p.w, p.h);
  const moving = Math.abs(p.vx) > p.h * 0.3 || (swim() && Math.abs(p.vy) > p.h * 0.3);
  let frame;
  if (p.roarAnim > 0 || p.eatT > 0 || p.vacT > 0) frame = f.act[Math.floor(realT * 10) % f.act.length];
  else if (swim()) frame = f.walk[Math.floor(p.phase * 1.4) % f.walk.length];
  else if (!p.onGround) frame = f.walk[p.vy < 0 ? 1 % f.walk.length : 3 % f.walk.length];
  else if (moving) frame = f.walk[Math.floor(p.phase * 1.2) % f.walk.length];
  else frame = f.idle[Math.floor(realT * (STYLE === 'cartoon' ? 8 : 4)) % f.idle.length];
  let img;
  if (p.hurtFlash > 0) img = tinted(f.sheet, '#ff3030', 0.6);
  else if (p.dead) img = tinted(f.sheet, '#5a5a6a', 0.55);
  else img = styledImage(f.sheet, { player: true, tint: f.tint });
  if (p.frenzyT > 0) img = tinted(f.sheet, '#ff2020', 0.35);
  const flip = (p.face > 0) === f.faceL;
  let rot = p.onGround ? Math.atan(groundSlope(p.x)) * 0.8 : clamp(p.vy / (p.h * 40), -0.35, 0.35) * p.face;
  let sx = 1, sy = 1, bob = 0;
  if (swim()) {
    rot = f.swimTilt === false ? 0 : clamp(Math.atan2(p.vy, Math.abs(p.vx) + p.h) * 0.6, -0.6, 0.6) * p.face;
    if (f.swimTilt === false) { sy = 1 + Math.sin(p.phase * 1.3) * 0.1; sx = 2 - sy; }
  }
  if (p.pounce > 0) { sx = 1.18; sy = 0.86; rot = swim() ? rot : -0.15 * p.face; }
  if (p.stomping) { sx = 0.85; sy = 1.2; }
  if (!swim() && !p.onGround && !p.pounce && !p.stomping) { const k = f.bouncy || STYLE === 'cartoon' ? 90 : 60; sy = 1 + clamp(-p.vy / (p.h * k / 1.5), -0.2, 0.2); sx = 2 - sy; }
  if (p.squash > 0) { sy = 1 - p.squash * 2; sx = 1 + p.squash * 2; }
  if (STYLE === 'cartoon' && p.onGround && !moving) { sy *= 1 + Math.sin(realT * 5) * 0.03; sx = 2 - sy; }
  if (p.rollT > 0) rot = realT * 22 * p.face;
  if (p.dead) rot = p.face * -Math.PI / 2 * Math.min(1, (realT - p.deathT) * 2);
  if (STYLE === 'ink') rot += (hash(Math.floor(realT * 7)) - 0.5) * 0.05;
  let x = p.x, y = p.y;
  if (p.climb) { rot = -p.climb * 1.25; sx = 1; sy = 1 + Math.sin(realT * 14) * 0.05; }
  if (f.aura) { ctx.fillStyle = f.aura + '22'; ctx.beginPath(); ctx.arc(p.x, p.y - p.h * 0.5, Math.max(p.h, p.w * 0.6) * 0.9, 0, Math.PI * 2); ctx.fill(); }
  if (p.auraT > 0) {
    const R = p.auraR * p.h;
    ctx.strokeStyle = `rgba(191,248,255,${0.5 + Math.random() * 0.4})`; ctx.lineWidth = Math.max(1.5 / cam.zoom, p.h * 0.04);
    ctx.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2, rr = R * (0.85 + Math.random() * 0.25); const xx = p.x + Math.cos(a) * rr, yy = p.y - p.h * 0.5 + Math.sin(a) * rr; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
  }
  ctx.save();
  const mid = swim() || p.climb;
  ctx.translate(x, mid ? y - p.h * 0.5 : y);
  ctx.rotate(rot);
  ctx.scale((flip ? -1 : 1) * sx, sy);
  ctx.drawImage(img, frame * S.w, 0, S.w, S.h, -p.w / 2, mid ? -p.h * 0.5 : -p.h, p.w, p.h);
  ctx.restore();
  if (p.voidFx) {
    const v = p.voidFx, k = clamp(Math.min(v.max - v.t, v.t) / 0.4, 0, 1), r = v.r * 0.22 * k;
    const g = ctx.createRadialGradient(v.x, v.y, r * 0.2, v.x, v.y, r * 2.2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.45, 'rgba(20,0,40,0.9)'); g.addColorStop(0.7, 'rgba(122,58,255,0.35)'); g.addColorStop(1, 'rgba(122,58,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(v.x, v.y, r * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(122,255,234,0.7)'; ctx.lineWidth = r * 0.08;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(v.x, v.y, r * (1 + i * 0.3), realT * (3 + i) , realT * (3 + i) + Math.PI * 0.8); ctx.stroke(); }
  }
}
function drawProjectiles() {
  for (const b of projectiles) {
    const spec = SHOTS[b.kind];
    const ang = Math.atan2(b.vy, b.vx);
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang);
    if (b.kind === 'goo') {
      ctx.fillStyle = '#1a0c2a'; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.35, b.r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7dff6a'; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.15, b.r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(-b.r * 0.3, -b.r * 0.35, b.r * 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (b.kind === 'web') {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = b.r * 0.15;
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-b.r, 0); ctx.lineTo(b.r, 0); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, b.r * 0.6, 0, Math.PI * 2); ctx.stroke();
    } else if (b.kind === 'spike') {
      ctx.fillStyle = '#fff4e0'; ctx.strokeStyle = '#1a0c2a'; ctx.lineWidth = b.r * 0.15;
      ctx.beginPath(); ctx.moveTo(b.r * 1.2, 0); ctx.lineTo(-b.r * 0.8, -b.r * 0.3); ctx.lineTo(-b.r * 0.8, b.r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (b.kind === 'spear' || b.kind === 'arrow' || b.kind === 'harpoon') {
      ctx.fillStyle = spec.color; ctx.fillRect(-b.r, -b.r * 0.06, b.r * 2, b.r * 0.12);
      ctx.fillStyle = '#c8c8c8'; ctx.beginPath(); ctx.moveTo(b.r, -b.r * 0.15); ctx.lineTo(b.r * 1.3, 0); ctx.lineTo(b.r, b.r * 0.15); ctx.fill();
    } else if (b.kind === 'hex') {
      ctx.fillStyle = 'rgba(230,72,46,0.4)'; ctx.beginPath(); ctx.arc(0, 0, b.r * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd0c8'; ctx.beginPath(); ctx.arc(0, 0, b.r * 0.7, 0, Math.PI * 2); ctx.fill();
    } else if (b.kind === 'teeth') {
      ctx.rotate(realT * 12); const r = b.r, open = Math.abs(Math.sin(realT * 20)) * r * 0.5;
      ctx.fillStyle = '#ff8aa0'; ctx.beginPath(); ctx.ellipse(0, -open * 0.5, r * 1.3, r * 0.6, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, open * 0.5, r * 1.3, r * 0.6, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#ffffff'; for (let k = -2; k <= 2; k++) { ctx.fillRect(k * r * 0.45 - r * 0.18, -open * 0.5 - r * 0.05, r * 0.36, r * 0.35); ctx.fillRect(k * r * 0.45 - r * 0.18, open * 0.5 - r * 0.3, r * 0.36, r * 0.35); }
    } else if (b.kind === 'hairball') {
      ctx.rotate(realT * 6); ctx.fillStyle = '#9a9aa8'; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6a6a78'; ctx.lineWidth = b.r * 0.15; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(0, 0, b.r * (0.4 + (k % 3) * 0.2), k, k + 2); ctx.stroke(); }
    } else if (b.kind === 'plasma') {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r * 2); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.4, 'rgba(255,170,60,0.8)'); g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.r * 2, 0, Math.PI * 2); ctx.fill();
    } else if (b.kind === 'laser') {
      glow(b.team === 'player' ? '#3affd8' : '#ff5ad8', b.r * 0.8, () => { ctx.beginPath(); ctx.moveTo(-b.r * 6, 0); ctx.lineTo(b.r * 2, 0); }, 0);
    } else if (b.kind === 'star') {
      ctx.rotate(realT * 10);
      glow(b.team === 'player' ? '#ffe066' : '#ff3af0', b.r * 0.35, () => { ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? b.r * 0.45 : b.r * 1.3; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }, 0.5);
    } else if (b.kind === 'barrel') {
      ctx.rotate(realT * 8);
      ctx.fillStyle = '#5a4430'; ctx.fillRect(-b.r * 0.8, -b.r, b.r * 1.6, b.r * 2);
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-b.r * 0.85, -b.r * 0.6, b.r * 1.7, b.r * 0.2); ctx.fillRect(-b.r * 0.85, b.r * 0.4, b.r * 1.7, b.r * 0.2);
    } else if (b.kind === 'bullet') {
      ctx.fillStyle = 'rgba(255,240,180,0.5)'; ctx.fillRect(-b.r * 8, -b.r * 0.6, b.r * 8, b.r * 1.2);
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(0, 0, b.r * 1.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = spec.color; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
      if (b.kind === 'coconut') { ctx.fillStyle = '#3a2210'; ctx.beginPath(); ctx.arc(-b.r * 0.3, -b.r * 0.2, b.r * 0.15, 0, Math.PI * 2); ctx.arc(b.r * 0.1, -b.r * 0.35, b.r * 0.15, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }
}
function drawBeam() {
  const b = player.active && player.beam;
  if (!b) return;
  const k = clamp(Math.min(b.t, b.max - b.t) / 0.15, 0, 1), w = b.w * (0.75 + 0.25 * Math.sin(realT * 50)) * k;
  ctx.lineCap = 'round';
  const line = (col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke(); };
  line('rgba(255,255,255,0.18)', w * 4.5); line('rgba(255,255,255,0.45)', w * 2.2); line('#ffffff', w);
  if (!b.atomic) { // ray-gun rings travelling down the beam
    const dx = b.x1 - b.x0, dy = b.y1 - b.y0, a = Math.atan2(dy, dx);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = w * 0.3;
    for (let i = 0; i < 6; i++) { const t = (realT * 3 + i / 6) % 1; ctx.beginPath(); ctx.ellipse(b.x0 + dx * t, b.y0 + dy * t, w * 0.6, w * 1.8, a, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.lineCap = 'butt';
}
function drawSolFx() {
  if (!orbitMode || !player.active) return;
  const f = form();
  if (f.space3d === 'blackhole') { // a thin photon ring around the event horizon
    const r = player.h * 0.32;
    ctx.strokeStyle = `rgba(255,230,190,${0.55 + Math.sin(realT * 6) * 0.15})`; ctx.lineWidth = Math.max(1.5 / cam.zoom, player.h * 0.025);
    ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI * 2); ctx.stroke();
  }
}
function drawBossFx() {
  drawSolFx();
  if (!boss || !boss.waves || !boss.waves.length) return;
  for (const w of boss.waves) {
    ctx.strokeStyle = 'rgba(255,210,58,0.85)'; ctx.lineWidth = player.h * 0.35;
    ctx.beginPath(); ctx.arc(boss.x, boss.y, w.r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = player.h * 0.1; ctx.stroke();
  }
}
function drawParticles() {
  if (STYLE === 'neon') ctx.globalCompositeOperation = 'lighter';
  for (const pa of particles) {
    const a = clamp(pa.life / pa.max, 0, 1);
    if (pa.kind === 'ring') {
      const t = 1 - a, r = lerp(pa.r0, pa.r1, 1 - Math.pow(1 - t, 3));
      ctx.globalAlpha = a; ctx.strokeStyle = pa.color; ctx.lineWidth = pa.width / cam.zoom * (0.5 + a);
      ctx.beginPath(); ctx.arc(pa.x, pa.y, r, 0, Math.PI * 2); ctx.stroke();
    } else if (pa.kind === 'bolt') {
      ctx.globalAlpha = a; ctx.strokeStyle = pa.color; ctx.lineWidth = Math.max(1.5 / cam.zoom, 3 / cam.zoom);
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y);
      const n = 6, dx = pa.x1 - pa.x, dy = pa.y1 - pa.y, L = Math.hypot(dx, dy) || 1;
      for (let i = 1; i < n; i++) { const j = (hash(pa.seed + i + Math.floor(realT * 30)) - 0.5) * L * 0.25; ctx.lineTo(pa.x + dx * i / n - dy / L * j, pa.y + dy * i / n + dx / L * j); }
      ctx.lineTo(pa.x1, pa.y1); ctx.stroke();
    } else if (pa.kind === 'beamcol') {
      ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(pa.x - pa.r, pa.y - 4000, pa.r * 2, 4000);
    } else if (pa.kind === 'note') {
      ctx.globalAlpha = Math.min(1, a * 2); ctx.fillStyle = pa.color; ctx.font = `${Math.round(pa.size * 2)}px "Chewy", sans-serif`; ctx.textAlign = 'center';
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = pa.size * 0.25; ctx.strokeText('♪', pa.x, pa.y); ctx.fillText('♪', pa.x, pa.y);
    } else if (pa.kind === 'bubble') {
      ctx.globalAlpha = Math.min(1, a * 2) * 0.7; ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = Math.max(1 / cam.zoom, pa.size * 0.25);
      ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.size, 0, Math.PI * 2); ctx.stroke();
    } else if (pa.kind === 'suck') {
      ctx.globalAlpha = a; ctx.fillStyle = pa.color; ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.size * (0.3 + a), 0, Math.PI * 2); ctx.fill();
    } else if (pa.kind === 'smoke') {
      ctx.globalAlpha = a * 0.6; ctx.fillStyle = pa.color;
      ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.size, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = Math.min(1, a * 2); ctx.fillStyle = pa.color;
      const s = pa.size * (0.4 + a * 0.6);
      if (STYLE === 'cartoon' || STYLE === '3d' || STYLE === 'neon') { ctx.beginPath(); ctx.arc(pa.x, pa.y, s * 0.6, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(pa.x - s / 2, pa.y - s / 2, s, s);
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function drawMeteors() {
  for (const m of meteors) {
    const k = 1 - m.t / m.T, R = m.r * 1.35;
    const col = { meteor: '255,50,30', goo: '125,255,106', charge: '255,210,120', gift: '255,90,216', shell: '255,255,255', comet: '255,224,102', block: '255,122,89' }[m.kind];
    ctx.strokeStyle = `rgba(${col},${0.4 + 0.5 * Math.abs(Math.sin(realT * 12))})`;
    ctx.lineWidth = Math.max(2 / cam.zoom, 3);
    if (m.kind === 'comet') {
      ctx.beginPath(); ctx.arc(m.tx, m.ty, R, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = `rgba(${col},${0.06 + k * 0.16})`; ctx.beginPath(); ctx.arc(m.tx, m.ty, R * k, 0, Math.PI * 2); ctx.fill();
      const a = Math.atan2(m.vy, m.vx);
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(a);
      const tg = ctx.createLinearGradient(-m.r * 3, 0, 0, 0); tg.addColorStop(0, 'rgba(255,138,58,0)'); tg.addColorStop(1, 'rgba(255,224,102,0.9)');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-m.r * 3, 0); ctx.lineTo(0, -m.r * 0.25); ctx.lineTo(0, m.r * 0.25); ctx.fill();
      glow('#ffe066', m.r * 0.05, () => { ctx.beginPath(); ctx.arc(0, 0, m.r * 0.25, 0, Math.PI * 2); }, 0.6);
      ctx.restore();
      continue;
    }
    if (m.kind === 'charge') { ctx.beginPath(); ctx.arc(m.tx, m.ty, R, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = `rgba(${col},${0.08 + k * 0.18})`; ctx.beginPath(); ctx.arc(m.tx, m.ty, R * k, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(m.tx, m.ty, R, R * 0.22, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = `rgba(${col},${0.12 + k * 0.25})`; ctx.beginPath(); ctx.ellipse(m.tx, m.ty, R * k, R * 0.22 * k, 0, 0, Math.PI * 2); ctx.fill(); }
    if (m.kind === 'block') {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.t * 4 + (m.seed || 0) * 6);
      const s = m.r * 0.38, col = CONFETTI[Math.floor((m.seed || 0) * 6)];
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-s - 4, -s - 4, s * 2 + 8, s * 2 + 8); ctx.fillStyle = col; ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.round(s * 1.5)}px "Chewy", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('ABCXYZ'[Math.floor((m.seed || 0) * 6)], 0, s * 0.55);
      ctx.restore();
      continue;
    }
    if (m.kind === 'gift') {
      if (use3D()) continue;
      ctx.fillStyle = CONFETTI[Math.floor((m.seed || 0) * 6)]; ctx.fillRect(m.x - m.r * 0.4, m.y - m.r * 0.4, m.r * 0.8, m.r * 0.7);
      ctx.fillStyle = '#fff'; ctx.fillRect(m.x - m.r * 0.06, m.y - m.r * 0.4, m.r * 0.12, m.r * 0.7); ctx.fillRect(m.x - m.r * 0.4, m.y - m.r * 0.1, m.r * 0.8, m.r * 0.1);
      continue;
    }
    if (m.kind === 'shell') {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(Math.atan2(m.vy, m.vx));
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(0, 0, m.r * 0.32, m.r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-m.r * 1.2, -m.r * 0.04, m.r * 0.9, m.r * 0.08);
      ctx.restore();
      continue;
    }
    if (m.kind === 'charge') {
      ctx.fillStyle = '#2a2a30'; ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = m.r * 0.04;
      ctx.beginPath(); ctx.roundRect(m.x - m.r * 0.18, m.y - m.r * 0.25, m.r * 0.36, m.r * 0.5, m.r * 0.08); ctx.fill(); ctx.stroke();
      ctx.fillStyle = Math.floor(realT * 8) % 2 ? '#ff3030' : '#ffd23a'; ctx.beginPath(); ctx.arc(m.x, m.y - m.r * 0.3, m.r * 0.05, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (m.kind === 'goo') {
      ctx.fillStyle = '#1a0c2a'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.33, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7dff6a'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(m.x - m.r * 0.08, m.y - m.r * 0.08, m.r * 0.08, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (m.kind === 'shard') { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = m.r * 0.08; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.12, m.y - m.vy * 0.12); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.12, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.fillStyle = 'rgba(255,200,80,0.35)'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2e22'; ctx.beginPath(); ctx.arc(m.x - m.r * 0.05, m.y - m.r * 0.05, m.r * 0.21, 0, Math.PI * 2); ctx.fill();
  }
}
function drawIndicators() {
  if (!player.active || player.dead) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const c of creatures) {
    if (c.boss || c.ally) continue;
    let [sx, sy0] = openMode ? toScreen(c.x, c.y) : toScreen(c.x, c.y - c.h * (c.spKey === 'ptero' ? 0.9 : 1.02) - c.z);
    if (openMode) sy0 -= c.h * 0.62 * cam.zoom;
    if (sx < -20 || sx > W + 20 || sy0 < -20 || sy0 > H + 20) continue;
    const sy = sy0 - 10 + Math.sin(realT * 6 + c.homeX) * 3;
    if (canEat(c)) {
      if (c.mass < player.mass * 0.22 && !c.gold) continue;
      ctx.fillStyle = c.gold ? '#ffd23a' : '#7dff6a';
      ctx.beginPath(); ctx.moveTo(sx - 6, sy - 8); ctx.lineTo(sx + 6, sy - 8); ctx.lineTo(sx, sy); ctx.fill();
    } else if (c.state === 'tele' || c.state === 'aim' || c.state === 'atk' || c.state === 'swing' || c.state === 'lift') {
      ctx.font = `20px "Press Start 2P", monospace`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe14a';
      ctx.fillText('!', sx, sy - 4 + Math.sin(realT * 40) * 2);
    } else if (canHurtByContact(c) || c.sp.shot || c.sp.ai === 'melee' || c.sp.ai === 'tank' || c.sp.ai === 'giant' || c.sp.contact) {
      ctx.fillStyle = '#ff3b3b';
      ctx.beginPath(); ctx.arc(sx, sy - 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(sx - 1, sy - 10, 2, 5); ctx.fillRect(sx - 1, sy - 4, 2, 2);
    }
  }
  if (boss) {
    const [sx, sy] = toScreen(boss.x, boss.y - boss.h * 0.5);
    if (sx < 0 || sx > W || sy < 0 || sy > H) {
      const ax = clamp(sx, 26, W - 26), ay = clamp(sy, 90, H - 60);
      const a = Math.atan2(sy - ay, sx - ax);
      ctx.fillStyle = '#ff3b3b'; ctx.beginPath();
      ctx.moveTo(ax + Math.cos(a) * 14, ay + Math.sin(a) * 14); ctx.lineTo(ax + Math.cos(a + 2.4) * 12, ay + Math.sin(a + 2.4) * 12); ctx.lineTo(ax + Math.cos(a - 2.4) * 12, ay + Math.sin(a - 2.4) * 12);
      ctx.fill();
    }
  }
}
function drawTexts() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.textAlign = 'center';
  for (const t of texts) {
    const [sx, sy1] = toScreen(t.x, t.y), sy = sy1 + (t.oy || 0) * cam.zoom;
    const a = clamp(t.life / t.max, 0, 1), pop = 1 + Math.max(0, a - 0.8) * 2;
    ctx.globalAlpha = Math.min(1, a * 2);
    ctx.font = `${Math.round(t.size * pop * ERA.fontScale)}px ${FONT()}`;
    ctx.fillStyle = '#000'; ctx.fillText(t.text, sx + 2, sy + 2);
    ctx.fillStyle = t.color; ctx.fillText(t.text, sx, sy);
  }
  ctx.globalAlpha = 1;
}
function drawOverlayFx() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (STYLE === 'sticker') { // a scrapbook page: soft paper grain and a warm vignette
    ctx.globalAlpha = 0.22; const pat = ctx.createPattern(grain, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,70,30,0.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (STYLE === 'neon') { // vector-monitor scanlines and a soft vignette
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,0,30,0.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (water()) { // ambient motes
    ctx.fillStyle = 'rgba(230,246,255,0.35)';
    for (let i = 0; i < 40; i++) { const x = ((hash(i) * W * 1.4 - bgMid * 0.5 + realT * 6) % W + W) % W, y = ((hash(i + 5) * H - realT * (8 + hash(i) * 12)) % H + H) % H; ctx.fillRect(x, y, 2, 2); }
  }
  if (STYLE === 'ink') {
    const off = Math.floor(realT * 24) % 4;
    ctx.globalAlpha = 0.35;
    const pat = ctx.createPattern(grain, 'repeat'); ctx.fillStyle = pat; ctx.save(); ctx.translate(off * 37, off * 23); ctx.fillRect(-160, -160, W + 320, H + 320); ctx.restore();
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,8,20,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}
// CREATURE FEATURE: everything (HUD included) goes through an old black-and-white TV
function filmPost() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const fl = Math.random();
  ctx.fillStyle = fl < 0.5 ? `rgba(0,0,0,${fl * 0.1})` : `rgba(255,255,240,${(fl - 0.5) * 0.07})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.6;
  const pat = ctx.createPattern(grain, 'repeat'); ctx.fillStyle = pat; ctx.save(); ctx.translate(Math.random() * 160, Math.random() * 160); ctx.fillRect(-160, -160, W + 320, H + 320); ctx.restore();
  ctx.globalAlpha = 1;
  if (Math.random() < 0.35) { const x = rand(W); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + rand(-10, 10), H); ctx.stroke(); }
  if (Math.random() < 0.15) { const x = rand(W); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + rand(-6, 6), H); ctx.stroke(); }
  for (let i = 0; i < 3; i++) if (Math.random() < 0.25) {
    const x = rand(W), y = rand(H), s = rand(2, 7);
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)';
    if (Math.random() < 0.6) { ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + s * 3, y - s * 2, x + s * 2, y + s * 4, x + s * 6, y + s); ctx.stroke(); }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const m = Math.min(W, H) * 0.012, r = Math.min(W, H) * 0.06;
  ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.roundRect(m, m, W - m * 2, H - m * 2, r); ctx.fill('evenodd');
}

// ============================================================ HUD}

// ============================================================ HUD
function txt(s, x, y, size, color, align = 'left', shadow = true, font) {
  const fs = size * (font ? 1 : ERA.fontScale);
  ctx.font = `${fs}px ${font || FONT()}`; ctx.textAlign = align;
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText(s, x + Math.max(2, fs / 10), y + Math.max(2, fs / 10)); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function bar(x, y, w, h, frac, col) {
  if (STYLE === 'neon') { ctx.shadowColor = '#3affd8'; ctx.shadowBlur = 10; ctx.strokeStyle = '#3affd8'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, w + 6, h + 6); ctx.shadowColor = col; ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h); ctx.shadowBlur = 0; return; }
  if (STYLE === 'film') { ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 2; ctx.strokeRect(x - 2, y - 2, w + 4, h + 4); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h); return; }
  if (STYLE === 'real') { ctx.strokeStyle = 'rgba(232,238,248,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5); ctx.fillStyle = 'rgba(10,14,24,0.6)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h); return; }
  if (STYLE === 'sticker') {
    ctx.save(); ctx.shadowColor = 'rgba(60,40,70,0.3)'; ctx.shadowOffsetY = 3; ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, h + 10, h); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#e8d8c8'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2); ctx.fill();
    return;
  }
  if (STYLE === 'cartoon' || STYLE === '3d') {
    if (STYLE === '3d') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, h + 10, h); ctx.fill(); }
    ctx.fillStyle = '#1a0c2a'; ctx.beginPath(); ctx.roundRect(x - 4, y - 4, w + 8, h + 8, h); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.roundRect(x + 3, y + 2, Math.max(0, w * clamp(frac, 0, 1) - 6), h * 0.3, h * 0.15); ctx.fill();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#2a1a12'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h * 0.35);
}
function fmtMass(m) { const kg = m * KG; return kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : Math.round(kg) + ' kg'; }
function fmtTime(t) { const s = Math.floor(t); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function uiCol(c) { return c; }
function drawHUD() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const u = clamp(Math.min(W, H) / 700, 0.6, 1.3);
  const p = player, f = form();
  const m = (STYLE === 'film' ? 30 : 18) * u, ui = THEME.ui, acc = THEME.accent;
  const low = p.belly < 25;
  const bc = p.belly > 55 ? '#7dd34a' : p.belly > 25 ? '#ffc93a' : (Math.floor(realT * 6) % 2 ? '#ff3b3b' : '#ff8a6a');
  txt('BELLY', m, m + 12 * u, 11 * u, low ? '#ff6b6b' : uiCol(ui));
  bar(m, m + 20 * u, 240 * u, 16 * u, p.belly / 100, bc);
  if ((event && event.t === 'frenzy') || clearT > 0) txt('FULL!', m + 252 * u, m + 34 * u, 10 * u, uiCol(acc));
  const nextAt = ERA.at[p.form + 1];
  txt(f.name, m, m + 62 * u, 13 * u, uiCol(f.aura || ui));
  txt(fmtMass(p.mass), m + 240 * u, m + 62 * u, 9 * u, uiCol(ui), 'right');
  if (nextAt !== undefined) {
    const frac = (p.mass - ERA.at[p.form]) / (nextAt - ERA.at[p.form]);
    bar(m, m + 70 * u, 240 * u, 8 * u, frac, '#c070ff');
    txt('next: ' + FORMS[ERA.forms[p.form + 1]].name, m, m + 94 * u, 8 * u, uiCol('#c8a8e8'));
  } else { bar(m, m + 70 * u, 240 * u, 8 * u, 1, acc); txt(boss ? 'devour ' + boss.bdef.name : clearT > 0 ? 'the next universe calls...' : 'FINAL FORM', m, m + 94 * u, 8 * u, uiCol(acc)); }
  for (let i = 0; i < ERAS.length; i++) {
    ctx.fillStyle = i < eraIdx ? acc : i === eraIdx ? '#ffffff' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(m + i * 22 * u, m + 108 * u, 14 * u, 6 * u);
  }
  txt(ERA.episode + ' · ' + ERA.name, m + ERAS.length * 22 * u + 4 * u, m + 114 * u, 7 * u, uiCol(ui));
  txt(String(p.score).padStart(7, '0'), W - m, m + 22 * u, 20 * u, uiCol('#fff'), 'right');
  txt('BEST ' + Math.max(best, p.score), W - m, m + 44 * u, 9 * u, uiCol(ui), 'right');
  txt(fmtTime(gameT) + (cycle > 1 ? '  C' + cycle : ''), W - m, m + 62 * u, 9 * u, uiCol(ui), 'right');
  if (p.combo > 1) {
    const s = (16 + Math.min(p.combo, 20)) * u, wob = Math.sin(realT * 20) * 2 * u;
    txt('x' + p.combo + ' COMBO', W - m, m + 96 * u + wob, s, uiCol(p.combo >= 8 ? '#ff7ad9' : p.combo >= 4 ? acc : '#fff'), 'right');
  }
  if (boss) {
    const bw = Math.min(W * 0.5, 460 * u), bx = W / 2 - bw / 2, by = m + 42 * u;
    txt(boss.bdef.name, W / 2, by - 8 * u, 12 * u, uiCol('#ff6b5a'), 'center');
    bar(bx, by, bw, 12 * u, boss.hp / boss.maxHp, '#ff3b3b');
    if (boss.bdef.ai === 'kinglion') txt('JUMP [SPACE] over the roar rings!', W / 2, by + 30 * u, 8 * u, '#ffe066', 'center');
    if (boss.bdef.ai === 'kraken') txt(boss.state === 'open' ? 'THE EYE IS OPEN — BITE IT!' : 'eye closed: bites barely scratch it', W / 2, by + 30 * u, 8 * u, uiCol(boss.state === 'open' ? '#ffe066' : ui), 'center');
  }
  if (!isTouch) drawAbilityBar(u, m);
  if (event && event.time > 0 && !banner) txt(event.name.replace('!', '') + '  ' + Math.ceil(event.time), W / 2, m + (boss ? 96 : 18) * u, 11 * u, uiCol('#ffb070'), 'center');
  if (banner && state !== 'dead' && state !== 'victory') {
    const a = banner.t / banner.max, pop = a > 0.85 ? 1 + (a - 0.85) * 4 : 1;
    ctx.globalAlpha = Math.min(1, banner.t * 2);
    const bs = Math.min(30 * u, (W * 0.9) / (banner.text.length * 1.05 * ERA.fontScale)) * pop;
    txt(banner.text, W / 2, H * 0.3, Math.round(bs), uiCol(banner.color), 'center');
    if (banner.sub) txt(banner.sub, W / 2, H * 0.3 + bs * ERA.fontScale * 0.6 + 22 * u, Math.min(11 * u, (W * 0.92) / (banner.sub.length * 1.05 * ERA.fontScale)), uiCol('#fff'), 'center');
    ctx.globalAlpha = 1;
  }
  if (hint && hint.t > 0 && state !== 'dead') {
    ctx.globalAlpha = Math.min(1, hint.t);
    txt(hint.text, W / 2, isTouch ? H * 0.6 : H - 82 * u, Math.min(10 * u, (W * 0.94) / (hint.text.length * ERA.fontScale)), uiCol('#fff8e0'), 'center');
    ctx.globalAlpha = 1;
  }
  if (low && !p.dead) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,0,0,${0.18 + Math.sin(realT * 8) * 0.08})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    txt('HUNGRY!', W / 2, H * 0.18, 14 * u, '#ff6b6b', 'center');
  }
  if (SFX.muted) txt('MUTED (M)', W / 2, H - 14 * u, 8 * u, '#aaa', 'center');
}
function drawAbilityBar(u, m) {
  const p = player, f = form();
  const finalF = FORMS[ERA.forms[ERA.forms.length - 1]];
  const slots = [['POUNCE', 'SHIFT', true, p.pounceCD, CD.pounce]];
  if (finalF.smash) slots.push(['SMASH', 'S air', !!f.smash, p.stomping ? CD.smash : p.smashCD, CD.smash]);
  for (let i = 0; i < finalF.abilities.length; i++) {
    const key = f.abilities[i];
    if (key) slots.push([ABILITIES[key].name, 'ERQ'[i], true, p.cds[i], ABILITIES[key].cd]);
    else slots.push(['???', 'ERQ'[i], false, 0, 1]);
  }
  const bw = 96 * u, bh = 42 * u;
  slots.forEach(([name, key, unlocked, cd, max], i) => {
    const x = m + i * (bw + 6 * u), y = H - m - bh;
    const fr = clamp(cd / max, 0, 1);
    if (STYLE === 'cartoon') { ctx.fillStyle = '#1a0c2a'; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 10 * u); ctx.fill(); }
    else if (STYLE === '3d') { ctx.fillStyle = 'rgba(60,30,110,0.75)'; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 12 * u); ctx.fill(); }
    else if (STYLE === 'real') { ctx.fillStyle = 'rgba(6,10,20,0.72)'; ctx.fillRect(x, y, bw, bh); ctx.strokeStyle = 'rgba(232,238,248,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, bh - 1); }
    else if (STYLE === 'sticker') { ctx.save(); ctx.shadowColor = 'rgba(60,40,70,0.3)'; ctx.shadowOffsetY = 3; ctx.shadowBlur = 4; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 12 * u); ctx.fill(); ctx.restore(); ctx.fillStyle = 'rgba(90,60,50,0.85)'; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, bw - 6, bh - 6, 10 * u); ctx.fill(); }
    else if (STYLE === 'neon') { ctx.fillStyle = 'rgba(10,4,30,0.8)'; ctx.fillRect(x, y, bw, bh); ctx.strokeStyle = 'rgba(58,255,216,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, bw, bh); }
    else if (STYLE === 'film') { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x, y, bw, bh); ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, bw, bh); }
    else { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, bw, bh); }
    if (unlocked && fr > 0) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, y + bh * (1 - fr), bw, bh * fr); }
    if (unlocked && fr <= 0) { ctx.strokeStyle = THEME.accent; ctx.globalAlpha = 0.8; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2); ctx.globalAlpha = 1; }
    const nm = name.length > 11 ? name.slice(0, 11) : name;
    txt(nm, x + bw / 2, y + 17 * u, Math.min(8.5 * u, bw / (nm.length * 1.05 * ERA.fontScale)), !unlocked ? '#777' : fr > 0 ? '#aaa' : '#fff', 'center', false);
    txt(!unlocked ? 'evolve' : fr > 0 ? Math.max(0, cd).toFixed(1) + 's' : '[' + key + ']', x + bw / 2, y + 33 * u, 7 * u, !unlocked ? '#666' : fr > 0 ? '#ff9a6a' : THEME.accent, 'center', false);
  });
}
function drawTouch() {
  if (!isTouch || state !== 'play') return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const f = form();
  for (const b of touchLayout()) {
    let label = b.label, cd = 0, locked = false;
    if (b.n[0] === 'a' && b.n.length === 2) { const i = +b.n[1], key = f.abilities[i]; locked = !key; label = key ? ABILITIES[key].name.split(' ')[0] : '?'; cd = key ? player.cds[i] : 0; }
    if (b.n === 'stomp') { locked = !f.smash; cd = player.smashCD; }
    if (b.n === 'pounce') cd = player.pounceCD;
    ctx.globalAlpha = locked ? 0.15 : touchBtns[b.n] ? 0.6 : 0.3;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = locked ? 0.3 : 0.9;
    txt(cd > 0 && !locked ? cd.toFixed(1) : label, b.x, b.y + 5, label.length > 2 ? 8 : 16, cd > 0 ? '#ff9a6a' : '#fff', 'center', false, '"Press Start 2P", monospace');
  }
  ctx.globalAlpha = 1;
}
// ============================================================ title page: EAT THE MULTIVERSE
const CARD_BG = [['#f4a259', '#5b3a29'], ['#5a2c8a', '#1a0c2a'], ['#2a6496', '#071a2e'], ['#5ec8ff', '#ff9ad8'], ['#dcdcdc', '#1a1a1a'], ['#2a1660', '#05030c'], ['#f7dfc2', '#e88a9a'], ['#1a2238', '#020308']];
const UIFONT = '"Bungee", "Arial Black", sans-serif';
function titleLayout() {
  const u = clamp(Math.min(W / 1100, H / 700), 0.45, 1.3), n = ERAS.length;
  const cols = W < 760 ? 4 : n, rows = Math.ceil(n / cols), gap = 12 * u;
  const cw = Math.min(150 * u, (W * 0.88 - gap * (cols - 1)) / cols), ch = cw * 1.15;
  const top = H * (rows > 1 ? 0.4 : 0.44), cards = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), rowN = Math.min(cols, n - r * cols);
    const x0 = W / 2 - (rowN * cw + (rowN - 1) * gap) / 2;
    cards.push({ i, x: x0 + c * (cw + gap), y: top + r * (ch + gap), w: cw, h: ch });
  }
  const by = top + rows * (ch + gap) + 26 * u, bw = Math.min(250 * u, W * 0.42), bh = 64 * u;
  return { u, cards, start: { x: W / 2 - bw - 10 * u, y: by, w: bw, h: bh }, tut: { x: W / 2 + 10 * u, y: by, w: bw, h: bh } };
}
function drawWorldIcon(i, cx, cy, s) {
  ctx.save(); ctx.translate(cx, cy);
  const sheet = (key, h, frame = 0, gray) => { const S = SPRITES[key], im = IMG[key]; if (!S || !im || !im.width) return; const w = h * S.w / S.h; ctx.imageSmoothingEnabled = key !== 'raptor'; if (gray) ctx.filter = 'grayscale(1) contrast(1.2)'; ctx.drawImage(im, frame * S.w, 0, S.w, S.h, -w / 2, -h / 2, w, h); ctx.filter = 'none'; };
  const bob = Math.sin(realT * 3 + i) * s * 0.04;
  ctx.translate(0, bob);
  switch (ERAS[i].key) {
    case 'jurassic': ctx.scale(-1, 1); sheet('raptor', s * 0.8, Math.floor(realT * 8) % 6); break;
    case 'goo': sheet(FORMS.gooblet.sheet, s * 0.8, Math.floor(realT * 8) % 4); break;
    case 'deep': sheet(FORMS.shark.sheet, s * 0.55); break;
    case 'cube': drawBlockPet('animal-tiger', 0, s * 0.4, 0, s * 0.75, s * 0.75, 1, null); break;
    case 'film': sheet(FORMS.lizard.sheet, s * 0.85, Math.floor(realT * 8) % 12, true); break;
    case 'neon': drawVecShape('octo', s * 0.6, s * 0.75, realT * 2, '#ff5ad8'); break;
    case 'house': ctx.translate(-s * 0.05, s * 0.35); drawHuman('baby', s * 0.85, s * 0.65, realT * 3, { moving: true }); break;
    case 'sol': {
      const r = s * 0.17, g = ctx.createRadialGradient(0, 0, r, 0, 0, r * 3.2);
      g.addColorStop(0, 'rgba(255,200,120,0.9)'); g.addColorStop(0.5, 'rgba(255,120,40,0.35)'); g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 3.2, r * 1.1, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,210,0.9)'; ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.beginPath(); ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2); ctx.stroke();
      break;
    }
  }
  ctx.restore();
}
function drawTitle() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const L = titleLayout(), u = L.u;
  const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H * 0.45, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(8,4,16,0.35)'); vg.addColorStop(1, 'rgba(8,4,16,0.85)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // the title: "EAT THE" over a rainbow, extruded "MULTIVERSE" (one colour per universe)
  const word = 'MULTIVERSE', fs = Math.min(104 * u, W * 0.92 / (word.length * 0.86)), y1 = H * 0.25;
  ctx.font = `${fs}px ${UIFONT}`; ctx.textAlign = 'center';
  const adv = word.split('').map((ch) => ctx.measureText(ch).width), total = adv.reduce((a, b) => a + b, 0);
  const cols = ERAS.map((e) => THEMES[e.theme].accent || '#fff').map((c) => (c === '#ffffff' ? '#e8e8e8' : c));
  txt('EAT THE', W / 2, y1 - fs * 0.92, fs * 0.42, '#ffffff', 'center', true, UIFONT);
  let x = W / 2 - total / 2;
  for (let k = 0; k < word.length; k++) {
    const cx = x + adv[k] / 2, cy = y1 + Math.sin(realT * 2.6 + k * 0.55) * fs * 0.05, col = cols[(k + Math.floor(realT * 0.8)) % cols.length];
    ctx.font = `${fs}px ${UIFONT}`;
    const depth = Math.max(4, fs * 0.08);
    for (let d = depth; d > 0; d -= 1) { ctx.fillStyle = d === depth ? 'rgba(0,0,0,0.45)' : lerpColor(col, '#1a0c2a', 0.62); ctx.fillText(word[k], cx + d * 0.6, cy + d); }
    ctx.fillStyle = col; ctx.fillText(word[k], cx, cy);
    ctx.save(); ctx.beginPath(); ctx.rect(cx - adv[k], cy - fs * 0.8, adv[k] * 2, fs * 0.33); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillText(word[k], cx, cy); ctx.restore();
    x += adv[k];
  }
  // the maps
  for (const c of L.cards) {
    const sel = c.i === titleEra, hov = mouseX >= c.x && mouseX <= c.x + c.w && mouseY >= c.y && mouseY <= c.y + c.h;
    const k = sel ? 1.08 : hov ? 1.04 : 1, w = c.w * k, h = c.h * k, x0 = c.x + c.w / 2 - w / 2, y0 = c.y + c.h / 2 - h / 2, E = ERAS[c.i];
    ctx.save();
    ctx.shadowColor = sel ? (THEMES[E.theme].accent || '#fff') : 'rgba(0,0,0,0.5)'; ctx.shadowBlur = sel ? 24 : 10;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, CARD_BG[c.i][0]); g.addColorStop(1, CARD_BG[c.i][1]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 14 * u); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 14 * u); ctx.clip();
    drawWorldIcon(c.i, x0 + w / 2, y0 + h * 0.42, w * 0.82);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x0, y0 + h * 0.76, w, h * 0.24);
    ctx.restore();
    const nm = E.name, nfs = Math.min(15 * u, (w * 0.9) / (nm.length * 0.62));
    txt(nm, x0 + w / 2, y0 + h * 0.9, nfs, '#ffffff', 'center', false, UIFONT);
    ctx.lineWidth = sel ? 4 : 1.5; ctx.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 14 * u); ctx.stroke();
  }
  // START / TUTORIAL
  const btn = (r, label, fill, ink) => {
    const hov = mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h, k = hov ? 1.05 : 1 + (fill ? Math.sin(realT * 4) * 0.015 : 0);
    const w = r.w * k, h = r.h * k, x0 = r.x + r.w / 2 - w / 2, y0 = r.y + r.h / 2 - h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(x0 + 4, y0 + 7, w, h, h / 2); ctx.fill();
    ctx.fillStyle = fill || 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, h / 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    txt(label, x0 + w / 2, y0 + h / 2 + h * 0.17, Math.min(h * 0.42, w / (label.length * 0.78)), ink, 'center', false, UIFONT);
  };
  btn(L.start, 'START', '#ff8a3a', '#ffffff');
  btn(L.tut, 'TUTORIAL', null, '#ffffff');
}
function drawStats(y0, u) {
  const p = player, PS = '"Press Start 2P", monospace';
  const rows = [
    ['SCORE', String(p.score)],
    ['REACHED', ERA.name + ' · ' + form().name],
    ['PEAK WEIGHT', fmtMass(p.mass)],
    ['SWALLOWED WHOLE', String(stats.eaten)],
    ['TAKEDOWNS', String(stats.kills)],
    ['BOSSES DEVOURED', String(stats.bosses)],
    ['BEST COMBO', 'x' + stats.bestCombo],
    ['SURVIVED', fmtTime(stats.time)],
  ];
  rows.forEach(([k, v], i) => {
    const y = y0 + i * 24 * u;
    txt(k, W / 2 - 10 * u, y, 11 * u, '#e8dcc0', 'right', true, PS);
    txt(v, W / 2 + 10 * u, y, 11 * u, '#fff', 'left', true, PS);
  });
  if (p.score >= best && p.score > 0) txt('NEW BEST!', W / 2, y0 + rows.length * 24 * u + 12 * u, 14 * u, '#ffd23a', 'center', true, PS);
}
function drawDead() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const u = clamp(Math.min(W, H) / 700, 0.55, 1.4), PS = '"Press Start 2P", monospace';
  const a = Math.min(1, deadT * 2);
  ctx.fillStyle = `rgba(20,4,2,${0.65 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  txt('DEVOURED BY FATE', W / 2, H * 0.2, Math.min(34 * u, W / 18), '#ff5a3a', 'center', true, PS);
  txt(deathCause, W / 2, H * 0.2 + 40 * u, Math.min(14 * u, W / (deathCause.length * 1.1)), '#ffd0b0', 'center', true, PS);
  drawStats(H * 0.36, u);
  if (deadT > 0.8 && Math.floor(realT * 2) % 2 === 0) txt(isTouch ? 'TAP TO TRY AGAIN' : 'SPACE TO TRY AGAIN', W / 2, H * 0.92, 14 * u, '#fff', 'center', true, PS);
  ctx.globalAlpha = 1;
}
function drawVictory() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const u = clamp(Math.min(W, H) / 700, 0.55, 1.4), PS = '"Press Start 2P", monospace';
  ctx.fillStyle = `rgba(4,2,10,${Math.min(0.85, victoryT)})`; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) { ctx.strokeStyle = ['#ffd23a', '#ff3af0', '#3affd8', '#7dff6a', '#e8dcc8'][i % 5]; ctx.globalAlpha = 0.3; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, H * 0.2, (realT * 120 + i * 60) % 420, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  const t = 'YOU ATE THE MULTIVERSE';
  txt(t, W / 2, H * 0.2, Math.min(32 * u, W / (t.length * 1.05)), '#ffd23a', 'center', true, PS);
  txt('eight universes. eight art styles. one stomach.', W / 2, H * 0.2 + 36 * u, Math.min(10 * u, W / 52), '#fff', 'center', true, PS);
  drawStats(H * 0.36, u);
  if (victoryT > 1.5 && Math.floor(realT * 2) % 2 === 0) txt('SPACE: GO AGAIN (CYCLE ' + (cycle + 1) + ' — HARDER, MORE POINTS)', W / 2, H * 0.92, Math.min(11 * u, W / 50), '#fff', 'center', true, PS);
}
function drawWarp() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const u = clamp(Math.min(W, H) / 700, 0.6, 1.4);
  if (!warped) { // channel-flip static
    const k = clamp(warpT / 1.0, 0, 1);
    ctx.globalAlpha = k;
    for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(${Math.random() * 255 | 0},${Math.random() * 255 | 0},${Math.random() * 255 | 0},0.5)`; ctx.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6); }
    ctx.drawImage(grain, 0, 0, W, H);
    ctx.globalAlpha = 1;
    return;
  }
  const a = warpT < 3.2 ? 1 : clamp(1 - (warpT - 3.2) / 1.0, 0, 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
  if (warpT < 1.25 && !warpFirst) for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`; ctx.fillRect(0, Math.random() * H, W, 2); }
  const film = STYLE === 'film', t0 = film ? 2.2 : 1.0;
  if (film && warpT < t0) { // an old film-leader countdown
    const n = 3 - Math.floor(clamp((warpT - 1.0) / 0.4, 0, 2.99)), frac = ((warpT - 1.0) / 0.4) % 1, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.28;
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * 2, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    txt(String(n), cx, cy + R * 0.38, R * 1.05 / ERA.fontScale, '#111111', 'center', false);
    ctx.globalAlpha = 1;
    return;
  }
  const t = clamp((warpT - t0) / 0.6, 0, 1);
  txt(ERA.episode, W / 2, H * 0.36, 12 * u, '#9a9a9a', 'center', false, '"Press Start 2P", monospace');
  ctx.globalAlpha = a * t;
  const fs = Math.min(64 * u, W / (ERA.name.length * 0.85 * ERA.fontScale));
  if (STYLE === '3d') { // bouncing rainbow letters
    const L = ERA.name.length, step = fs * ERA.fontScale * 0.62;
    for (let i = 0; i < L; i++) txt(ERA.name[i], W / 2 + (i - (L - 1) / 2) * step, H * 0.5 - Math.abs(Math.sin(realT * 5 + i * 0.5)) * 14 * u, fs, CONFETTI[i % 6], 'center', true);
  } else {
    const col = { pixel: '#ffd23a', cartoon: '#7dff6a', ink: '#c8e8ff', film: '#f4f4f4', neon: '#3affd8', sticker: '#ff7a59', real: '#f0f4fa' }[STYLE] || '#fff';
    if (STYLE === 'neon') { ctx.shadowColor = '#ff3af0'; ctx.shadowBlur = 24; if (Math.random() < 0.06) ctx.globalAlpha *= 0.4; }
    txt(ERA.name, W / 2, H * 0.5, fs, col, 'center', false, ERA.titleFont);
    ctx.shadowBlur = 0;
  }
  txt(ERA.tagline, W / 2, H * 0.5 + fs * ERA.fontScale * 0.55 + 10 * u, Math.min(12 * u, W / (ERA.tagline.length * 1.0 * ERA.fontScale)), '#bbbbbb', 'center', false);
  ctx.globalAlpha = 1;
}

// hand the meadow to three.js: every creature, corpse and present becomes a 3-D model
function drawSpace3D() {
  const ents = [], P = player, f = form();
  for (const co of corpses) if (co.model) ents.push({ ref: co, key: co.model, x: co.x, y: co.y, h: co.h * (0.4 + 0.6 * co.meat / co.maxMeat) * Math.min(1, co.life / 3), tint: 'corpse', spinMul: 3 });
  for (const c of creatures) if (c.model) ents.push({ ref: c, key: c.model, x: c.x, y: c.y, h: c.h, tint: c.flash > 0 ? 'flash' : c.gold ? 'gold' : '', spinMul: c.state === 'ram' ? 4 : c.stun > 0 ? 6 : 1 });
  if (P.active && f.space3d) {
    const key = { rock: 'n:moon_rock_01', comet: 'comet', moon: 'planet:moon', blackhole: 'blackhole' }[f.space3d];
    const blink = P.invuln > 0.35 && !P.dead && P.rollT <= 0 && Math.floor(realT * 20) % 2 === 0;
    ents.push({ ref: P, key, x: P.x, y: P.y, h: P.h * (f.space3d === 'blackhole' ? 0.55 : 1), hide: blink, tint: P.hurtFlash > 0 ? 'hurt' : P.dead ? 'corpse' : '', spinMul: P.rollT > 0 ? 6 : 1 });
  }
  const sun = boss && boss.alive && boss.bdef.ai === 'sun' ? boss : null;
  window.R3D.frameSpace({ W, H, DPR, viewH: cam.viewH, camX: cam.x, camY: cam.y, shx: -shX / cam.zoom, shy: -shY / cam.zoom, dt: frameDt, t: realT, ents, sunX: sun ? sun.x : undefined, sunY: sun ? sun.y : undefined });
}
function draw3D() {
  if (STYLE === 'real') { drawSpace3D(); return; }
  const S = window.R3D.SIN, ents = [], P = player;
  for (const co of corpses) if (co.model) ents.push({ ref: co, key: co.model, x: co.x, y: co.y, z: 0, h: co.h * (0.55 + 0.45 * co.meat / co.maxMeat) * Math.min(1, co.life / 3), vx: 0, vy: 0, face: co.face, lie: true, tint: 'corpse', t: realT });
  for (const c of creatures) if (c.model) {
    const look = (c.state === 'tele' || c.state === 'roar' || c.state === 'aim') && P.active;
    ents.push({ ref: c, key: c.model, x: c.x, y: c.y, z: c.z, h: c.h, vx: c.vx, vy: c.vy, face: c.face, t: realT, crown: c.boss,
      tint: c.flash > 0 ? 'flash' : c.gold ? 'gold' : '', spin: c.stun > 0 ? Math.sin(realT * 18) * 0.5 : 0,
      sx: c.state === 'tele' ? 1.12 : 1, sy: c.state === 'tele' ? 0.85 : 1, faceTo: look ? Math.atan2(P.x - c.x, (P.y - c.y) / S) : undefined });
  }
  const f = form();
  if (P.active && f.model) {
    const blink = P.invuln > 0.35 && !P.dead && P.rollT <= 0 && Math.floor(realT * 20) % 2 === 0;
    const aim = P.vacT > 0 || P.beam;
    ents.push({ ref: P, key: f.model, x: P.x, y: P.y, z: P.z, h: P.h, vx: P.vx, vy: P.vy, face: P.face, hide: blink, lie: P.dead, t: realT,
      tint: P.hurtFlash > 0 ? 'hurt' : P.dead ? 'dead' : P.frenzyT > 0 ? 'frenzy' : '', spin: P.cycT > 0 ? realT * 25 : 0,
      sx: P.squash > 0 ? 1 + P.squash * 2 : P.pounce > 0 ? 1.12 : P.roarAnim > 0.3 ? 1.1 : 1, sy: P.squash > 0 ? 1 - P.squash * 2 : P.pounce > 0 ? 0.88 : P.roarAnim > 0.3 ? 1.12 : 1,
      faceTo: aim ? Math.atan2(P.hx, P.hy / S) : undefined, anim: P.rollT > 0 || P.cycT > 0 ? 'run' : undefined });
  }
  const gifts = meteors.filter((m) => m.kind === 'gift').map((m) => ({ ref: m, x: m.x, y: m.ty, alt: m.ty - m.y, r: m.r, seed: m.seed || 0.3 }));
  window.R3D.frame({ W, H, DPR, viewH: cam.viewH, camX: cam.x, camY: cam.y, shx: -shX / cam.zoom, shy: -shY / cam.zoom, dt: frameDt, t: realT, depth: -SURF, ents, gifts });
}
function render() {
  shX = (Math.random() - 0.5) * cam.shake * 2; shY = (Math.random() - 0.5) * cam.shake * 2;
  const in3D = use3D();
  if (window.R3D) window.R3D.show(in3D);
  if (in3D) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cvs.width, cvs.height); draw3D(); }
  else drawBackground();
  if (STYLE === 'real' && !in3D) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); txt('RECEIVING TELEMETRY FROM NASA ARCHIVES...', W / 2, H * 0.9, 12, '#9ab0d0', 'center', false); }
  worldTransform();
  const vb = viewBounds();
  if (!in3D) {
    drawDecor(vb);
    drawGround(vb);
    for (const co of corpses) drawCorpse(co);
    const sorted = creatures.slice().sort((a, b) => (roam() ? a.y - b.y : (b.boss ? 1e6 : b.mass) - (a.boss ? 1e6 : a.mass)));
    for (const c of sorted) if (!c.flying) drawCreature(c);
    if (player.active) drawPlayer();
    for (const c of sorted) if (c.flying) drawCreature(c);
  }
  drawBossFx();
  drawBeam();
  drawProjectiles();
  drawParticles();
  drawMeteors();
  drawOverlayFx();
  drawIndicators();
  drawTexts();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (flash > 0) { ctx.globalAlpha = Math.min(0.7, flash); ctx.fillStyle = flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (state === 'title') drawTitle();
  else if (tut) { drawHUD(); drawTouch(); drawTutorial(); if (state === 'paused') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H); } }
  else {
    drawHUD();
    drawTouch();
    if (state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
      txt('PAUSED', W / 2, H / 2, 30, '#fff', 'center');
      txt('P / SPACE to resume', W / 2, H / 2 + 34, 10, '#ddd', 'center');
    }
    if (state === 'dead') drawDead();
    if (state === 'victory') drawVictory();
    if (state === 'warp') drawWarp();
  }
  if (STYLE === 'film') filmPost();
}

// ============================================================ loop
let lastT = performance.now(), frameDt = 1 / 60;
function frame(now) {
  const dt = Math.min(1 / 30, (now - lastT) / 1000);
  lastT = now; realT += dt; frameDt = dt;
  if (state === 'loading') {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#140d0a'; ctx.fillRect(0, 0, W, H);
    txt('hatching... ' + loadedCount + '/' + SPRITE_KEYS.length, W / 2, H / 2, 14, '#ffd23a', 'center', true, '"Press Start 2P", monospace');
    if (loadedCount >= SPRITE_KEYS.length) { titleEra = 0; startTitle(); runTestHook(); }
  } else {
    const inp = readInput();
    update(dt, inp);
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// dev test hook: index.html#test=WORLD,FORM,BOSS,SECONDS[,step] auto-plays with a simple bot
function runTestHook() {
  const m = /#test=(\d),(\d),(\d),(\d+)/.exec(location.hash);
  if (!m) return;
  const [era, f, wantBoss, secs] = m.slice(1).map(Number);
  startGame(era); state = 'play';
  window.__chompo.evolveTo(f);
  if (wantBoss) { bossT = -1; spawnBoss(); }
  const press = (c, d) => { if (d && !keys[c]) pressedKeys[c] = true; keys[c] = d; };
  const t0 = realT;
  const iv = setInterval(() => {
    if (!player || !player.active || state !== 'play') return;
    if (realT - t0 > secs) { clearInterval(iv); for (const k in keys) keys[k] = false; return; }
    player.belly = Math.max(player.belly, 60);
    let tgt = boss, bd = 1e9;
    if (!tgt) for (const c of creatures) { if (c.ally) continue; const d = Math.abs(c.x - player.x); if (d < bd) { bd = d; tgt = c; } }
    const dir = tgt ? sign(tgt.x - player.x) : 1;
    press('KeyD', dir > 0); press('KeyA', dir < 0);
    if (swim() && tgt) { const ty = roam() ? tgt.y : tgt.y - tgt.h * 0.5, py = roam() ? player.y : player.y - player.h * 0.5; press('KeyW', ty < py - player.h * 0.3); press('KeyS', ty > py + player.h * 0.3); }
    const r = Math.random();
    if (!water()) press('Space', r < (roam() ? 0.03 : 0.06));
    press('ShiftLeft', r > 0.9); press('KeyE', r > 0.95); press('KeyR', r > 0.97); press('KeyQ', r > 0.985);
    if (!swim()) press('KeyS', r > 0.45 && r < 0.47);
    if (cityMode && tgt && tgt.y < player.y - player.h) press(dir > 0 ? 'KeyD' : 'KeyA', true);
    if (/,step/.test(location.hash)) { for (let i = 0; i < 6; i++) { realT += 1 / 60; update(1 / 60, readInput()); } render(); }
  }, 100);
}
window.__chompo = {
  get player() { return player; }, get creatures() { return creatures; }, get state() { return state; }, get era() { return eraIdx; }, get boss() { return boss; },
  get projectiles() { return projectiles; }, get stats() { return stats; }, get cam() { return cam; }, groundY,
  startGame, loadEra: (i) => loadEra(i, true), startEvent: () => startEvent(), spawnHazard, spawnBoss, useAbility,
  evolveTo(f) { while (player.form < f) { player.mass = ERA.at[player.form + 1]; player.shownMass = player.mass; evolve(); } slowmo = 0; flash = 0; bossT = -1; },
  audio: () => SFX.status(), initAudio: () => SFX.init(), get meteors() { return meteors; }, r3d: () => !!(window.R3D && window.R3D.ok()),
  furniture: (i) => furniture(i), floorAt: (x, y) => floorAt(x, y),
  spawn: (k, m, x) => makeCreature(k, m, x),
  killBoss() { if (boss) damageCreature(boss, 1e9); },
  skipCard() { if (state === 'warp') { warpT = 4.3; state = 'play'; } },
  step(dt, n) { if (state === 'loading') { titleEra = 0; startTitle(); runTestHook(); } for (let i = 0; i < n; i++) { realT += dt; update(dt, readInput()); } render(); },
};
})();
