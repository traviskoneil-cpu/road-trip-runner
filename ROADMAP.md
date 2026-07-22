# Road Trip Arcade — Roadmap

The umbrella vision: a **collection of road-trip mini-games**, unified by the car
+ the radio, tied together by a Miles economy that unlocks songs, games, cities,
and cars. Web-first, but built to become a mobile app later. See the design
notes throughout for the "why."

---

## ✅ Done so far

- [x] **Window Dash** endless runner (`/`) — 6 cross-country cities, car-window
      framing, rain, rides (skateboard/motorcycle), difficulty pacing.
- [x] Real generated **hand sprite** runner with code-animated legs.
- [x] **Fake-radio universe** — 4 decade stations with DJ personas.
- [x] **'90s station (The Dirt / Meg):** 17 songs, 15 bands, bios, and Meg **fully
      voiced** (76 clips: IDs, ads, intros/outros, rain, cities, unlocks).
- [x] **'00s station (The Blender):** 17 songs, bands, bios, genres. Script written.
- [x] **My Mixtape** — collect songs by finishing them; real embedded album art.
- [x] **Wheel Jam** rhythm game (`/tap/`) — beat-detection charts, holds + chords,
      windshield/traffic, sync calibration, touch-forgiving windows,
      decade grouping + genre tags, and **difficulty unlocks** (Easy → Medium → Hard,
      gated by grade) backed by the new `Save` profile.
- [x] Deployed on **Vercel** via GitHub; installable **PWA** basics (manifest/icon).

---

## 🎵 Content pipeline

**Songs — target ~17 per decade:**
- [x] '90s — 17 songs
- [x] '00s — 17 songs
- [ ] '80s — *in progress*
- [ ] '70s — not started
- [ ] '90s bonus: add the **Oasis-style** song when ready

