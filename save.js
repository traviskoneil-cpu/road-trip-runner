// ============================================================
// Road Trip Runner — the shared player profile.
// ONE localStorage blob ("rtr_save") that every game reads and writes through.
// Same-origin, so it carries across "/", "/tap/", and future views. Built
// account-ready: the storage is hidden behind this API, so the whole thing can
// graduate to a server-backed profile later without touching the games.
//
// On first load it folds in the old standalone keys (rtr_collected, rtr_best,
// tap_sync) so nobody loses progress, then everything lives here.
// ============================================================
(function (global) {
  const KEY = "rtr_save";
  const DEFAULTS = {
    v: 2,
    difficulties: ["easy"],   // Dad Mode difficulty unlocks
    collected: [],            // collected song ids, "era|file"
    miles: 0,                 // the one currency (earning wired up in a later step)
    runnerBest: 0,            // Runner high score, meters
    cities: ["nyc"],          // unlocked map areas (the route spine)
    cars: ["wagon"],          // unlocked vehicles
    currentCar: "wagon",
    settings: { syncMs: 0 },  // Dad Mode manual audio calibration
    _migrated: {},            // one-time migration flags
  };
  const RANK_ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4 };
  const UNLOCK_RULE = { easy: { next: "medium", need: "C" }, medium: { next: "hard", need: "B" } };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const Save = {
    RANK_ORDER, UNLOCK_RULE,
    data: clone(DEFAULTS),

    load() {
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
      if (raw && typeof raw === "object") this.data = Object.assign(clone(DEFAULTS), raw);
      const d = this.data;
      // normalize shape (guards against hand-edited / partial / old blobs)
      if (!Array.isArray(d.difficulties) || !d.difficulties.length) d.difficulties = ["easy"];
      if (!Array.isArray(d.collected)) d.collected = [];
      if (!Array.isArray(d.cities) || !d.cities.length) d.cities = ["nyc"];
      if (!Array.isArray(d.cars) || !d.cars.length) d.cars = ["wagon"];
      if (typeof d.miles !== "number") d.miles = 0;
      if (typeof d.runnerBest !== "number") d.runnerBest = 0;
      if (!d.currentCar) d.currentCar = d.cars[0];
      if (!d.settings || typeof d.settings !== "object") d.settings = { syncMs: 0 };
      if (!d._migrated || typeof d._migrated !== "object") d._migrated = {};
      this._migrateOldKeys();
      d.v = DEFAULTS.v;
      this.persist();
      return this;
    },

    // Fold the pre-unified standalone keys in once each. We read them but never
    // write them again — from here on everything flows through rtr_save.
    _migrateOldKeys() {
      const d = this.data;
      if (!d._migrated.sync) {
        const oldSync = localStorage.getItem("tap_sync");
        if (oldSync != null) d.settings.syncMs = +oldSync || 0;
        d._migrated.sync = true;
      }
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

    persist() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },

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

    // ---- settings ----
    get syncMs() { return this.data.settings.syncMs || 0; },
    setSync(ms) { this.data.settings.syncMs = ms; this.persist(); },

    // ---- collected songs (mixtape) ----
    isCollected(id) { return this.data.collected.includes(id); },
    collect(id) {
      if (!id || this.data.collected.includes(id)) return false;
      this.data.collected.push(id); this.persist(); return true;
    },
    collectedSet() { return new Set(this.data.collected); },

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
})(window);
