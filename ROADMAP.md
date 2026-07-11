# Road Trip Runner — Roadmap

The umbrella vision: a **collection of road-trip mini-games**, unified by the car
+ the radio, tied together by a Miles economy that unlocks songs, games, cities,
and cars. Web-first, but built to become a mobile app later. See the design
notes throughout for the "why."

---

## ✅ Done so far

- [x] **Road Trip Runner** endless runner (`/`) — 6 cross-country cities, car-window
      framing, rain, rides (skateboard/motorcycle), difficulty pacing.
- [x] Real generated **hand sprite** runner with code-animated legs.
- [x] **Fake-radio universe** — 4 decade stations with DJ personas.
- [x] **'90s station (The Dirt / Meg):** 17 songs, 15 bands, bios, and Meg **fully
      voiced** (76 clips: IDs, ads, intros/outros, rain, cities, unlocks).
- [x] **'00s station (The Blender):** 17 songs, bands, bios, genres. Script written.
- [x] **My Mixtape** — collect songs by finishing them; real embedded album art.
- [x] **Tap Trip** rhythm game (`/tap/`) — beat-detection charts, holds + chords,
      "Dad Mode" windshield/traffic, sync calibration, touch-forgiving windows,
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
- [ ] **Jamie & The Toad ('00s)** — script ready. Record Jamie's ~40 lines +
      the **14-clip Toad blurt library** (record each voice separately; game
      auto-stitches a Toad blurt after Jamie's intro). See `radio/DJ_SCRIPT.md`.
- [ ] Velvet Vince ('70s) — persona written; needs songs first
- [ ] Hurricane Hammers ('80s) — persona written; needs songs first

**Radio features already built, waiting on clips:** Text Me Back "chart battle,"
per-city / unlock / rain event lines, station IDs + fake ads.

---

## 🎮 Mini-games (the collection)

Each game = a "seat" in the car. Build order = fastest-to-fun first.

- [x] **Windshield / driver → Tap Trip** (rhythm / Dad Mode)
- [x] **Side window / kid → the Runner** (finger game)
- [ ] **Passenger → Bingo / Punch-Buggy** — spot a landmark in the scenery
      before the computer. *Reuses existing scenery art; silent-friendly.*
      **(recommended next build)**
- [ ] **Trunk / pre-trip → Packing Tetris** — fit the cooler (square), hockey
      stick (L), duffel, etc. Build as real Tetris, not match-3.
- [ ] **Back seat → Merge game** — Mom hands snacks/books/toys back to keep the
      kids happy; merge to unlock. Sticky/idle layer.
- [ ] ~~Match-3~~ — decided to skip / fold into Packing (weakest theme fit).

---

## 🏗️ Architecture & progression system

**Foundations to build:**
- [~] **Shared save/profile** — *started.* `Save` module writing `localStorage.rtr_save`
      (`{ v, difficulties, settings }`) lives in Tap Trip and migrated the old sync
      key. Still to fold in: `miles`, `unlockedCities/Games/Cars`, `currentCar`,
      and the mixtape `collectedSongs` (currently the separate `rtr_collected` key).
      Built abstract + **account-ready** (can graduate to a server later).
- [ ] **SPA shell** (single-page, view-swapping) — NOT iframes, so it's portable
      to PWA + Capacitor. Owns the persistent radio + the unlock UI. Move the
      `Save` module to a shared file at this point.
- [ ] **Entitlement layer** — a `hasUnlock(item)` check that doesn't care whether
      the grant came from gameplay, Stripe, or app-store IAP.

**Economy design:**
- [x] **First "force → open" gate shipped:** Tap Trip difficulty unlocks — start on
      Easy only; a C on Easy unlocks Medium, a B on Medium unlocks Hard. This is
      the pattern the whole economy will use.
- [ ] **Miles** = one currency, earned by playing any game; drives progress.
- [ ] **Unlock web:** Cities (miles-gated, the spine) · Games (unlocked by reaching
      cities) · Cars (spent miles) · Songs (collected by playing; availability
      gated by unlocked era).
- [ ] **Car = era = radio** decision — cars unlock/theme a decade's music (starter
      '90 wagon → '90s; '70s van → '70s; etc.). *(confirm this model)*
- [ ] **"Force → open" funnel (whole game):** start locked to 1 car / 1 game / 1
      city / '90s; first miles auto-unlock the next city + Tap Trip; then branches.
- [ ] **Silent-first rule:** every game fully playable muted; audio is seasoning.
- [ ] Decide how **Dad Mode / each game unlocks** into the flow.

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
- [ ] **Graphics polish** — Tap Trip visuals, runner skateboard/motorcycle sprites,
      more/nicer city art
- [x] Holds no longer break your streak on early release (bonus forfeited only)
- [ ] **Hold-length tuning** in Tap Trip (they currently skew short)
- [ ] **Traffic visibility** tuning in Dad Mode (haze vs. clarity)
- [ ] **Downloadable MP3s** from the mixtape (optional perk; you own the tracks)
