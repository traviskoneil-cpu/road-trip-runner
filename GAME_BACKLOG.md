# Road Trip Arcade Backlog

## Product Analytics Follow-Up

Return to PostHog after the current playtesting/content pass:

- Build a Road Trip Arcade dashboard from intentional custom events instead of
  PostHog's generic autocapture starter dashboard.
- Show active players, games opened/started/completed/failed, repeat play,
  progression drop-off, city and vehicle unlocks, song collection, economy
  activity, and errors by game/platform.
- Add a small anonymous `progress_snapshot` event with total/lifetime miles,
  furthest city, owned-car count, unlocked-game count, collected-song count,
  plate count, and relevant progression version.
- Capture the snapshot at stable milestones such as app launch, city/car/game
  unlocks, and session end. Do not send the full save or fire it every frame.
- Exclude known internal/playtest devices from player-facing reports.
- Keep broad click autocapture and session replay disabled. Decide separately
  whether basic `$pageview` capture is useful for headline traffic metrics.
- Confirm the dashboard can answer: which games people play, where progression
  stalls, what content drives return play, and what should be expanded next.

## Secret Tracks

Keep these as achievement-triggered mixtape additions until their custom songs,
art, and reward presentation are ready.

- Skybound: the runner leaves the top of the screen once.
- No Pavement: chain 5-6 landings on obstacles without touching the road.
- Clean Getaway: clear a long obstacle streak without taking damage.
- Storm Chaser: survive a major lightning storm.

## Major Lightning Storm

This is a future Runner event, not active gameplay yet.

- Each regular rainstorm increases the chance that the next rain event becomes
  a major storm: 1%, 2%, 4%, 8%, then continue doubling subject to a later cap.
- A major storm uses lightning flashes, thunder, heavier rain, and brief
  visibility disruption that makes jumps harder without taking control away.
- Completing the full major storm alive grants the Storm Chaser achievement and
  its secret track.
- Add the song, sound effects, flash treatment, and achievement presentation
  together so the event lands as a real moment rather than a random penalty.

## Store And Guides

- Gas Station: active first pass with a daily free Snack Stack gas can, a
  mileage-priced roadside refill, and a paper map that unlocks the next city.
  Route Pass cards are storefront previews only until real billing is added.
- Roadside supplies should always include one mileage-priced Snack Stack gas
  refill. Rotate the remaining offer slots on a predictable refresh cadence
  across snack, drink, meal, fun, and dog branches. Tiered offers may include
  higher-level merge items, but prices must preserve the value of playing
  Snack Stack rather than skipping its progression.
- Gas Station music rack: add **Roadside Music Credits** as a song-unlock route
  for players who want a larger rotation or are having trouble collecting a
    particular song in Window Dash. One credit redeems one locked **core rotation**
  song from a radio station the player has already unlocked. The credit is
  format-neutral, but its art should match the tuned era/car: 8-track for the
  '70s, cassette for the '80s, CD for the '90s, and an MP3-player/download card
  for the '00s.
  - Redeem credits from the Mixtape, not from a second song browser in the Gas
    Station. A locked core-song card should show its station/era, genre, and
    precomputed `m:ss` runtime while keeping the title, artist, cover, bio, and
    playback hidden until it is collected. This preserves a little discovery
    while still letting the player make an informed choice.
  - Add `durationSeconds`, `catalogType` (`core` or `special`), and
    `purchasable` metadata to each catalog entry. Do not inspect audio duration
    at render time. Existing rotation tracks default to `core` and purchasable;
    secret/achievement tracks must explicitly be `special` and never appear in
    the redemption list.
  - First-pass earning: grant one free credit on the first Gas Station visit,
    one for each newly opened city, and one for each 10 unique U.S. plates.
    Also sell one credit for **200 miles** as a repeatable mileage sink. These
    numbers need playtest tuning alongside route-map and gas-can prices.
  - Redeeming a credit should use the same collected-song entitlement as
    finishing the track in Window Dash, so it immediately joins the Mixtape and
    becomes playable in Wheel Jam. Store the credit balance and a small redemption
    ledger in the shared save so later account sync can distinguish earned,
    mileage-bought, and future paid grants.
  - Do not sell individual songs for real money in the first pass. If paid music
    packs arrive later, run them through the entitlement layer and preserve all
    earned unlock paths.
  - Playtest an alternate presentation in which each station has a small
    rotating selection of specific locked songs. Only show songs for stations
    unlocked by the player's owned cars. Compare this against format-neutral
    credits before choosing one system; do not run both at once.
- Dealership: achievement route to earn cars plus an optional early-unlock path.
- First-time mode guides: Wheel Jam has a Dad dialogue card now; wire in a Wheel Jam
  video when that fourth clip is added to `videos/`.

## Paid Economy Decisions

Keep these as product experiments until the free mileage economy, purchase
restoration, and store compliance paths are validated.

- Decide whether to sell miles at all. Cars, routes, songs, and supplies must
  continue to show their free earning path wherever a paid shortcut appears.
- Candidate mile packs from the current notes: 1,000 miles for $0.99, 3,000 for
  $2.49, 8,000 for $4.99, 20,000 for $9.99, and 50,000 for $19.99. Reprice only
  after measuring real progression speed and likely spend sinks.
- Consider rewarded ads for a time-limited 2x mileage booster and optional
  Snack Stack gas. Cap both daily and never interrupt an active game, song,
  introduction video, or first-time unlock moment.
- Prefer Apple and Google purchase restoration over account creation for the
  first release. Durable non-consumable entitlements can be restored from the
  store account; consumable mile balances still require an entitlement ledger
  or cloud backup if they must survive reinstall/device changes.
