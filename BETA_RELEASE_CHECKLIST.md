# Road Trip Arcade Beta Release Checklist

## Before Each Beta

- Run `npm test`.
- Run `npm run app:build:android`.
- Run `npm run app:build:ios`.
- Confirm the opening video, Home, Window Dash, Wheel Jam, Snack Stack,
  Plate Parade, Pack the Car, Gas Station, Dealer, and Mixtape all open.
- Confirm a run, a song result, a Snack Stack order, and a settings change
  survive a force quit and relaunch.
- Confirm the Privacy & Data switch disables new PostHog events.

## PostHog

- Verify `app_opened`, `screen_viewed`, `game_started`, `game_completed`,
  progression, economy, and `app_error` events from a physical beta device.
- Exclude internal devices from product reports when possible.
- Keep session replay and broad autocapture disabled.
- Do not send names, email addresses, photos, microphone audio, precise
  location, song filenames from user libraries, or free-form user text.

## Store Privacy

- Apple privacy labels: disclose anonymous product interaction and crash/error
  diagnostics used for analytics and app functionality. Mark the data as not
  used for tracking and not linked to an identity.
- Google Data Safety: disclose anonymous app interaction and diagnostics
  collection. Mark the data as not shared for advertising and allow collection
  to be disabled in Privacy & Data.
- Recheck these answers whenever ads, purchases, accounts, camera access, or a
  new analytics SDK is added.

## Purchases

- Use non-consumable products for permanent unlocks such as cars, routes,
  stations, and ad removal.
- Always provide Restore Purchases. Rebuild permanent entitlements from
  StoreKit or Google Play Billing on launch and after a restore.
- Keep gas and temporary mileage boosts earned or rewarded-ad based for the
  first release. A consumed purchase cannot be reconstructed reliably without
  a server or cloud save.
- Use store sandbox accounts and license testers before enabling production
  products.

## Saves

- The app currently saves locally and mirrors the full save into Capacitor
  Preferences.
- Android Auto Backup is limited to the Capacitor Preferences save file.
- Treat operating-system backup as recovery assistance, not guaranteed
  cross-device synchronization.
- Add iCloud save on iOS and Play Games Saved Games on Android before promising
  reliable device-to-device transfer.
- A shared Road Trip Arcade account/backend is only required if players must
  carry one save between iOS and Android.

## Release Assets

- Finish and review the 70s station.
- Replace temporary introduction videos as credits become available.
- Complete final playtesting on at least one current iPhone and one current
  Android phone.
- Prepare screenshots, descriptions, support URL, privacy policy URL, age
  rating, and review notes for both stores.
