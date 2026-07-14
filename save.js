// ============================================================
// Road Trip Runner — the shared player profile.
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
  const STARTER_CAR = "minivan";
  const VEHICLES = {
    minivan: { name: "Blue Minivan", station: "90s" },
    suv: { name: "Family SUV", station: "00s" },
    wagon: { name: "Station Wagon", station: "80s" },
    customVan: { name: "Custom Van", station: "70s" },
  };
  const DEFAULTS = {
    v: 8,
    difficulties: ["easy"],   // legacy Dad Mode global difficulty unlocks
    driverSongs: {},          // per-song Driver progress: { "era|file": { difficulties, best } }
    collected: [],            // collected song ids, "era|file"
    miles: 0,                 // the one currency (earning wired up in a later step)
    runnerBest: 0,            // Runner high score, meters
    cities: ["nyc"],          // unlocked map areas (the route spine)
    cars: [STARTER_CAR],      // unlocked vehicles
    currentCar: STARTER_CAR,
    navigator: {              // back-seat Navigator mode
      energy: 100,
      lastEnergyAt: 0,
      fedCount: 0,
      snackBagUses: 0,
      mergeCount: 0,
      highestTier: 0,
      highestDogTier: 0,
      board: Array(NAVIGATOR_BOARD_CELLS).fill(null),
      inventory: {},
      requests: [],
      generators: ["snackBag"],
    },
    settings: { station: "90s" }, // radio station
    tutorials: {},           // one-time mode introductions
    gasStation: {            // roadside store progress
      lastDailyFuelDay: "",
      dailyFuelClaims: 0,
      roadsideCanPurchases: 0,
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
      if (!Array.isArray(d.cities) || !d.cities.length) d.cities = ["nyc"];
      if (!Array.isArray(d.cars) || !d.cars.length) d.cars = [STARTER_CAR];
      if (typeof d.miles !== "number") d.miles = 0;
      if (typeof d.runnerBest !== "number") d.runnerBest = 0;
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
      nav.fedCount = Math.max(0, Math.floor(nav.fedCount));
      nav.snackBagUses = Math.max(0, Math.floor(nav.snackBagUses));
      nav.mergeCount = Math.max(0, Math.floor(nav.mergeCount));
      nav.highestTier = Math.max(0, Math.floor(nav.highestTier));
      nav.highestDogTier = Math.max(0, Math.floor(nav.highestDogTier));
      if (!Array.isArray(nav.board)) nav.board = [];
      nav.board = nav.board.slice(0, NAVIGATOR_BOARD_CELLS).map((cell) => {
        if (cell === null || cell === undefined || cell === "") return null;
        const tier = typeof cell === "object" && cell.branch === "dog"
          ? NAVIGATOR_DOG_SNACK_OFFSET + Number(cell.tier ?? 0)
          : Number(typeof cell === "object" ? cell.value ?? cell.tier : cell);
        if (!Number.isFinite(tier) || tier < 0) return null;
        return Math.floor(tier);
      });
      while (nav.board.length < NAVIGATOR_BOARD_CELLS) nav.board.push(null);
      nav.board.forEach((cell) => {
        if (cell === null) return;
        if (cell >= NAVIGATOR_DOG_SNACK_OFFSET) nav.highestDogTier = Math.max(nav.highestDogTier, cell - NAVIGATOR_DOG_SNACK_OFFSET);
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
      if (!d.settings || typeof d.settings !== "object") d.settings = clone(DEFAULTS.settings);
      if ("syncMs" in d.settings) delete d.settings.syncMs;
      if (!d.settings.station) d.settings.station = DEFAULTS.settings.station;
      if (!d.tutorials || typeof d.tutorials !== "object" || Array.isArray(d.tutorials)) d.tutorials = {};
      if (!d.gasStation || typeof d.gasStation !== "object" || Array.isArray(d.gasStation)) d.gasStation = clone(DEFAULTS.gasStation);
      if (typeof d.gasStation.lastDailyFuelDay !== "string") d.gasStation.lastDailyFuelDay = "";
      if (typeof d.gasStation.dailyFuelClaims !== "number" || !Number.isFinite(d.gasStation.dailyFuelClaims)) d.gasStation.dailyFuelClaims = 0;
      if (typeof d.gasStation.roadsideCanPurchases !== "number" || !Number.isFinite(d.gasStation.roadsideCanPurchases)) d.gasStation.roadsideCanPurchases = 0;
      d.gasStation.dailyFuelClaims = Math.max(0, Math.floor(d.gasStation.dailyFuelClaims));
      d.gasStation.roadsideCanPurchases = Math.max(0, Math.floor(d.gasStation.roadsideCanPurchases));
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
      return row;
    },
    songDiffs(id) { return this._driverSong(id).difficulties.slice(); },
    hasSongDiff(id, diff) { return this._driverSong(id).difficulties.includes(diff); },
    highestSongDiff(id) {
      const row = this._driverSong(id);
      return ["hard", "medium", "easy"].find((x) => row.difficulties.includes(x)) || "easy";
    },
    songBest(id, diff) { return this._driverSong(id).best[diff] || null; },
    // record a per-song Driver result; returns the newly-unlocked difficulty name, or null
    recordSongResult(id, diff, rank) {
      const row = this._driverSong(id);
      const prev = row.best[diff];
      if (!prev || RANK_ORDER[rank] > RANK_ORDER[prev]) row.best[diff] = rank;
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
    addMiles(n) { this.data.miles = Math.max(0, (this.data.miles || 0) + (n | 0)); this.persist(); return this.data.miles; },
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
  };

  Save.load();
  global.Save = Save;
  Save.restoreNativeBackup();
})(window);
