// ============================================================
// Road Trip Arcade — the shared player profile.
// ONE localStorage blob ("rtr_save") that every game reads and writes through.
// Same-origin, so it carries across "/", "/tap/", and future views. Built
// account-ready: the storage is hidden behind this API, so the whole thing can
// graduate to a server-backed profile later without touching the games.
//
// On first load it folds in the old standalone keys (rtr_collected, rtr_best)
// so nobody loses progress, then everything lives here.
// ============================================================
(function (global) {
  const KEY = "rtr_save";
  const NATIVE_BACKUP_KEY = "rtr_save_native_backup";
  const PLAYTEST_BACKUP_KEY = "rtr_playtest_real_save";
  const NATIVE_PLAYTEST_BACKUP_KEY = "rtr_playtest_real_save_native_backup";
  const PLAYTEST_ACTIVE_KEY = "rtr_playtest_active";
  const NAVIGATOR_BOARD_CELLS = 48;
  const NAVIGATOR_DOG_SNACK_OFFSET = 100;
  const NAVIGATOR_DRINK_OFFSET = 200;
  const NAVIGATOR_MEAL_OFFSET = 300;
  const NAVIGATOR_FUN_OFFSET = 400;
  const STARTER_CAR = "minivan";
  const VEHICLES = {
    minivan: { name: "Blue Minivan", station: "90s", milestone: "Starter ride" },
    suv: { name: "Family SUV", station: "00s", milestone: "Reach the Desert" },
    wagon: { name: "Station Wagon", station: "80s", milestone: "Reach Los Angeles" },
    customVan: { name: "Custom Van", station: "70s", milestone: "Reach San Francisco" },
  };
  const DEFAULTS = {
    v: 13,
    difficulties: ["easy"],   // legacy Dad Mode global difficulty unlocks
    driverSongs: {},          // per-song Wheel Jam progress: { "era|file": { difficulties, best } }
    collected: [],            // collected song ids, "era|file"
    mixtape: {                // preferred Road Mix assembled from collected songs
      favorites: [],
      autoplay: true,
    },
    miles: 0,                 // spendable trip currency
    lifetimeMiles: 0,         // earned trip miles, used for automatic unlocks
    runnerBest: 0,            // Window Dash high score, meters
    driverBest: 0,            // Wheel Jam high score, points
    cities: ["nyc"],          // unlocked map areas (the route spine)
    cars: [STARTER_CAR],      // unlocked vehicles
    currentCar: STARTER_CAR,
    navigator: {              // Snack Stack progress (legacy key kept for saves)
      energy: 100,
      lastEnergyAt: 0,
      fedCount: 0,
      snackBagUses: 0,
      mergeCount: 0,
      highestTier: 0,
      highestDogTier: 0,
      highestDrinkTier: 0,
      highestMealTier: 0,
      highestFunTier: 0,
      board: Array(NAVIGATOR_BOARD_CELLS).fill(null),
      inventory: {},
      requests: [],
      generators: ["snackBag"],
      pendingGeneratorNotice: "",
    },
    settings: { station: "90s", homeRadioOn: false }, // radio station
    tutorials: {},           // one-time mode introductions
    gasStation: {            // roadside store progress
      lastDailyFuelDay: "",
      dailyFuelClaims: 0,
      roadsideCanPurchases: 0,
      snackPackPurchases: 0,
      dogTreatPurchases: 0,
      drinkPackPurchases: 0,
    },
    plateBook: {             // real-world license plate collection
      states: [],
      international: [],
      rewards: [],
      memories: [],
    },
    _migrated: {},            // one-time migration flags
  };
  const RANK_ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4 };
  const UNLOCK_RULE = { easy: { next: "medium", need: "C" }, medium: { next: "hard", need: "B" } };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const Save = {
    RANK_ORDER, UNLOCK_RULE, VEHICLES, STARTER_CAR,
    data: clone(DEFAULTS),
    hadLocalSaveOnBoot: false,

    load() {
      let raw = null;
      let rawText = "";
      try {
        rawText = localStorage.getItem(KEY) || "";
        raw = JSON.parse(rawText || "null");
      } catch (e) {}
      this.hadLocalSaveOnBoot = !!rawText;
      if (raw && typeof raw === "object") this.data = Object.assign(clone(DEFAULTS), raw);
      const d = this.data;
      // normalize shape (guards against hand-edited / partial / old blobs)
      if (!Array.isArray(d.difficulties) || !d.difficulties.length) d.difficulties = ["easy"];
      if (!d.driverSongs || typeof d.driverSongs !== "object") d.driverSongs = {};
      if (!Array.isArray(d.collected)) d.collected = [];
      if (!d.mixtape || typeof d.mixtape !== "object" || Array.isArray(d.mixtape)) d.mixtape = clone(DEFAULTS.mixtape);
      if (!Array.isArray(d.mixtape.favorites)) d.mixtape.favorites = [];
      d.mixtape.favorites = Array.from(new Set(d.mixtape.favorites.filter((id) => typeof id === "string" && d.collected.includes(id))));
      if (typeof d.mixtape.autoplay !== "boolean") d.mixtape.autoplay = DEFAULTS.mixtape.autoplay;
      if (!Array.isArray(d.cities) || !d.cities.length) d.cities = ["nyc"];
      if (!Array.isArray(d.cars) || !d.cars.length) d.cars = [STARTER_CAR];
      if (typeof d.miles !== "number" || !Number.isFinite(d.miles)) d.miles = 0;
      d.miles = Math.max(0, Math.floor(d.miles));
      if (typeof d.lifetimeMiles !== "number" || !Number.isFinite(d.lifetimeMiles)) d.lifetimeMiles = d.miles || 0;
      d.lifetimeMiles = Math.max(0, Math.floor(d.lifetimeMiles), Math.floor(d.miles || 0));
      if (typeof d.runnerBest !== "number") d.runnerBest = 0;
      if (typeof d.driverBest !== "number" || !Number.isFinite(d.driverBest)) d.driverBest = 0;
      d.runnerBest = Math.max(0, Math.floor(d.runnerBest));
      d.driverBest = Math.max(0, Math.floor(d.driverBest));
      if (!d.currentCar) d.currentCar = d.cars[0];
      if (!d.navigator || typeof d.navigator !== "object") d.navigator = clone(DEFAULTS.navigator);
      const nav = d.navigator;
      if (typeof nav.energy !== "number" || !Number.isFinite(nav.energy)) nav.energy = DEFAULTS.navigator.energy;
      nav.energy = Math.max(0, Math.floor(nav.energy));
      if (typeof nav.lastEnergyAt !== "number" || !Number.isFinite(nav.lastEnergyAt) || nav.lastEnergyAt <= 0) nav.lastEnergyAt = Date.now();
      if (typeof nav.fedCount !== "number" || !Number.isFinite(nav.fedCount)) nav.fedCount = 0;
      if (typeof nav.snackBagUses !== "number" || !Number.isFinite(nav.snackBagUses)) nav.snackBagUses = 0;
      if (typeof nav.mergeCount !== "number" || !Number.isFinite(nav.mergeCount)) nav.mergeCount = 0;
      if (typeof nav.highestTier !== "number" || !Number.isFinite(nav.highestTier)) nav.highestTier = 0;
      if (typeof nav.highestDogTier !== "number" || !Number.isFinite(nav.highestDogTier)) nav.highestDogTier = 0;
      if (typeof nav.highestDrinkTier !== "number" || !Number.isFinite(nav.highestDrinkTier)) nav.highestDrinkTier = 0;
      if (typeof nav.highestMealTier !== "number" || !Number.isFinite(nav.highestMealTier)) nav.highestMealTier = 0;
      if (typeof nav.highestFunTier !== "number" || !Number.isFinite(nav.highestFunTier)) nav.highestFunTier = 0;
      nav.fedCount = Math.max(0, Math.floor(nav.fedCount));
      nav.snackBagUses = Math.max(0, Math.floor(nav.snackBagUses));
      nav.mergeCount = Math.max(0, Math.floor(nav.mergeCount));
      nav.highestTier = Math.max(0, Math.floor(nav.highestTier));
      nav.highestDogTier = Math.max(0, Math.floor(nav.highestDogTier));
      nav.highestDrinkTier = Math.max(0, Math.floor(nav.highestDrinkTier));
      nav.highestMealTier = Math.max(0, Math.floor(nav.highestMealTier));
      nav.highestFunTier = Math.max(0, Math.floor(nav.highestFunTier));
      if (!Array.isArray(nav.board)) nav.board = [];
      nav.board = nav.board.slice(0, NAVIGATOR_BOARD_CELLS).map((cell) => {
        if (cell === null || cell === undefined || cell === "") return null;
        const tier = typeof cell === "object"
          ? (cell.branch === "fun"
            ? NAVIGATOR_FUN_OFFSET + Number(cell.tier ?? 0)
            : (cell.branch === "meal"
              ? NAVIGATOR_MEAL_OFFSET + Number(cell.tier ?? 0)
              : (cell.branch === "drink"
                ? NAVIGATOR_DRINK_OFFSET + Number(cell.tier ?? 0)
                : (cell.branch === "dog"
                  ? NAVIGATOR_DOG_SNACK_OFFSET + Number(cell.tier ?? 0)
                  : Number(cell.value ?? cell.tier)))))
          : Number(cell);
        if (!Number.isFinite(tier) || tier < 0) return null;
        return Math.floor(tier);
      });
      while (nav.board.length < NAVIGATOR_BOARD_CELLS) nav.board.push(null);
      nav.board.forEach((cell) => {
        if (cell === null) return;
        if (cell >= NAVIGATOR_FUN_OFFSET) nav.highestFunTier = Math.max(nav.highestFunTier, cell - NAVIGATOR_FUN_OFFSET);
        else if (cell >= NAVIGATOR_MEAL_OFFSET) nav.highestMealTier = Math.max(nav.highestMealTier, cell - NAVIGATOR_MEAL_OFFSET);
        else if (cell >= NAVIGATOR_DRINK_OFFSET) nav.highestDrinkTier = Math.max(nav.highestDrinkTier, cell - NAVIGATOR_DRINK_OFFSET);
        else if (cell >= NAVIGATOR_DOG_SNACK_OFFSET) nav.highestDogTier = Math.max(nav.highestDogTier, cell - NAVIGATOR_DOG_SNACK_OFFSET);
        else nav.highestTier = Math.max(nav.highestTier, cell);
      });
      if (!nav.inventory || typeof nav.inventory !== "object" || Array.isArray(nav.inventory)) nav.inventory = {};
      Object.keys(nav.inventory).forEach((key) => {
        const count = Math.max(0, Math.floor(Number(nav.inventory[key]) || 0));
        if (count > 0) nav.inventory[key] = count;
        else delete nav.inventory[key];
      });
      if (!Array.isArray(nav.requests)) nav.requests = [];
      if (!Array.isArray(nav.generators) || !nav.generators.length) nav.generators = ["snackBag"];
      if (!nav.generators.includes("snackBag")) nav.generators.unshift("snackBag");
      if (typeof nav.pendingGeneratorNotice !== "string") nav.pendingGeneratorNotice = "";
      if (!d.settings || typeof d.settings !== "object") d.settings = clone(DEFAULTS.settings);
      if ("syncMs" in d.settings) delete d.settings.syncMs;
      if (!d.settings.station) d.settings.station = DEFAULTS.settings.station;
      if (typeof d.settings.homeRadioOn !== "boolean") d.settings.homeRadioOn = DEFAULTS.settings.homeRadioOn;
      if (!d.tutorials || typeof d.tutorials !== "object" || Array.isArray(d.tutorials)) d.tutorials = {};
      if (!d.gasStation || typeof d.gasStation !== "object" || Array.isArray(d.gasStation)) d.gasStation = clone(DEFAULTS.gasStation);
      if (typeof d.gasStation.lastDailyFuelDay !== "string") d.gasStation.lastDailyFuelDay = "";
      if (typeof d.gasStation.dailyFuelClaims !== "number" || !Number.isFinite(d.gasStation.dailyFuelClaims)) d.gasStation.dailyFuelClaims = 0;
      if (typeof d.gasStation.roadsideCanPurchases !== "number" || !Number.isFinite(d.gasStation.roadsideCanPurchases)) d.gasStation.roadsideCanPurchases = 0;
      if (typeof d.gasStation.snackPackPurchases !== "number" || !Number.isFinite(d.gasStation.snackPackPurchases)) d.gasStation.snackPackPurchases = 0;
      if (typeof d.gasStation.dogTreatPurchases !== "number" || !Number.isFinite(d.gasStation.dogTreatPurchases)) d.gasStation.dogTreatPurchases = 0;
      if (typeof d.gasStation.drinkPackPurchases !== "number" || !Number.isFinite(d.gasStation.drinkPackPurchases)) d.gasStation.drinkPackPurchases = 0;
      d.gasStation.dailyFuelClaims = Math.max(0, Math.floor(d.gasStation.dailyFuelClaims));
      d.gasStation.roadsideCanPurchases = Math.max(0, Math.floor(d.gasStation.roadsideCanPurchases));
      d.gasStation.snackPackPurchases = Math.max(0, Math.floor(d.gasStation.snackPackPurchases));
      d.gasStation.dogTreatPurchases = Math.max(0, Math.floor(d.gasStation.dogTreatPurchases));
      d.gasStation.drinkPackPurchases = Math.max(0, Math.floor(d.gasStation.drinkPackPurchases));
      if (!d.plateBook || typeof d.plateBook !== "object" || Array.isArray(d.plateBook)) d.plateBook = clone(DEFAULTS.plateBook);
      d.plateBook.states = Array.from(new Set((Array.isArray(d.plateBook.states) ? d.plateBook.states : [])
        .filter((state) => typeof state === "string" && state.length <= 3)));
      d.plateBook.international = Array.from(new Set((Array.isArray(d.plateBook.international) ? d.plateBook.international : [])
        .filter((plate) => typeof plate === "string" && plate.length <= 24)));
      d.plateBook.rewards = Array.from(new Set((Array.isArray(d.plateBook.rewards) ? d.plateBook.rewards : [])
        .filter((reward) => typeof reward === "string" && reward.length <= 64)));
      d.plateBook.memories = (Array.isArray(d.plateBook.memories) ? d.plateBook.memories : [])
        .filter((memory) => memory && typeof memory === "object" && typeof memory.id === "string")
        .slice(-36)
        .map((memory) => ({
          id: memory.id.slice(0, 96),
          title: typeof memory.title === "string" ? memory.title.slice(0, 96) : "Roadside memory",
          copy: typeof memory.copy === "string" ? memory.copy.slice(0, 280) : "",
          stamp: typeof memory.stamp === "string" ? memory.stamp.slice(0, 56) : "Road trip",
          state: typeof memory.state === "string" ? memory.state.slice(0, 24) : "",
          photo: typeof memory.photo === "string" && memory.photo.startsWith("data:image/") && memory.photo.length <= 380000
            ? memory.photo
            : "",
          createdAt: Number.isFinite(memory.createdAt) ? Math.max(0, Math.floor(memory.createdAt)) : 0,
        }));
      if (!d._migrated || typeof d._migrated !== "object") d._migrated = {};
      this._migrateStarterCar();
      d.cars = Array.from(new Set(d.cars.filter((car) => VEHICLES[car])));
      if (!d.cars.length) d.cars = [STARTER_CAR];
      if (!d.cars.includes(STARTER_CAR)) d.cars.unshift(STARTER_CAR);
      if (!d.currentCar || !d.cars.includes(d.currentCar)) d.currentCar = d.cars[0];
      if (!this.isStationUnlocked(d.settings.station)) d.settings.station = DEFAULTS.settings.station;
      this._migrateOldKeys();
      d.v = DEFAULTS.v;
      this.persist({ skipNative: !this.hadLocalSaveOnBoot });
      return this;
    },

    _migrateStarterCar() {
      const d = this.data;
      if (d._migrated.minivanStarter) return;
      d.cars = d.cars.map((car) => car === "wagon" ? STARTER_CAR : car);
      if (d.currentCar === "wagon") d.currentCar = STARTER_CAR;
      d._migrated.minivanStarter = true;
    },

    // Fold the pre-unified standalone keys in once each. We read them but never
    // write them again — from here on everything flows through rtr_save.
    _migrateOldKeys() {
      const d = this.data;
      if (!d._migrated.collected) {
        try {
          const oc = JSON.parse(localStorage.getItem("rtr_collected") || "[]");
          if (Array.isArray(oc)) for (const k of oc) if (!d.collected.includes(k)) d.collected.push(k);
        } catch (e) {}
        d._migrated.collected = true;
      }
      if (!d._migrated.best) {
        const ob = Number(localStorage.getItem("rtr_best") || 0);
        if (ob > d.runnerBest) d.runnerBest = ob;
        d._migrated.best = true;
      }
    },

    persist(options) {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
      if (options && options.skipNative) return;
      this.backupNative();
    },

    nativePreferences() {
      return global.Capacitor
        && global.Capacitor.Plugins
        && global.Capacitor.Plugins.Preferences;
    },
    backupNative() {
      const prefs = this.nativePreferences();
      if (!prefs || typeof prefs.set !== "function") return;
      try {
        prefs.set({ key: NATIVE_BACKUP_KEY, value: JSON.stringify(this.data) });
      } catch (e) {}
    },
    restoreNativeBackup() {
      const prefs = this.nativePreferences();
      if (!prefs || typeof prefs.get !== "function") return;
      if (this.hadLocalSaveOnBoot) return;
      prefs.get({ key: NATIVE_BACKUP_KEY }).then((result) => {
        if (!result || !result.value) return;
        try {
          const restored = JSON.parse(result.value);
          if (!restored || typeof restored !== "object") return;
          localStorage.setItem(KEY, result.value);
          this.load();
          global.dispatchEvent?.(new CustomEvent("rtr-save-restored"));
        } catch (e) {}
      }).catch(() => {});
    },

    freshData() { return clone(DEFAULTS); },
    isPlaytest() {
      try { return localStorage.getItem(PLAYTEST_ACTIVE_KEY) === "1"; }
      catch (e) { return false; }
    },
    _notifyProfileChanged() {
      global.dispatchEvent?.(new CustomEvent("rtr-save-restored"));
    },
    _savePlaytestBackup() {
      const value = JSON.stringify(this.data);
      try { localStorage.setItem(PLAYTEST_BACKUP_KEY, value); } catch (e) {}
      const prefs = this.nativePreferences();
      if (prefs && typeof prefs.set === "function") {
        try { prefs.set({ key: NATIVE_PLAYTEST_BACKUP_KEY, value }); } catch (e) {}
      }
    },
    applyPlaytest(data) {
      if (!data || typeof data !== "object") return false;
      if (!this.isPlaytest()) this._savePlaytestBackup();
      try { localStorage.setItem(PLAYTEST_ACTIVE_KEY, "1"); } catch (e) {}
      this.data = clone(data);
      this.persist();
      this._notifyProfileChanged();
      return true;
    },
    restoreRealProfile() {
      const restore = (raw) => {
        try {
          const data = JSON.parse(raw || "null");
          if (!data || typeof data !== "object") return false;
          this.data = Object.assign(clone(DEFAULTS), data);
          try {
            localStorage.removeItem(PLAYTEST_BACKUP_KEY);
            localStorage.removeItem(PLAYTEST_ACTIVE_KEY);
          } catch (e) {}
          this.persist();
          this._notifyProfileChanged();
          return true;
        } catch (e) { return false; }
      };
      let localBackup = "";
      try { localBackup = localStorage.getItem(PLAYTEST_BACKUP_KEY) || ""; } catch (e) {}
      if (localBackup) return restore(localBackup);
      const prefs = this.nativePreferences();
      if (prefs && typeof prefs.get === "function") {
        prefs.get({ key: NATIVE_PLAYTEST_BACKUP_KEY }).then((result) => {
          if (result && result.value) restore(result.value);
        }).catch(() => {});
      }
      return false;
    },

    // ---- vehicles / radio stations ----
    vehicleName(id) { return (VEHICLES[id] && VEHICLES[id].name) || id; },
    vehicleUnlockHint(id) { return (VEHICLES[id] && VEHICLES[id].milestone) || "A future road trip"; },
    hasCar(id) { return !!VEHICLES[id] && this.data.cars.includes(id); },
    unlockCar(id) {
      if (!VEHICLES[id]) return false;
      if (this.data.cars.includes(id)) return false;
      this.data.cars.push(id);
      this.persist();
      return true;
    },
    setCurrentCar(id) {
      if (!this.hasCar(id)) return false;
      this.data.currentCar = id;
      this.persist();
      return true;
    },
    vehicleForStation(era) {
      return Object.keys(VEHICLES).find((id) => VEHICLES[id].station === era) || null;
    },
    unlockedStationEras() {
      const eras = (this.data.cars || []).map((car) => VEHICLES[car] && VEHICLES[car].station).filter(Boolean);
      return new Set(eras.length ? eras : [VEHICLES[STARTER_CAR].station]);
    },
    isStationUnlocked(era) {
      if (era === "off") return true;
      return this.unlockedStationEras().has(era);
    },
    firstUnlockedStation() {
      return ["90s", "00s", "80s", "70s"].find((era) => this.isStationUnlocked(era)) || VEHICLES[STARTER_CAR].station;
    },

    // ---- Dad Mode difficulty ----
    has(diff) { return this.data.difficulties.includes(diff); },
    highest() { return ["hard", "medium", "easy"].find((x) => this.has(x)) || "easy"; },
    // record a result; returns the newly-unlocked difficulty name, or null
    recordResult(diff, rank) {
      const rule = UNLOCK_RULE[diff];
      let unlocked = null;
      if (rule && !this.has(rule.next) && RANK_ORDER[rank] >= RANK_ORDER[rule.need]) {
        this.data.difficulties.push(rule.next); unlocked = rule.next;
      }
      this.persist();
      return unlocked;
    },
    _driverSong(id) {
      if (!id) id = "_unknown";
      const songs = this.data.driverSongs || (this.data.driverSongs = {});
      let row = songs[id];
      if (!row || typeof row !== "object") row = songs[id] = {};
      if (!Array.isArray(row.difficulties) || !row.difficulties.length) row.difficulties = ["easy"];
      if (!row.difficulties.includes("easy")) row.difficulties.unshift("easy");
      if (!row.best || typeof row.best !== "object") row.best = {};
      if (!row.scores || typeof row.scores !== "object") row.scores = {};
      Object.keys(row.scores).forEach((diff) => {
        const score = Number(row.scores[diff]);
        if (Number.isFinite(score) && score > 0) row.scores[diff] = Math.floor(score);
        else delete row.scores[diff];
      });
      return row;
    },
    songDiffs(id) { return this._driverSong(id).difficulties.slice(); },
    hasSongDiff(id, diff) { return this._driverSong(id).difficulties.includes(diff); },
    highestSongDiff(id) {
      const row = this._driverSong(id);
      return ["hard", "medium", "easy"].find((x) => row.difficulties.includes(x)) || "easy";
    },
    songBest(id, diff) { return this._driverSong(id).best[diff] || null; },
    songHighScore(id, diff) { return this._driverSong(id).scores[diff] || 0; },
    // Record a per-song Wheel Jam result; returns the newly-unlocked difficulty name, or null.
    recordSongResult(id, diff, rank, score) {
      const row = this._driverSong(id);
      const prev = row.best[diff];
      if (!prev || RANK_ORDER[rank] > RANK_ORDER[prev]) row.best[diff] = rank;
      const points = Math.max(0, Math.floor(Number(score) || 0));
      if (points > (row.scores[diff] || 0)) row.scores[diff] = points;
      if (points > (this.data.driverBest || 0)) this.data.driverBest = points;
      const rule = UNLOCK_RULE[diff];
      let unlocked = null;
      if (rule && !row.difficulties.includes(rule.next) && RANK_ORDER[rank] >= RANK_ORDER[rule.need]) {
        row.difficulties.push(rule.next); unlocked = rule.next;
      }
      this.persist();
      return unlocked;
    },

    // ---- collected songs (mixtape) ----
    isCollected(id) { return this.data.collected.includes(id); },
    collect(id) {
      if (!id || this.data.collected.includes(id)) return false;
      this.data.collected.push(id); this.persist(); return true;
    },
    collectedSet() { return new Set(this.data.collected); },
    favoriteSongs() { return this.data.mixtape.favorites.slice(); },
    favoriteSongSet() { return new Set(this.data.mixtape.favorites); },
    isFavoriteSong(id) { return this.data.mixtape.favorites.includes(id); },
    setFavoriteSong(id, favorite) {
      if (!id || !this.isCollected(id)) return false;
      const favorites = this.data.mixtape.favorites;
      const index = favorites.indexOf(id);
      if (favorite && index === -1) favorites.push(id);
      else if (!favorite && index >= 0) favorites.splice(index, 1);
      else return false;
      this.persist();
      return true;
    },
    mixtapeAutoplay() { return this.data.mixtape.autoplay !== false; },
    setMixtapeAutoplay(on) {
      this.data.mixtape.autoplay = Boolean(on);
      this.persist();
    },

    // ---- real-world license plates / family scrapbook ----
    plateBook() {
      if (!this.data.plateBook || typeof this.data.plateBook !== "object") this.data.plateBook = clone(DEFAULTS.plateBook);
      return this.data.plateBook;
    },
    hasPlate(state) { return this.plateBook().states.includes(state); },
    addPlate(state) {
      const book = this.plateBook();
      if (!state || book.states.includes(state)) return false;
      book.states.push(state);
      this.persist();
      return true;
    },
    hasInternationalPlate(plate) { return this.plateBook().international.includes(plate); },
    addInternationalPlate(plate) {
      const book = this.plateBook();
      if (!plate || book.international.includes(plate)) return false;
      book.international.push(plate);
      this.persist();
      return true;
    },
    hasPlateReward(id) { return this.plateBook().rewards.includes(id); },
    addPlateReward(id) {
      const book = this.plateBook();
      if (!id || book.rewards.includes(id)) return false;
      book.rewards.push(id);
      this.persist();
      return true;
    },
    addPlateMemory(memory) {
      if (!memory || !memory.id) return false;
      const book = this.plateBook();
      if (!Array.isArray(book.memories)) book.memories = [];
      const index = book.memories.findIndex((item) => item && item.id === memory.id);
      const next = {
        id: String(memory.id).slice(0, 96),
        title: String(memory.title || "Roadside memory").slice(0, 96),
        copy: String(memory.copy || "").slice(0, 280),
        stamp: String(memory.stamp || "Road trip").slice(0, 56),
        state: String(memory.state || "").slice(0, 24),
        photo: typeof memory.photo === "string" && memory.photo.startsWith("data:image/") && memory.photo.length <= 380000
          ? memory.photo
          : "",
        createdAt: Number.isFinite(memory.createdAt) ? Math.max(0, Math.floor(memory.createdAt)) : Date.now(),
      };
      if (index >= 0) book.memories[index] = next;
      else book.memories = book.memories.concat(next).slice(-36);
      this.persist();
      return true;
    },

    // ---- first-time introductions ----
    hasTutorialSeen(id) { return !!(id && this.data.tutorials && this.data.tutorials[id]); },
    markTutorialSeen(id) {
      if (!id) return;
      if (!this.data.tutorials || typeof this.data.tutorials !== "object") this.data.tutorials = {};
      this.data.tutorials[id] = true;
      this.persist();
    },

    // ---- miles (currency) ----
    get miles() { return this.data.miles || 0; },
    get lifetimeMiles() { return Math.max(this.data.lifetimeMiles || 0, this.data.miles || 0); },
    addMiles(n) {
      const amount = Math.max(0, n | 0);
      const beforeLifetime = Math.max(this.data.lifetimeMiles || 0, this.data.miles || 0);
      this.data.miles = Math.max(0, (this.data.miles || 0) + amount);
      this.data.lifetimeMiles = Math.max(beforeLifetime + amount, this.data.miles || 0);
      this.persist();
      return this.data.miles;
    },
    spendMiles(n) {
      n = n | 0;
      if ((this.data.miles || 0) < n) return false;
      this.data.miles -= n; this.persist(); return true;
    },

    // ---- runner best ----
    get runnerBest() { return this.data.runnerBest || 0; },
    setRunnerBest(n) {
      n = Math.floor(n);
      if (n > (this.data.runnerBest || 0)) { this.data.runnerBest = n; this.persist(); return true; }
      return false;
    },

    // ---- driver best ----
    get driverBest() { return this.data.driverBest || 0; },
    setDriverBest(n) {
      n = Math.floor(Number(n) || 0);
      if (n > (this.data.driverBest || 0)) { this.data.driverBest = n; this.persist(); return true; }
      return false;
    },
  };

  Save.load();
  global.Save = Save;
  Save.restoreNativeBackup();
})(window);