**DJ voices (record in ElevenLabs, drop in `radio/clips/`):**
- [x] Meg ('90s) — done
- [x] **Jamie & The Toad ('00s)** — 101 clips complete: 44 shuffled song
      intros, 23 song outros, Jamie's station/event lines, the 14-clip Toad
      library, selected mid-sentence interruptions, and a seven-clip Text Me
      Back battle with setup, Round 2, and wrap-up dialogue.
- [ ] Velvet Vince ('70s) — persona written; needs songs first
- [ ] Hurricane Hammers ('80s) — persona written; needs songs first

**Radio features already built, waiting on clips:** Text Me Back "chart battle,"
per-city / unlock / rain event lines, station IDs + fake ads.

---

## 🎮 Mini-games (the collection)

Each game = a "seat" in the car. Build order = fastest-to-fun first.

- [x] **Windshield / driver → Wheel Jam** (rhythm game)
- [x] **Side window / kid → Window Dash** (finger game)
- [ ] **Passenger → Bingo / Punch-Buggy** — spot a landmark in the scenery
      before the computer. *Reuses existing scenery art; silent-friendly.*
      **(recommended next build)**
- [ ] **Back seat → Snack Stack (merge)** — Mom hands snacks/drinks/meals/entertainment
      back to keep the kids happy. Auto-unlocks at **DC** (snacks only); miles unlock
      the rest of the generators. Sticky/idle layer.
- [ ] **Trunk → Pack the Car (Tetris)** — fit the cooler (square), hockey stick (L),
      duffel, etc. **Gates each new vehicle** (pack it before you can drive it), earns
      miles. Build as real Tetris, not match-3.
- [ ] ~~Match-3~~ — decided to skip / fold into Packing (weakest theme fit).
- [ ] Room for more games later — they slot into the same unlock pattern.

---

## 🏗️ Architecture & progression system

> **Naming:** the game titles are **Window Dash**, **Wheel Jam**, **Snack Stack**, and
> **Plate Parade**. Code folders and save keys stay `tap/`, `navigator`, etc. so each
> mini-game keeps opening standalone for testing.

**Foundations to build:**
- [~] **Map-hub home screen (`/home.html`)** — *started.* The intended-flow front
      door: mock route map (NYC lit, rest locked), Start the Trip, radio tuner,
      game cards (Wheel Jam / Snack Stack-locked / Mixtape / Dealership-soon), miles +
      song counters. Reads the shared `Save`. Becomes the true root at SPA time.
- [x] **Shared save/profile** — *done.* One `Save` module in **`/save.js`**, loaded by
      both games, owns a single `localStorage.rtr_save` blob (`v2`: `difficulties`,
      `collected`, `miles`, `runnerBest`, `cities`, `cars`, `currentCar`, `settings`).
      Losslessly migrates the old `rtr_best` / `rtr_collected` / `tap_sync` keys on
      first load. `miles` earning/spending API is present but not yet wired into
      gameplay (next step). Built abstract + **account-ready** (can graduate to a server later).
- [ ] **SPA shell** (single-page, view-swapping) — NOT iframes, so it's portable
      to PWA + Capacitor. Owns the persistent radio + the unlock UI. Move the
      `Save` module to a shared file at this point.
- [ ] **Entitlement layer** — a `hasUnlock(item)` check that doesn't care whether
      the grant came from gameplay, Stripe, or app-store IAP.
- [ ] **Global leaderboard** — *needs a backend (no DB yet).* Per-song / per-mode
      high scores across players. Ties into the eventual **accounts** layer (same
      bridge as purchases). For now the profile stores only local bests; design the
      score-submit API so it can point at a server later without touching gameplay.

## 🎯 Progression — CANONICAL (locked in)

**Per-game rules:**
- [ ] **Window Dash** → earns **miles** + **collects songs** (finish a song to collect it).
      Collected songs show up in the **mixtape playlist AND become playable in Wheel Jam
      Mode.** Always starts in **NYC**; unlocked cities extend how far the route reaches.
- [~] **Wheel Jam** → earns **miles** + its own internal unlock (harder
      difficulties, Easy→Medium→Hard by grade). *Difficulty gate shipped, but it's
      currently **global** — needs to become **per-song** (each track unlocks its own
      Medium/Hard). New flow: **click song → click difficulty** (not a global toggle).*
- [ ] **Snack Stack** → **auto-unlocks on reaching DC**, starting with ONE
      generator (**snacks**); spend miles to add **drinks → meals → entertainment**.
- [ ] **Pack the Car (Tetris)** → tied to **vehicles** and unlocks with the Family SUV
      at Chicago. The Station Wagon follows at Los Angeles and the 70s Custom Van
      at San Francisco. Also earns miles.

**Miles (one currency) — earned everywhere, spent on:**
- [ ] new **map areas / cities** (the spine; cheap early → pricier later)
- [ ] **Snack Stack generators** (drinks, meals, entertainment)
- [ ] **new vehicles**
- [ ] **Roadside Music Credits** at the Gas Station (redeem one credit for one
      locked core-rotation song in the Mixtape; special songs remain earn-only)

**The unlock ladder (start → mid):**
1. Start: Window Dash, NYC, '90s.
2. Finish the **short starter song** (make it the guaranteed first track) → **unlocks Wheel Jam.**
3. Two miles sources now → bank miles → **unlock DC** (route extends).
4. Reach DC → **Snack Stack** unlocks (snacks generator only).
5. Reach Farmlands at 500 miles, then Chicago at 1,000 → earn the Family SUV,
   open the dealership, and unlock **Pack the Car**.
6. Continue through Desert → Los Angeles → San Francisco for later vehicles and stations.

**Notes:**
- [x] **First "force → open" gate shipped:** Wheel Jam difficulty unlocks — the pattern the rest reuses.
- [ ] **Car = era = radio** — cars theme/unlock a decade's music (starter '90 wagon → '90s, etc.). *(still to confirm; compatible with the above)*
- [ ] **Silent-first rule:** every game fully playable muted.
- [ ] Future games slot into the same pattern (unlock via song / miles / city / vehicle).

---

## 📱 Mobile & distribution

- [x] PWA basics (installable, manifest)
- [ ] Keep code **dependency-light / vanilla** (wrapping stays trivial)
- [ ] Wrap **radio** and **song-loading** as swappable modules (native background
      audio + on-demand song downloads later)
- [ ] **Capacitor** wrapper for App Store / Play Store — *deferred lever* the user
      expects to pull eventually
- [ ] **Bundle-size plan:** ship a starter song set + download the rest on demand
      (34 songs ≈ 140MB is too big to fully bundle)
- [ ] **Monetization (later):** Stripe on web + IAP in app, **accounts as the
      bridge**; don't point to web purchase from inside the app (Netflix model).
      Verify current App Store / Play policy at ship time (rules shifting 2024–25).

---

## ✨ Polish & fixes

- [ ] Confirm the **"music not playing" on phone** was cache/autoplay (hardened it;
      needs a real-device check)
- [ ] **Graphics polish** — Wheel Jam visuals, Window Dash skateboard/motorcycle sprites,
      more/nicer city art
- [x] Holds no longer break your streak on early release (bonus forfeited only)
- [ ] **Hold-length tuning** in Wheel Jam (they currently skew short)
- [ ] **Traffic visibility** tuning in Wheel Jam (haze vs. clarity)
- [ ] **Downloadable MP3s** from the mixtape (optional perk; you own the tracks)
