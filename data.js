// CHOMPOSAURUS — content data: five universes, each in its own art style.
'use strict';
(() => {
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---------------------------------------------------------------- abilities
// type drives the mechanic in game.js; everything else is tuning.
const ABILITIES = {
  roar:   { name: 'ROAR',        type: 'roar',   cd: 6,  desc: 'stun everything big nearby, swat flyers down' },
  goo:    { name: 'GOO SPIT',    type: 'spit',   cd: 2.6, shot: 'goo', n: 3, spread: 0.22, dmg: 0.6, desc: 'lob sticky goo — glues big things, pops small ones' },
  gulp:   { name: 'MEGA GULP',   type: 'vacuum', cd: 7,  dur: 1.4, desc: 'inhale everything in front of you' },
  spikes: { name: 'SPIKE STORM', type: 'nova',   cd: 8,  shot: 'spike', n: 20, dmg: 0.8, desc: 'fire quills in every direction' },
  zap:    { name: 'ZAP',         type: 'zap',    cd: 3.5, radius: 3.6, dmg: 1.2, desc: 'electric pulse — fries small fry' },
  field:  { name: 'STORM FIELD', type: 'aura',   cd: 10, dur: 4.5, radius: 3.4, dps: 1.6, desc: 'crackling aura shreds anything close' },
  frenzy: { name: 'BLOOD FRENZY', type: 'frenzy', cd: 13, dur: 6, desc: 'faster, hungrier, bites hit 2.5x' },
  quake:  { name: 'QUAKE STOMP', type: 'quake',  cd: 10, desc: 'the whole screen shakes. so does everything on it' },
  // CUBE COUNTRY
  silk:     { name: 'SILK SHOT',   type: 'spit',    cd: 1.6, shot: 'web', n: 1, spread: 0, dmg: 0.5, desc: 'sticky silk pins big critters, wraps small ones' },
  cyclone:  { name: 'CYCLONE',     type: 'cyclone', cd: 9,  dur: 2.6, radius: 5, desc: 'spin into a tornado that sucks everything in' },
  trunk:    { name: 'TRUNK VACUUM', type: 'vacuum', cd: 7,  dur: 1.8, desc: 'hoover up everything in front of you' },
  stampede: { name: 'STAMPEDE',    type: 'roll',    cd: 8,  dur: 2.0, desc: 'charge forward, untouchable, flattening all' },
  // CREATURE FEATURE
  engulf:   { name: 'ENGULF',      type: 'vacuum',  cd: 6,  dur: 1.5, desc: 'ooze over everything in front of you' },
  ray:      { name: 'RAY GUN',     type: 'beam',    cd: 4,  dur: 0.9, len: 12, width: 0.22, dps: 2.4, desc: 'death ray from your visor — auto-aims' },
  leap:     { name: 'ROCKET LEAP', type: 'leap',    cd: 5,  desc: 'blast sky-high, then crash down on everything' },
  atomic:   { name: 'ATOMIC BREATH', type: 'beam',  cd: 6,  dur: 1.8, len: 17, width: 0.45, dps: 3.4, desc: 'the classic. a city-melting beam' },
  // NEON ORBIT
  wormhole:  { name: 'WORMHOLE',     type: 'blink',  cd: 3,  dist: 6, desc: 'blink through space, swallowing what you pass' },
  gravbomb:  { name: 'GRAVITY BOMB', type: 'vortex', cd: 9,  dur: 2.6, desc: 'a pocket black hole that eats everything nearby' },
  supernova: { name: 'SUPERNOVA',    type: 'nova',   cd: 6,  n: 18, shot: 'star', dmg: 0.5, desc: 'explode into a ring of shooting stars' },
  // HOME SWEET GIANT HOME
  wail:      { name: 'TANTRUM',     type: 'roar',   cd: 7,   desc: 'WAAAH! stuns every bug nearby' },
  slingshot: { name: 'SLINGSHOT',   type: 'spit',   cd: 1.1, shot: 'pea', n: 1, spread: 0, dmg: 0.7, desc: 'ping a pea at anything' },
  vacuumc:   { name: 'VACUUM',      type: 'vacuum', cd: 7,   dur: 2.0, desc: 'hoover up every bug in front of you' },
  cane:      { name: 'CANE WHACK',  type: 'cane',   cd: 1.0, desc: 'BONK! sends bugs flying, bats back shots, hurts the boss' },
  dentures:  { name: 'DENTURES',    type: 'spit',   cd: 2.5, shot: 'teeth', n: 3, spread: 0.22, dmg: 0.9, desc: 'hurl chattering false teeth' },
  // THE SOLAR SYSTEM
  ram:     { name: 'RAMMING SPEED',    type: 'roll',   cd: 6, dur: 1.4, desc: 'blast forward, smashing straight through everything' },
  coma:    { name: 'BURNING COMA',     type: 'aura',   cd: 9, dur: 4, radius: 3.2, dps: 1.4, desc: 'your glowing gas cloud scorches everything close' },
  tide:    { name: 'TIDAL PULL',       type: 'vacuum', cd: 7, dur: 2.0, desc: 'your gravity drags everything ahead into you' },
  jet:     { name: 'RELATIVISTIC JET', type: 'beam',   cd: 5, dur: 1.6, len: 15, width: 0.4, dps: 3.2, desc: 'a beam of plasma at nearly the speed of light' },
  horizon: { name: 'EVENT HORIZON',    type: 'vortex', cd: 9, dur: 3, self: true, desc: 'bend space itself: everything nearby falls in' },
};

// ---------------------------------------------------------------- player forms
// every evolution is a different creature. abilities fill slots E, R, Q in order.
const FORMS = {
  // JURASSIC — pixel art
  raptor:    { name: 'RAPTOR',    sheet: 'raptor', faceL: true, walk: R(0, 6), idle: [0], act: [0], speed: 4.6, jump: 3.0, eat: 0.8, abilities: [] },
  tyrant:    { name: 'TYRANT',    sheet: 'rex',    faceL: true, walk: R(1, 6), idle: [0], act: [7, 8], speed: 4.1, jump: 2.7, eat: 1.05, abilities: ['roar'] },
  behemoth:  { name: 'BEHEMOTH',  sheet: 'king',   faceL: true, walk: R(1, 6), idle: [0], act: [7], speed: 3.9, jump: 2.5, eat: 1.5, abilities: ['roar'], smash: true, final: true, aura: '#ffd23a' },
  // GOO GALAXY — glossy cartoon
  gooblet:   { name: 'GOOBLET',   sheet: 'goo_gooblet', faceL: true, walk: R(0, 7), idle: R(0, 7), act: [8, 9], speed: 4.6, jump: 3.4, eat: 0.85, jumps: 3, abilities: ['goo'], bouncy: true },
  chompling: { name: 'CHOMPLING', sheet: 'goo_chomp', faceL: true, walk: R(0, 7), idle: R(8, 15), act: [8, 9], speed: 4.3, jump: 3.0, eat: 1.15, abilities: ['goo', 'gulp'], smash: true },
  furrbeast: { name: 'FURRBEAST', sheet: 'goo_furr', faceL: true, walk: R(0, 12), idle: [0, 1], act: [5, 6], speed: 4.2, jump: 2.8, eat: 1.55, abilities: ['goo', 'gulp', 'spikes'], smash: true, final: true, aura: '#ff7ad9' },
  // THE DEEP — hand-drawn ink, you swim
  jelly:     { name: 'JELLY',     sheet: 'deep_jelly', faceL: false, walk: [0, 1], idle: [0, 1], act: [1], speed: 3.6, eat: 0.85, abilities: ['zap'], swimTilt: false, hMul: 1.1 },
  eel:       { name: 'ELECTRIC EEL', sheet: 'deep_eel', faceL: false, walk: [0, 1], idle: [0, 1], act: [1], speed: 4.6, eat: 1.15, abilities: ['zap', 'field'], hMul: 0.8 },
  shark:     { name: 'GREAT SHARK', sheet: 'deep_shark', faceL: true, walk: R(0, 5), idle: R(0, 5), act: [2, 3], speed: 4.8, eat: 1.6, abilities: ['zap', 'field', 'frenzy'], final: true, aura: '#ff4a4a', hMul: 0.8 },
  // CUBE COUNTRY — real 3-D, you roam in every direction
  caterpillar: { name: 'CATERPILLAR', model: 'animal-caterpillar', sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.6, jump: 2.6, eat: 0.85, abilities: ['silk'], hMul: 0.9 },
  tigerP:      { name: 'TIGER',       model: 'animal-tiger',       sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.6, jump: 2.6, eat: 1.2, abilities: ['roar', 'cyclone'] },
  elephantP:   { name: 'ELEPHANT',    model: 'animal-elephant',    sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.0, jump: 2.2, eat: 1.6, abilities: ['trunk', 'quake', 'stampede'], final: true, aura: '#ff5ad8' },
  // CREATURE FEATURE — black & white B-movie, you climb buildings
  blob:   { name: 'THE BLOB',      sheet: 'bw_blob',   faceL: false, walk: [0, 1, 2, 3], idle: [0, 1, 2, 3], act: [1, 2], speed: 4.3, jump: 2.7, eat: 0.85, abilities: ['engulf'], hMul: 0.85 },
  robot:  { name: 'ROBOT MONSTER', sheet: 'bw_robot',  faceL: false, walk: R(0, 7), idle: [0], act: R(8, 11), speed: 4.5, jump: 3.0, eat: 1.2, abilities: ['ray', 'leap'] },
  lizard: { name: 'GIANT LIZARD',  sheet: 'bw_lizard', faceL: false, walk: R(0, 11), idle: [0], act: R(12, 17), speed: 4.1, jump: 2.6, eat: 1.6, abilities: ['atomic', 'leap', 'roar'], smash: true, final: true, hMul: 1.25 },
  // NEON ORBIT — glowing vector creatures; every little planet has its own gravity
  worm:  { name: 'SPACE WORM',   vec: 'worm',  sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.6, jump: 2.6, eat: 0.85, abilities: ['wormhole'], hMul: 0.8, col: '#7dff6a' },
  octo:  { name: 'STAR SQUID',   vec: 'octo',  sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.6, jump: 2.6, eat: 1.2, abilities: ['wormhole', 'gravbomb'], col: '#ff5ad8' },
  whale: { name: 'COSMIC WHALE', vec: 'whale', sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.2, jump: 2.4, eat: 1.6, abilities: ['wormhole', 'gravbomb', 'supernova'], smash: true, final: true, col: '#3affd8', aura: '#3affd8' },
  // HOME SWEET GIANT HOME — you are tiny, and you get older
  baby:    { name: 'BABY',      human: 'baby',    sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 3.4, jump: 2.6, eat: 0.85, abilities: ['wail'], hMul: 0.75 },
  kid:     { name: 'KID',       human: 'kid',     sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 5.0, jump: 3.0, jumps: 3, eat: 1.05, abilities: ['wail', 'slingshot'] },
  adult:   { name: 'GROWN-UP',  human: 'adult',   sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.6, jump: 2.7, eat: 1.3, abilities: ['wail', 'slingshot', 'vacuumc'] },
  grandpa: { name: 'GRANDPA',   human: 'grandpa', sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.0, jump: 2.5, eat: 1.6, abilities: ['cane', 'dentures', 'vacuumc'], smash: true, final: true, aura: '#ffd27a' },
  // THE SOLAR SYSTEM — real NASA models and planet maps; you drift with momentum, planets pull you in
  rock:  { name: 'ROGUE ASTEROID', space3d: 'rock',      sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.2, jump: 2, eat: 0.85, abilities: ['ram'] },
  comet: { name: 'COMET',          space3d: 'comet',     sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 5.0, jump: 2, eat: 1.1, abilities: ['ram', 'coma'] },
  moonP: { name: 'ROGUE MOON',     space3d: 'moon',      sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.4, jump: 2, eat: 1.35, abilities: ['ram', 'coma', 'tide'] },
  bhole: { name: 'BLACK HOLE',     space3d: 'blackhole', sheet: 'bw_blob', faceL: false, walk: [0], idle: [0], act: [0], speed: 4.3, jump: 2, eat: 1.7, abilities: ['jet', 'horizon', 'tide'], final: true, pull: true },
};

// ---------------------------------------------------------------- species
// ai: skitter | hopper | static | flyer | charger | tank | hunter | giant | melee | ranged | turret | school | drifter | boat | ally
// contact: when touching you hurts (if it's too big to eat): always | charge | dive | none
// corpse: sprite key | 'flip' | 'squash' | 'wreck' | null
const SP = {
  // ----- JURASSIC
  compy:  { imgs: ['compy1', 'compy2', 'compy3', 'compy4', 'compy5', 'compy6'], ai: 'skitter', faceL: false, corpse: 'compy_corpse', pts: 10, spd: 3.0, hpMul: 0.6 },
  eggs:   { imgs: ['eggs'], ai: 'static', faceL: false, corpse: 'eggs_fried', pts: 30, spd: 0, hpMul: 0.5, hMul: 0.9, eggs: true },
  ptero:  { imgs: ['ptero1', 'ptero2'], ai: 'flyer', dive: true, contact: 'dive', faceL: true, corpse: 'ptero_corpse', pts: 45, spd: 3.2, hpMul: 0.8, hbw: 0.6, hbh: 0.55, cause: 'SNATCHED', flap: true },
  trike:  { imgs: ['trike1', 'trike2', 'trike3'], ai: 'charger', contact: 'charge', faceL: true, corpse: 'trike_corpse', pts: 70, spd: 1.2, hpMul: 1.2, hMul: 0.85, cause: 'GORED' },
  anky:   { imgs: ['anky1', 'anky2'], ai: 'tank', faceL: true, corpse: 'anky_corpse', pts: 110, spd: 0.7, hpMul: 2.4, hMul: 0.75, hbw: 0.75, cause: 'TAIL-CLUBBED' },
  trex:   { imgs: ['trex1', 'trex2'], ai: 'hunter', contact: 'always', faceL: true, corpse: 'trex_corpse', pts: 220, spd: 2.4, hpMul: 1.3, hbw: 0.6, cause: 'DEVOURED' },
  sauro:  { imgs: ['sauro1', 'sauro2', 'sauro3'], ai: 'giant', faceL: true, corpse: 'sauro_corpse', pts: 400, spd: 0.5, hpMul: 1.6, hMul: 1.3, hbw: 0.55, hbh: 0.55, cause: 'FLATTENED' },
  // ----- GOO GALAXY (frames: idle..., hit last)
  goober:  { imgs: ['goo_goober'], ai: 'hopper', faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 12, spd: 2.6, hpMul: 0.6 },
  pinky:   { imgs: ['goo_pinky'], ai: 'hopper', faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 18, spd: 2.8, hpMul: 0.7 },
  blot:    { imgs: ['goo_blot'], ai: 'skitter', faceL: true, walkF: [0, 1], jumpF: [2, 3], hitF: 4, corpse: 'squash', pts: 10, spd: 3.6, hpMul: 0.5, hMul: 0.8 },
  cubey:   { imgs: ['goo_cubey'], ai: 'melee', hop: true, faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 30, spd: 2.2, hpMul: 1.0, cause: 'HEADBUTTED' },
  cyclo:   { imgs: ['goo_cyclo'], ai: 'charger', contact: 'charge', hop: true, faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 45, spd: 1.6, hpMul: 1.1, cause: 'BODY-SLAMMED' },
  bluey:   { imgs: ['goo_bluey'], ai: 'hunter', contact: 'always', faceL: true, walkF: [0, 1], idleF: R(2, 7), corpse: 'squash', pts: 70, spd: 2.2, hpMul: 1.2, cause: 'NOMMED BY BLUEY' },
  redhorn: { imgs: ['goo_redhorn'], ai: 'hunter', contact: 'always', hop: true, faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 120, spd: 2.3, hpMul: 1.3, cause: 'HORNED' },
  zombie:  { imgs: ['goo_zombie'], ai: 'melee', faceL: false, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 60, spd: 1.6, hpMul: 1.2, cause: 'ZOMBIE\'D' },
  skull:   { imgs: ['goo_skull'], ai: 'charger', contact: 'charge', hop: true, faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 80, spd: 1.8, hpMul: 1.4, cause: 'SKULL-BASHED' },
  horn:    { imgs: ['goo_horn'], ai: 'giant', faceL: true, walkF: [0, 1], hitF: 2, corpse: 'squash', pts: 200, spd: 0.9, hpMul: 1.6, hbw: 0.8, hbh: 0.8, cause: 'SQUISHED' },
  plant:   { imgs: ['goo_plant'], ai: 'turret', shot: 'goo', rof: [2, 3.2], faceL: false, walkF: [0, 1], corpse: 'squash', pts: 40, spd: 0, hpMul: 1.0, cause: 'GOO\'D' },
  flappy:  { imgs: ['goo_flappy'], ai: 'flyer', dive: true, contact: 'dive', faceL: false, walkF: R(0, 3), hitF: 4, corpse: 'squash', pts: 50, spd: 3.0, hpMul: 0.8, cause: 'DIVE-BOMBED' },
  bird:    { imgs: ['goo_bird'], ai: 'flyer', faceL: false, corpse: 'squash', pts: 25, spd: 2.6, hpMul: 0.6, hMul: 0.9 },
  // ----- THE DEEP (swimmers)
  fish:    { imgs: ['deep_fish'], ai: 'school', swim: true, faceL: true, corpse: 'flip', pts: 8, spd: 3.0, hpMul: 0.4, hMul: 0.8 },
  shrimp:  { imgs: ['deep_shrimp'], ai: 'school', swim: true, bottom: true, faceL: false, corpse: 'flip', pts: 12, spd: 2.4, hpMul: 0.5 },
  jellyE:  { imgs: ['deep_jelly'], ai: 'drifter', swim: true, contact: 'always', faceL: false, corpse: 'flip', pts: 30, spd: 0.9, hpMul: 0.6, cause: 'STUNG' },
  eelE:    { imgs: ['deep_eel'], ai: 'hunter', swim: true, contact: 'always', faceL: false, corpse: 'flip', pts: 60, spd: 2.6, hpMul: 1.0, hMul: 0.8, cause: 'SHOCKED' },
  sharkE:  { imgs: ['deep_shark'], ai: 'hunter', swim: true, contact: 'always', faceL: true, corpse: 'flip', pts: 160, spd: 2.8, hpMul: 1.3, hMul: 0.8, cause: 'SHARK BAIT' },
  diver:   { imgs: ['deep_sub'], ai: 'ranged', swim: true, shot: 'harpoon', rof: [1.8, 2.8], faceL: false, corpse: 'wreck', vehicle: true, pts: 90, spd: 1.8, hpMul: 1.2, cause: 'HARPOONED' },
  boat:    { imgs: ['deep_boat'], ai: 'boat', faceL: false, corpse: 'wreck', vehicle: true, pts: 300, spd: 1.2, hpMul: 2.0, hbh: 0.5, cause: 'DEPTH-CHARGED' },
  // ----- CUBE COUNTRY (3-D models; they move on the ground plane like swimmers do in The Deep)
  chick:     { model: 'animal-chick',    imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 8,  spd: 3.0, hpMul: 0.4, hMul: 0.8 },
  bunny:     { model: 'animal-bunny',    imgs: [], ai: 'school', swim: true, hops: true, corpse: 'model', pts: 12, spd: 3.4, hpMul: 0.5 },
  parrot:    { model: 'animal-parrot',   imgs: [], ai: 'school', swim: true, fly: 1.6, corpse: 'model', pts: 25, spd: 3.0, hpMul: 0.5 },
  pig:       { model: 'animal-pig',      imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 20, spd: 2.4, hpMul: 0.8 },
  cat:       { model: 'animal-cat',      imgs: [], ai: 'school', swim: true, hops: true, corpse: 'model', pts: 25, spd: 3.2, hpMul: 0.7 },
  dog:       { model: 'animal-dog',      imgs: [], ai: 'hunter', swim: true, contact: 'always', corpse: 'model', pts: 40, spd: 2.8, hpMul: 0.9, cause: 'CHASED DOWN BY A PUPPY' },
  monkey:    { model: 'animal-monkey',   imgs: [], ai: 'ranged', swim: true, shot: 'coconut', rof: [1.8, 2.8], corpse: 'model', pts: 45, spd: 2.4, hpMul: 0.8, cause: 'COCONUT TO THE FACE' },
  hog:       { model: 'animal-hog',      imgs: [], ai: 'hunter', swim: true, contact: 'always', corpse: 'model', pts: 60, spd: 2.4, hpMul: 1.2, cause: 'BOWLED OVER BY A HOG' },
  cow:       { model: 'animal-cow',      imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 50, spd: 1.8, hpMul: 1.2 },
  giraffe:   { model: 'animal-giraffe',  imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 90, spd: 2.0, hpMul: 1.4, hMul: 1.2 },
  elephantE: { model: 'animal-elephant', imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 140, spd: 1.4, hpMul: 1.8 },
  lion:      { model: 'animal-lion',     imgs: [], ai: 'hunter', swim: true, contact: 'always', corpse: 'model', pts: 160, spd: 2.6, hpMul: 1.3, cause: 'MAULED BY A LION' },
  tigerE:    { model: 'animal-tiger',    imgs: [], ai: 'hunter', swim: true, contact: 'always', corpse: 'model', pts: 120, spd: 2.8, hpMul: 1.2, cause: 'TACKLED BY A TIGER' },
  // ----- CREATURE FEATURE (all rendered black & white)
  person:   { imgs: ['bw_person1', 'bw_person2', 'bw_person3'], ai: 'skitter', screams: true, faceL: false, corpse: 'flip', pts: 12, spd: 2.6, hpMul: 0.5 },
  mobster:  { imgs: ['bw_mobster'], ai: 'ranged', shot: 'bullet', rof: [1.3, 2.2], faceL: false, walkF: [0, 1, 2, 3], actF: [4, 5, 6, 7], corpse: 'flip', pts: 35, spd: 1.8, hpMul: 0.8, cause: 'RUBBED OUT BY THE MOB' },
  soldier:  { imgs: ['bw_soldier'], ai: 'ranged', shot: 'bullet', rof: [1.2, 2.0], faceL: false, walkF: [0, 1], actF: [2, 3], corpse: 'flip', pts: 30, spd: 1.8, hpMul: 0.8, cause: 'SHOT BY THE ARMY' },
  car:      { imgs: ['bw_car', 'bw_jeep'], faceLs: { bw_car: false, bw_jeep: true }, ai: 'driver', contact: 'moving', vehicle: true, corpse: 'wreck', pts: 50, spd: 4.0, hpMul: 1.0, hMul: 0.7, cause: 'RUN OVER' },
  truck:    { imgs: ['bw_truck'], ai: 'driver', contact: 'moving', vehicle: true, faceL: false, corpse: 'wreck', pts: 90, spd: 3.0, hpMul: 1.4, hMul: 0.75, cause: 'RUN OVER' },
  tank:     { imgs: ['bw_tank'], ai: 'ranged', shot: 'shell', rof: [2.6, 3.8], vehicle: true, faceL: false, corpse: 'wreck', pts: 200, spd: 0.9, hpMul: 2.2, hMul: 0.8, cause: 'SHELLED' },
  plane:    { imgs: ['bw_plane'], ai: 'flyer', shot: 'bullet', rof: [1.2, 2.0], vehicle: true, faceL: false, corpse: 'wreck', pts: 110, spd: 3.4, hpMul: 0.9, hMul: 0.6, hbh: 0.6, cause: 'STRAFED BY A BIPLANE' },
  heli:     { imgs: ['bw_heli'], ai: 'flyer', shot: 'bullet', rof: [1.4, 2.4], vehicle: true, faceL: false, corpse: 'wreck', pts: 120, spd: 2.6, hpMul: 1.0, hMul: 0.7, hbh: 0.7, cause: 'GUNNED DOWN' },
  // ----- NEON ORBIT (drawn as glowing vectors, floating free in space)
  mote:    { vec: 'mote',    imgs: [], ai: 'school',  swim: true, corpse: 'vec', pts: 8,   spd: 3.2, hpMul: 0.4, hMul: 0.7, col: '#fff6a8' },
  astro:   { vec: 'astro',   imgs: [], ai: 'school',  swim: true, corpse: 'vec', pts: 15,  spd: 1.6, hpMul: 0.5, col: '#ffffff', silent: true },
  tri:     { vec: 'tri',     imgs: [], ai: 'school',  swim: true, corpse: 'vec', pts: 20,  spd: 4.2, hpMul: 0.6, col: '#3affd8' },
  sjelly:  { vec: 'jelly',   imgs: [], ai: 'drifter', swim: true, corpse: 'vec', pts: 25,  spd: 1.6, hpMul: 0.7, col: '#ff5ad8' },
  rock:    { vec: 'rock',    imgs: [], ai: 'school',  swim: true, corpse: 'vec', pts: 40,  spd: 0.7, hpMul: 2.2, hMul: 1.15, col: '#c8a8ff' },
  diamond: { vec: 'diamond', imgs: [], ai: 'ranged',  swim: true, corpse: 'vec', shot: 'laser', rof: [1.4, 2.4], pts: 45, spd: 2.0, hpMul: 0.8, col: '#ffe066', cause: 'ZAPPED BY A DIAMOND' },
  saucer:  { vec: 'saucer',  imgs: [], ai: 'ranged',  swim: true, corpse: 'vec', shot: 'laser', rof: [1.2, 2.0], pts: 70, spd: 2.4, hpMul: 1.0, hMul: 0.8, col: '#7dff6a', cause: 'ABDUCTED... PERMANENTLY' },
  sshark:  { vec: 'shark',   imgs: [], ai: 'hunter',  swim: true, corpse: 'vec', contact: 'always', pts: 90, spd: 2.8, hpMul: 1.3, col: '#ff8a3a', cause: 'EATEN BY A STAR SHARK' },
  serpentB:{ vec: 'serpent', imgs: [], ai: 'hunter',  swim: true, corpse: 'vec', pts: 300, spd: 3.0, hpMul: 1.0, col: '#ff3af0', cause: 'SWALLOWED BY OUROBOROS' },
  // ----- HOME SWEET GIANT HOME (die-cut stickers; ants and crumbs are drawn in code)
  crumb:    { pd: 'crumb', imgs: [], ai: 'static', corpse: 'pd', pts: 6, spd: 0, hpMul: 0.3, hMul: 0.55, pdw: 1.2 },
  ant:      { pd: 'ant', imgs: [], ai: 'skitter', corpse: 'pd', pts: 10, spd: 2.6, hpMul: 0.5, hMul: 0.6, pdw: 1.7 },
  fireant:  { pd: 'ant', red: true, imgs: [], ai: 'hunter', contact: 'always', corpse: 'pd', pts: 30, spd: 2.4, hpMul: 0.9, hMul: 0.65, pdw: 1.7, cause: 'BITTEN BY A FIRE ANT' },
  fly:      { imgs: ['hs_fly'], ai: 'flyer', faceL: true, corpse: 'flip', pts: 15, spd: 3.0, hpMul: 0.5, hMul: 0.75 },
  bee:      { imgs: ['hs_bee'], ai: 'flyer', dive: true, contact: 'dive', faceL: false, corpse: 'flip', pts: 30, spd: 3.2, hpMul: 0.7, hMul: 0.8, cause: 'STUNG BY A BEE' },
  mosquito: { imgs: ['hs_mosquito'], ai: 'flyer', dive: true, contact: 'dive', faceL: false, corpse: 'flip', pts: 25, spd: 3.4, hpMul: 0.6, hMul: 0.8, cause: 'SUCKED DRY BY A MOSQUITO' },
  butterfly:{ imgs: ['hs_butterfly'], ai: 'flyer', faceL: false, corpse: 'flip', pts: 40, spd: 2.2, hpMul: 0.5, hMul: 0.9 },
  spider:   { imgs: ['hs_spider'], ai: 'dropper', contact: 'always', faceL: false, corpse: 'flip', pts: 35, spd: 2.6, hpMul: 0.9, hMul: 0.8, cause: 'WRAPPED UP BY A SPIDER' },
  bigspider:{ imgs: ['hs_spider2'], ai: 'dropper', contact: 'always', faceL: false, corpse: 'flip', pts: 70, spd: 2.4, hpMul: 1.3, hMul: 0.85, cause: 'EATEN BY A HOUSE SPIDER' },
  dog:      { imgs: ['hs_dog'], ai: 'hunter', contact: 'always', faceL: true, walkF: R(0, 7), corpse: 'flip', pts: 150, spd: 3.0, hpMul: 1.6, hMul: 1.1, cause: 'LICKED TO DEATH BY THE DOG' },
  fruit:    { imgs: ['hs_apple', 'hs_banana', 'hs_cherry', 'hs_grape', 'hs_grape2', 'hs_orange', 'hs_pear'], ai: 'static', corpse: 'squash', pts: 30, spd: 0, hpMul: 1.0, colored: true },
  catB:     { imgs: ['hs_cat'], ai: 'hunter', faceL: true, corpse: 'flip', pts: 300, spd: 3.0, hpMul: 1.0, cause: 'BATTED AROUND BY MR. WHISKERS' },
  // ----- THE SOLAR SYSTEM (3-D: NASA 3D Resources, Poly Haven rocks, NASA planet maps)
  glove:     { models: ['n:glove', 'n:tool'], imgs: [], ai: 'drift', swim: true, corpse: 'model', pts: 8, spd: 0.5, hpMul: 0.3, hMul: 0.8 },
  cubesat:   { models: ['n:cubesat1', 'n:icecube'], imgs: [], ai: 'drift', swim: true, corpse: 'model', pts: 12, spd: 0.6, hpMul: 0.4 },
  astronaut: { models: ['n:astronaut'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 20, spd: 1.2, hpMul: 0.5 },
  smallsat:  { models: ['n:cloudsat', 'n:swift', 'n:landsat7', 'n:spitzer'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 30, spd: 1.6, hpMul: 0.7 },
  probe:     { models: ['n:galileo', 'n:voyager', 'n:cassini', 'n:dawn', 'n:sdo', 'n:aura'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 45, spd: 1.8, hpMul: 0.8 },
  parker:    { models: ['n:parker'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 60, spd: 4.0, hpMul: 0.6 },
  telescope: { models: ['n:hubble', 'n:chandra'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 70, spd: 1.0, hpMul: 1.0, hMul: 1.1 },
  impactor:  { models: ['n:deepimpact'], imgs: [], ai: 'rammer', swim: true, contact: 'ram', corpse: 'model', pts: 60, spd: 1.8, hpMul: 0.9, cause: 'HIT BY A PLANETARY DEFENSE IMPACTOR' },
  shuttle:   { models: ['n:shuttle'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 100, spd: 1.6, hpMul: 1.2, hMul: 1.1 },
  lander:    { models: ['n:lem'], imgs: [], ai: 'school', swim: true, corpse: 'model', pts: 80, spd: 1.2, hpMul: 1.0 },
  station:   { models: ['n:iss', 'n:skylab'], imgs: [], ai: 'drift', swim: true, corpse: 'model', pts: 120, spd: 0.5, hpMul: 1.6, hMul: 1.3 },
  rocket:    { models: ['n:saturnv'], imgs: [], ai: 'rammer', swim: true, contact: 'ram', corpse: 'model', pts: 150, spd: 1.6, hpMul: 1.4, hMul: 1.2, cause: 'FLATTENED BY A SATURN V' },
  asteroid:  { models: ['n:moon_rock_01', 'n:moon_rock_03', 'n:moon_rock_05', 'n:bennu'], imgs: [], ai: 'hunter', swim: true, contact: 'always', corpse: 'model', pts: 40, spd: 1.4, hpMul: 1.4, cause: 'SMASHED BY AN ASTEROID' },
  smallmoon: { models: ['planet:phobos', 'planet:deimos'], imgs: [], ai: 'drift', swim: true, contact: 'always', grav: true, corpse: 'model', pts: 100, spd: 0.3, hpMul: 2.0, cause: 'CRASHED INTO A MOON' },
  moonB:     { models: ['planet:moon', 'planet:io', 'planet:europa', 'planet:ganymede', 'planet:callisto', 'planet:titan', 'planet:enceladus', 'planet:pluto', 'planet:charon'], imgs: [], ai: 'drift', swim: true, contact: 'always', grav: true, corpse: 'model', pts: 200, spd: 0.25, hpMul: 2.2, cause: 'CRASHED INTO A MOON' },
  planetB:   { models: ['planet:mars', 'planet:venus', 'planet:earth', 'planet:neptune', 'planet:uranus'], imgs: [], ai: 'drift', swim: true, contact: 'always', grav: true, corpse: 'model', pts: 400, spd: 0.2, hpMul: 2.4, cause: 'CRASHED INTO A PLANET' },
  giant:     { models: ['planet:jupiter', 'planet:saturn'], imgs: [], ai: 'drift', swim: true, contact: 'always', grav: true, corpse: 'model', pts: 700, spd: 0.15, hpMul: 2.6, cause: 'SWALLOWED BY A GAS GIANT' },
  sunB:      { models: ['sun'], imgs: [], ai: 'hunter', swim: true, grav: true, corpse: 'model', pts: 900, spd: 0.8, hpMul: 1.0, cause: 'VAPORIZED BY THE SUN' },
};

// ---------------------------------------------------------------- bosses
const BOSSES = {
  alpha:   { sp: 'trex',     name: 'THE ALPHA',           sub: 'the last tyrant of the jungle',        ai: 'hunter',   mass: 1.9, min: 40, hp: 3.0, hMul: 1.15, tint: ['#2a0010', 0.35] },
  goomongous: { sp: 'horn',  name: 'KING GOOMONGOUS',     sub: 'he bounces. the planet bounces back.', ai: 'bouncer',  mass: 2.2, min: 40, hp: 9.0, hMul: 1.4 },
  kraken:  { sp: 'sharkE',   name: 'THE KRAKEN',          sub: 'bite the eye when it opens',           ai: 'kraken',   mass: 2.4, min: 40, hp: 7.0, hMul: 1 },
  kinglion: { sp: 'lion',    name: 'KING LION',           sub: 'the king of cube country wants his crown back', ai: 'kinglion', mass: 2.2, min: 40, hp: 9.0, hMul: 1.1 },
  bigtony:  { sp: 'mobster', name: 'BIG TONY',            sub: 'the mob boss. he throws whatever he can lift.', ai: 'chief',    mass: 2.0, min: 40, hp: 8.0, hMul: 1.8, key: 'bw_boss',
              shot: 'barrel', gun: true, call: 'GET HIM, BOYS!', walkF: R(6, 13), idleF: R(0, 5), actF: R(0, 5) },
  serpent:  { sp: 'serpentB', name: 'OUROBOROS', sub: 'the star-serpent that eats its own tail. bite its body!', ai: 'serpent', mass: 2.0, min: 40, hp: 8.0, hMul: 1.0 },
  whiskers: { sp: 'catB', name: 'MR. WHISKERS', sub: 'the house cat has spotted something tiny...', ai: 'cat', mass: 2.4, min: 40, hp: 8.0, hMul: 1.35,
              walkF: R(0, 9), idleF: R(22, 24), actF: [18, 19], hitF: 20 },
  sol:      { sp: 'sunB', name: 'THE SUN', sub: 'every planet you ate was orbiting something.', ai: 'sun', mass: 2.5, min: 80, hp: 9.0, hMul: 1.5 },
};

// ---------------------------------------------------------------- worlds
// spawn: one table per form · [species, weight, massMin, massMax, groupMin, groupMax]
const WORLDS = [
  {
    key: 'jurassic', name: 'JURASSIC', episode: 'EPISODE I', tagline: 'eat or be eaten', theme: 'jungle', style: 'pixel',
    font: '"Press Start 2P", monospace', fontScale: 1, smooth: false, physics: 'walk', hazard: 'meteor', boss: 'alpha',
    forms: ['raptor', 'tyrant', 'behemoth'], at: [0, 6, 16], golden: 'compy',
    spawn: [
      [['compy', 10, 0.6, 1.5, 2, 5], ['eggs', 3, 0.6, 1.0, 1, 1], ['trike', 4, 1.4, 6, 1, 3], ['ptero', 3, 1.5, 4.5, 1, 2], ['trex', 1.2, 9, 16, 1, 1]],
      [['compy', 5, 0.8, 2.2, 3, 6], ['eggs', 2, 1, 2, 1, 1], ['trike', 6, 3, 12, 2, 4], ['ptero', 4, 2, 7, 1, 3], ['anky', 3, 5, 16, 1, 2], ['trex', 2.5, 8, 24, 1, 1]],
      [['compy', 2, 1, 3, 4, 8], ['trike', 5, 7, 20, 2, 4], ['anky', 4, 10, 28, 1, 2], ['ptero', 3, 4, 14, 2, 3], ['trex', 4, 14, 40, 1, 2], ['sauro', 3, 28, 80, 1, 2]],
    ],
    events: [
      { t: 'hazard', name: 'METEOR SHOWER!', sub: 'watch the sky', color: '#ff6b3a' },
      { t: 'stampede', name: 'STAMPEDE!', sp: 'trike', color: '#ffb03a' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'PTERO RAID!', sub: 'they swoop — roar or dodge', sp: ['ptero'], n: 5, color: '#7ad7ff' },
    ],
  },
  {
    key: 'goo', name: 'GOO GALAXY', episode: 'EPISODE II', tagline: 'everything is squishy. everything is snacks.', theme: 'goo', style: 'cartoon',
    font: '"Luckiest Guy", "Arial Black", sans-serif', fontScale: 1.45, smooth: true, physics: 'walk', hazard: 'goo', boss: 'goomongous',
    forms: ['gooblet', 'chompling', 'furrbeast'], at: [0, 9, 28], golden: 'goober',
    spawn: [
      [['goober', 9, 0.5, 1.4, 2, 4], ['blot', 6, 0.4, 1.0, 2, 4], ['bird', 3, 0.8, 2, 1, 2], ['pinky', 3, 1.2, 2.6, 1, 2], ['cubey', 3, 2, 4, 1, 2], ['plant', 2, 2, 5, 1, 1], ['flappy', 1.5, 3, 6, 1, 1], ['cyclo', 1.5, 4, 8, 1, 1]],
      [['goober', 4, 1, 2.4, 3, 5], ['pinky', 4, 2, 5, 2, 3], ['cubey', 4, 3, 8, 1, 3], ['cyclo', 4, 4, 12, 1, 2], ['zombie', 3, 5, 12, 1, 2], ['plant', 2, 4, 9, 1, 1], ['flappy', 3, 4, 10, 1, 2], ['bluey', 3, 8, 18, 1, 1], ['bird', 2, 2, 4, 2, 3]],
      [['cubey', 3, 6, 14, 2, 3], ['cyclo', 3, 8, 20, 2, 3], ['zombie', 3, 8, 20, 2, 3], ['skull', 3, 10, 24, 1, 2], ['bluey', 3, 12, 28, 1, 2], ['redhorn', 3, 16, 36, 1, 2], ['horn', 3, 24, 60, 1, 1], ['flappy', 2, 8, 18, 2, 3], ['goober', 2, 2, 5, 4, 7]],
    ],
    events: [
      { t: 'hazard', name: 'GOO RAIN!', sub: 'big wet globs from the sky', color: '#7dff6a' },
      { t: 'stampede', name: 'BLOB STAMPEDE!', sp: 'cyclo', color: '#5ad8ff' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'FLAPPY SWARM!', sub: 'incoming from above', sp: ['flappy'], n: 6, color: '#b8ff3a' },
    ],
  },
  {
    key: 'deep', name: 'THE DEEP', episode: 'EPISODE III', tagline: 'down here, nobody hears you chomp', theme: 'deep', style: 'ink',
    font: '"Patrick Hand", "Comic Sans MS", cursive', fontScale: 1.55, smooth: true, physics: 'swim', hazard: 'charge', boss: 'kraken',
    forms: ['jelly', 'eel', 'shark'], at: [0, 6, 17], golden: 'fish',
    spawn: [
      [['fish', 10, 0.3, 1.0, 3, 6], ['shrimp', 5, 0.5, 1.2, 1, 3], ['jellyE', 3, 1.5, 4, 1, 3], ['eelE', 2, 3, 6, 1, 1], ['diver', 1.5, 3, 6, 1, 1]],
      [['fish', 6, 0.6, 2, 4, 7], ['shrimp', 3, 1, 2.5, 2, 3], ['jellyE', 4, 3, 9, 2, 4], ['eelE', 4, 4, 12, 1, 2], ['diver', 3, 5, 12, 1, 2], ['sharkE', 2, 10, 22, 1, 1]],
      [['fish', 4, 1.5, 4, 5, 9], ['jellyE', 3, 6, 16, 2, 4], ['eelE', 3, 8, 20, 2, 3], ['diver', 4, 8, 20, 1, 3], ['sharkE', 4, 14, 40, 1, 2], ['boat', 2.5, 18, 50, 1, 1]],
    ],
    events: [
      { t: 'hazard', name: 'DEPTH CHARGES!', sub: 'the boats above are angry', color: '#ffd27a' },
      { t: 'stampede', name: 'SHARK RUN!', sp: 'sharkE', color: '#ff6b6b' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'HARPOON SQUAD!', sub: 'divers incoming', sp: ['diver'], n: 5, color: '#ffe066' },
    ],
  },
  {
    key: 'cube', name: 'CUBE COUNTRY', episode: 'EPISODE IV', tagline: 'now in glorious 3-D!', theme: 'cube', style: '3d',
    font: '"Fredoka", "Arial Rounded MT Bold", sans-serif', fontScale: 1.35, smooth: true, physics: 'roam', hazard: 'gift', boss: 'kinglion',
    forms: ['caterpillar', 'tigerP', 'elephantP'], at: [0, 8, 24], golden: 'chick',
    spawn: [
      [['chick', 6, 0.4, 1.2, 2, 4], ['bunny', 5, 0.6, 1.6, 1, 3], ['parrot', 3, 0.8, 2, 1, 2], ['pig', 3, 1.5, 3.5, 1, 2], ['cat', 2, 2, 4, 1, 2], ['dog', 4, 3, 7, 1, 2], ['monkey', 3, 3, 6, 1, 2], ['hog', 2, 5, 10, 1, 1]],
      [['pig', 3, 4, 9, 1, 2], ['cat', 3, 5, 10, 1, 2], ['dog', 4, 8, 18, 2, 3], ['monkey', 4, 8, 16, 1, 2], ['hog', 3, 12, 24, 1, 2], ['cow', 3, 10, 20, 1, 2], ['parrot', 3, 4, 9, 2, 3], ['lion', 3, 20, 40, 1, 1], ['chick', 2, 1, 3, 3, 5]],
      [['cow', 4, 20, 45, 2, 3], ['giraffe', 3, 30, 60, 1, 2], ['elephantE', 3, 45, 90, 1, 2], ['lion', 4, 30, 70, 1, 2], ['tigerE', 4, 25, 55, 1, 2], ['hog', 3, 18, 40, 2, 3], ['monkey', 3, 15, 30, 2, 3], ['pig', 2, 6, 12, 3, 5]],
    ],
    events: [
      { t: 'hazard', name: 'PRESENT DROP!', sub: 'giant gifts falling from the sky', color: '#ff5ad8' },
      { t: 'stampede', name: 'COW STAMPEDE!', sp: 'cow', color: '#ffe066' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'MONKEY BUSINESS!', sub: 'incoming coconuts', sp: ['monkey'], n: 6, color: '#7dff6a' },
    ],
  },
  {
    key: 'film', name: 'CREATURE FEATURE', episode: 'EPISODE V', tagline: 'IT CAME FROM THE TELEVISION SET!', theme: 'film', style: 'film',
    font: '"Special Elite", "Courier New", monospace', titleFont: '"Creepster", "Special Elite", cursive', fontScale: 1.3, smooth: true, physics: 'city', hazard: 'shell', boss: 'bigtony',
    forms: ['blob', 'robot', 'lizard'], at: [0, 9, 28], golden: 'person',
    spawn: [
      [['person', 7, 0.5, 1.4, 1, 3], ['mobster', 5, 1.5, 3.5, 1, 2], ['car', 3, 2.5, 5, 1, 1], ['soldier', 4, 1.5, 3.5, 1, 2], ['plane', 2, 3, 6, 1, 1]],
      [['person', 5, 1.5, 3, 2, 4], ['mobster', 5, 4, 9, 2, 3], ['soldier', 5, 4, 10, 2, 3], ['car', 3, 6, 12, 1, 2], ['truck', 2, 10, 18, 1, 1], ['tank', 2, 16, 30, 1, 1], ['plane', 3, 6, 14, 1, 2], ['heli', 3, 10, 18, 1, 1]],
      [['soldier', 4, 10, 22, 3, 4], ['mobster', 3, 10, 20, 2, 3], ['tank', 4, 30, 60, 1, 2], ['truck', 3, 20, 40, 1, 2], ['plane', 4, 18, 40, 2, 3], ['heli', 4, 22, 45, 1, 2], ['person', 3, 3, 6, 3, 5]],
    ],
    events: [
      { t: 'hazard', name: 'ARTILLERY!', sub: 'the army is shelling the city', color: '#ffffff' },
      { t: 'raid', name: 'AIR RAID!', sub: 'biplanes over the city', sp: ['plane', 'heli'], n: 5, color: '#ffffff' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffffff' },
      { t: 'raid', name: 'THE MOB ARRIVES!', sub: 'tommy guns', sp: ['mobster'], n: 6, color: '#ffffff' },
    ],
  },
  {
    key: 'neon', name: 'NEON ORBIT', episode: 'EPISODE VI', tagline: 'every little planet has its own gravity', theme: 'neon', style: 'neon',
    font: '"Orbitron", "Arial Black", sans-serif', fontScale: 1.0, smooth: true, physics: 'space', hazard: 'comet', boss: 'serpent',
    forms: ['worm', 'octo', 'whale'], at: [0, 9, 28], golden: 'mote',
    spawn: [
      [['mote', 8, 0.3, 1.0, 3, 6], ['astro', 5, 0.6, 1.6, 1, 2], ['tri', 4, 0.8, 2.2, 2, 4], ['sjelly', 3, 1.5, 4, 1, 2], ['diamond', 3, 2.5, 5, 1, 1], ['rock', 2, 3, 7, 1, 2], ['sshark', 0.6, 5, 9, 1, 1]],
      [['tri', 4, 3, 8, 3, 5], ['sjelly', 3, 4, 10, 1, 3], ['astro', 3, 2, 5, 2, 3], ['diamond', 4, 6, 14, 1, 2], ['saucer', 3, 8, 18, 1, 2], ['rock', 3, 8, 20, 1, 3], ['sshark', 2, 14, 26, 1, 1], ['mote', 2, 1, 3, 5, 8]],
      [['saucer', 4, 25, 50, 2, 3], ['sshark', 4, 35, 70, 1, 2], ['rock', 4, 35, 90, 2, 3], ['diamond', 3, 20, 40, 2, 3], ['sjelly', 3, 20, 45, 2, 3], ['tri', 2, 10, 20, 4, 6], ['astro', 2, 6, 12, 2, 4]],
    ],
    events: [
      { t: 'hazard', name: 'METEOR SHOWER!', sub: 'comets incoming from every direction', color: '#ff8a3a' },
      { t: 'stampede', name: 'ASTEROID BELT!', sp: 'rock', color: '#c8a8ff' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'INVASION!', sub: 'flying saucers and diamond drones', sp: ['saucer', 'diamond'], n: 6, color: '#7dff6a' },
    ],
  },
  {
    key: 'house', name: 'HOME SWEET GIANT HOME', episode: 'EPISODE VII', tagline: 'honey, i shrunk the player', theme: 'house', style: 'sticker',
    font: '"Chewy", "Comic Sans MS", cursive', fontScale: 1.25, smooth: true, physics: 'house', hazard: 'block', boss: 'whiskers',
    forms: ['baby', 'kid', 'adult', 'grandpa'], at: [0, 6, 15, 32], golden: 'crumb',
    spawn: [
      [['crumb', 8, 0.3, 1.0, 2, 4], ['ant', 8, 0.4, 1.4, 2, 5], ['fly', 4, 0.8, 2, 1, 2], ['fruit', 3, 3, 7, 1, 1], ['fireant', 2, 2.5, 5, 1, 2], ['spider', 1.5, 2.5, 4.5, 1, 1], ['butterfly', 1.5, 1, 2, 1, 1]],
      [['ant', 5, 1, 3, 3, 5], ['fireant', 4, 4, 10, 2, 3], ['fly', 4, 2, 5, 1, 3], ['bee', 3, 5, 11, 1, 2], ['spider', 3, 6, 14, 1, 1], ['fruit', 3, 8, 18, 1, 1], ['butterfly', 2, 3, 6, 1, 2], ['crumb', 2, 1, 3, 3, 5]],
      [['fireant', 4, 8, 18, 2, 4], ['bee', 4, 10, 22, 2, 3], ['mosquito', 4, 10, 20, 2, 3], ['bigspider', 3, 18, 36, 1, 1], ['fruit', 3, 18, 36, 1, 1], ['dog', 1.5, 40, 70, 1, 1], ['butterfly', 2, 6, 12, 2, 3], ['ant', 2, 2, 5, 4, 6]],
      [['bee', 4, 20, 45, 2, 4], ['mosquito', 3, 20, 40, 2, 3], ['bigspider', 4, 35, 70, 1, 2], ['dog', 3, 60, 120, 1, 1], ['fireant', 3, 18, 40, 3, 5], ['fruit', 3, 40, 80, 1, 1], ['fly', 2, 10, 20, 3, 5]],
    ],
    events: [
      { t: 'hazard', name: 'TOY STORM!', sub: 'the toddler upstairs is throwing blocks', color: '#ff7a59' },
      { t: 'stampede', name: 'ANT PARADE!', sp: 'ant', color: '#8a5a3a' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'BUZZ BOMB!', sub: 'a swarm got in through the window', sp: ['bee', 'mosquito'], n: 6, color: '#ffc93a' },
    ],
  },
  {
    key: 'sol', name: 'THE SOLAR SYSTEM', episode: 'EPISODE VIII', tagline: 'real spacecraft. real planets. one appetite.', theme: 'sol', style: 'real',
    font: '"Rajdhani", "Helvetica Neue", sans-serif', fontScale: 1.25, smooth: true, physics: 'orbit', hazard: 'comet', boss: 'sol',
    forms: ['rock', 'comet', 'moonP', 'bhole'], at: [0, 7, 18, 40], golden: 'cubesat',
    spawn: [
      [['glove', 4, 0.3, 0.8, 1, 2], ['cubesat', 7, 0.4, 1.3, 2, 4], ['astronaut', 3, 0.8, 1.6, 1, 1], ['smallsat', 3, 2.5, 5, 1, 1], ['asteroid', 3, 3, 7, 1, 2], ['impactor', 1.5, 4, 7, 1, 1]],
      [['cubesat', 3, 1.5, 3, 3, 5], ['smallsat', 5, 3, 8, 1, 2], ['probe', 5, 5, 12, 1, 2], ['parker', 2, 5, 10, 1, 1], ['telescope', 2, 12, 22, 1, 1], ['asteroid', 4, 10, 24, 1, 3], ['impactor', 3, 10, 18, 1, 2], ['astronaut', 2, 2, 4, 1, 2]],
      [['probe', 4, 8, 16, 2, 3], ['telescope', 3, 15, 30, 1, 2], ['shuttle', 3, 20, 40, 1, 1], ['lander', 3, 15, 30, 1, 2], ['station', 2, 35, 60, 1, 1], ['rocket', 2, 30, 55, 1, 1], ['asteroid', 4, 25, 55, 2, 3], ['smallmoon', 2, 40, 70, 1, 1], ['impactor', 2, 18, 30, 2, 3]],
      [['moonB', 6, 55, 120, 1, 1], ['planetB', 4, 110, 260, 1, 1], ['giant', 2, 300, 600, 1, 1], ['asteroid', 3, 40, 90, 3, 5], ['station', 2, 40, 70, 1, 2], ['smallmoon', 3, 45, 80, 1, 2], ['shuttle', 2, 30, 50, 2, 3]],
    ],
    events: [
      { t: 'hazard', name: 'METEOROID SHOWER!', sub: 'debris incoming from every direction', color: '#ffb347' },
      { t: 'stampede', name: 'ASTEROID BELT!', sp: 'asteroid', color: '#c8b8a0' },
      { t: 'frenzy', name: 'GOLDEN FRENZY!', sub: 'no hunger · 5x points', color: '#ffd23a' },
      { t: 'raid', name: 'PLANETARY DEFENSE!', sub: 'impactors launched to deflect you', sp: ['impactor'], n: 5, color: '#ff6a4a' },
    ],
  },
];

// ---------------------------------------------------------------- themes (colors used by the renderer)
const THEMES = {
  jungle: { sky: ['#4aa3c8', '#bfe6d8', '#ffe7b0'], dusk: ['#2b2350', '#c8567a', '#ffb067'], doom: ['#1a0606', '#7a1a10', '#ff6a1c'], far: '#6a7c9a', farDoom: '#4a2030', mid: '#3e7a5a',
    grassA: '#5fae34', grassB: '#a3e05a', dirtA: '#7a5232', dirtB: '#3a2416', tuft: '#4e9a2c', rock: '#8a8078', amp: 1, ui: '#ffe9c0', accent: '#ffd23a' },
  goo: { sky: ['#3a1a6a', '#b04ad0', '#ff9ad0'], doom: ['#0a2a10', '#2a7a2a', '#b8ff3a'], far: '#7a3ab0', mid: '#e05aa0', outline: '#1a0c2a',
    grassA: '#7dff6a', grassB: '#d8ffa8', dirtA: '#ff7ab8', dirtB: '#7a2a8a', amp: 0.9, ui: '#fff4a8', accent: '#ff7ad9' },
  deep: { water: ['#4a8ac0', '#2a6496', '#163c62', '#0a1e36'], sky: ['#9ad4f0', '#e8f6ff'], sand: '#2a2a30', sandTop: '#4a4a52', amp: 0.55, ui: '#e8f6ff', accent: '#7ad7ff', depth: 1500 },
  cube: { sky: ['#5ec8ff', '#b8f0ff', '#ffe0f4'], grass: ['#7ee06a', '#a6f08a'], amp: 0, ui: '#ffffff', accent: '#ff5ad8', depth: 1600 },
  film: { amp: 0, ui: '#f2f2f2', accent: '#ffffff', building: 1 },
  neon: { amp: 0, ui: '#e8f8ff', accent: '#3affd8' },
  house: { amp: 0, ui: '#fff8e8', accent: '#ff7a59' },
  sol: { amp: 0, ui: '#e8eef8', accent: '#ffb347' },
};

window.CHOMP_DATA = { FORMS, SP, BOSSES, WORLDS, ABILITIES, THEMES };
})();
