# EAT THE MULTIVERSE

A multiverse anthology about eating everything. Each episode is a different universe with its own art style, creatures, music and physics. Eat anything smaller than you, bite down anything bigger, and evolve into a new creature with new powers. When you reach your final form, devour the world's boss and move on to the next universe.

## Play
Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8765    # then visit http://localhost:8765

On the title page, pick a universe (click a card or use ←/→), then press START. TUTORIAL teaches the basics in under a minute.

## The eight universes
| Episode | Style | You evolve | Powers you collect | Boss |
|---|---|---|---|---|
| I · Jurassic | pixel art | Raptor → Tyrant → Behemoth | Roar, Smash | The Alpha |
| II · Goo Galaxy | glossy cartoon | Gooblet → Chompling → Furrbeast | Goo Spit, Mega Gulp, Spike Storm, Smash | King Goomongous |
| III · The Deep | hand-drawn ink (you **swim**) | Jelly → Electric Eel → Great Shark | Zap, Storm Field, Blood Frenzy | The Kraken (bite the eye when it opens) |
| IV · Cube Country | colorful real 3-D (you **roam** in every direction and jump) | Caterpillar → Tiger → Elephant | Silk Shot, Roar, Cyclone, Trunk Vacuum, Quake, Stampede | King Lion (jump over his roar rings) |
| V · Creature Feature | black-and-white B-movie on an old TV (you **climb skyscrapers**) | The Blob → Robot Monster → Giant Lizard | Engulf, Ray Gun, Rocket Leap, Atomic Breath, Roar, Smash | Big Tony |
| VI · Neon Orbit | glowing vector arcade (every little planet has its **own gravity**: run all the way around it, hold SPACE to float to the next) | Space Worm → Star Squid → Cosmic Whale | Wormhole, Gravity Bomb, Supernova, Smash | Ouroboros (bite its body, dodge its head) |
| VII · Home Sweet Giant Home | die-cut sticker book (you're **tiny**: jump up onto pianos, counters, tables and shelves; S drops through; piano keys play notes, beds and sofas bounce, stove burners heat up) | Baby → Kid → Grown-Up → Grandpa | Tantrum, Slingshot, Vacuum, Cane Whack, Dentures, Smash | Mr. Whiskers the house cat |
| VIII · The Solar System | photoreal 3-D: real NASA spacecraft, real planet maps, the real star map (you **drift with momentum**; planets and moons pull you in) | Rogue Asteroid → Comet → Rogue Moon → Black Hole | Ramming Speed, Burning Coma, Tidal Pull, Relativistic Jet, Event Horizon | The Sun |

Every evolution is a different creature, and each one adds a power. Late-game kits get wild: tornadoes, death rays, atomic breath, screen-wide quakes.

## Controls
| Action | Keyboard | Gamepad |
|---|---|---|
| Move | A/D or ←/→ | Stick / D-pad |
| Jump (Gooblet triple-jumps; only SPACE in Cube Country) | W / ↑ / Space | A |
| Swim up / down (The Deep), walk in depth (Cube Country) | W / S | Stick |
| Climb a building (Creature Feature) | hold toward the wall; SPACE wall-jumps | Stick |
| Pounce-bite (0.8s cooldown) | Shift / J / X | X or B |
| Creature powers | **E**, **R**, **Q** | Y, RB, LB |
| Smash (in the air, 4s cooldown) | S / ↓ | Down |
| Pause / Mute | P or Esc / M | Start |

Every power shows its cooldown on the HUD. Slots you haven't unlocked yet read "???" until you evolve.

## Rules of the food chain
- **Green ▼** means you can eat it whole. **Red !** means it can hurt you.
- The bigger you get, the more you can eat. Each evolution raises the limit, from 85% of your own size up to about 160%.
- Bosses shrug off most power damage, so bites are what count. Powers are for crowd control and setting up bites.
- Your belly drains all the time, so keep eating.
- Each universe has its own hazard: meteors, goo rain, depth charges, falling presents, artillery shells, comets, toy blocks, meteoroid showers. Final forms are immune.

## Sound
Each universe has its own music and its own recorded sound effects: dinosaur roars and crunches, cartoon squishes and boings, underwater bubbles, cute squeaks in Cube Country, theremins and tommy guns in Creature Feature, arcade blips in Neon Orbit, and meows and squeaky toys in the house. Everything is CC0. Recorded sounds need the game to be served over http (`python3 -m http.server`). If you open `index.html` straight from disk, the music still plays but sound effects fall back to the built-in synth versions. Press M to mute.

See `CREDITS.md` for sprite, music, sound and font licenses.

### Dev
`index.html#test=WORLD,FORM,BOSS,SECONDS` starts a world with a self-playing bot, which is handy for screenshots. Example: `#test=2,2,1,20`.
