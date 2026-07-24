const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "save.js"), "utf8");

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); },
  };
}

function loadSave(initial, capacitor) {
  const localStorage = makeStorage(initial);
  const window = {
    localStorage,
    Capacitor: capacitor,
    CustomEvent: function CustomEvent(type) { this.type = type; },
    dispatchEvent() {},
    setTimeout,
    clearTimeout,
  };
  window.window = window;
  const context = vm.createContext({
    window,
    localStorage,
    CustomEvent: window.CustomEvent,
    console,
    Date,
    JSON,
    Math,
    Promise,
    Set,
  });
  vm.runInContext(source, context, { filename: "save.js" });
  return { Save: window.Save, storage: localStorage };
}

async function run() {
  const fresh = loadSave({});
  assert.equal(fresh.Save.data.v, 14);
  assert.deepEqual(Array.from(fresh.Save.data.cities), ["nyc"]);
  assert.deepEqual(Array.from(fresh.Save.data.cars), ["minivan"]);
  assert.equal(fresh.Save.data.navigator.board.length, 48);
  assert.equal(fresh.Save.data.saveMeta.revision, 0);

  const malformed = loadSave({
    rtr_save: JSON.stringify({
      v: 2,
      miles: -30,
      lifetimeMiles: "bad",
      cities: ["nyc", "desert"],
      cars: ["broken-car"],
      currentCar: "broken-car",
      collected: ["90s|song.mp3", "90s|song.mp3"],
      mixtape: { favorites: ["missing", "90s|song.mp3"] },
      navigator: { board: [{ branch: "drink", tier: 2 }, "bad"] },
      plateBook: { states: ["NY", "NY", "TOO-LONG"], memories: [{ nope: true }] },
    }),
  });
  assert.equal(malformed.Save.miles, 0);
  assert.equal(malformed.Save.lifetimeMiles, 0);
  assert(malformed.Save.data.cities.includes("chicago"));
  assert.deepEqual(Array.from(malformed.Save.data.cars), ["minivan"]);
  assert.equal(malformed.Save.data.currentCar, "minivan");
  assert.deepEqual(Array.from(malformed.Save.favoriteSongs()), ["90s|song.mp3"]);
  assert.equal(malformed.Save.data.navigator.board[0], 202);
  assert.equal(malformed.Save.data.navigator.board[1], null);
  assert.deepEqual(Array.from(malformed.Save.data.plateBook.states), ["NY"]);

  const legacy = loadSave({
    rtr_collected: JSON.stringify(["90s|legacy.mp3"]),
    rtr_best: "1234",
  });
  assert(legacy.Save.isCollected("90s|legacy.mp3"));
  assert.equal(legacy.Save.runnerBest, 1234);

  const progression = loadSave({});
  assert(progression.Save.collect("90s|starter.mp3"));
  assert(!progression.Save.collect("90s|starter.mp3"));
  progression.Save.addMiles(1000);
  assert.equal(progression.Save.miles, 1000);
  assert.equal(progression.Save.lifetimeMiles, 1000);
  assert(progression.Save.unlockCar("suv"));
  assert(progression.Save.isStationUnlocked("00s"));
  assert(!progression.Save.isStationUnlocked("80s"));
  assert.equal(progression.Save.recordSongResult("90s|starter.mp3", "easy", "C", 5000), "medium");
  assert(progression.Save.hasSongDiff("90s|starter.mp3", "medium"));
  assert.equal(progression.Save.songHighScore("90s|starter.mp3", "easy"), 5000);
  assert(progression.Save.recordSongFullCombo("90s|starter.mp3", "easy"));
  assert(!progression.Save.recordSongFullCombo("90s|starter.mp3", "easy"));
  assert(progression.Save.hasSongFullCombo("90s|starter.mp3", "easy"));
  assert(progression.Save.collect("90s|second.mp3"));
  assert(progression.Save.setFavoriteSong("90s|starter.mp3", true));
  assert(progression.Save.setFavoriteSong("90s|second.mp3", true));
  assert(progression.Save.moveFavoriteSong("90s|second.mp3", -1));
  assert.deepEqual(Array.from(progression.Save.favoriteSongs()), ["90s|second.mp3", "90s|starter.mp3"]);
  progression.Save.data.navigator.energy = 90;
  assert.equal(progression.Save.addNavigatorEnergy(4), 4);
  assert.equal(progression.Save.data.navigator.energy, 94);
  assert.equal(progression.Save.addNavigatorEnergy(20), 6);
  assert.equal(progression.Save.data.navigator.energy, 100);
  assert(progression.Save.spendMiles(250));
  assert.equal(progression.Save.miles, 750);
  assert.equal(progression.Save.lifetimeMiles, 1000);
  assert(progression.Save.data.saveMeta.revision >= 5);
  assert(progression.Save.data.saveMeta.updatedAt > 0);

  const nativeWrites = [];
  const native = loadSave(
    { rtr_save: JSON.stringify({ miles: 5 }) },
    {
      Plugins: {
        Preferences: {
          set({ key, value }) {
            return new Promise((resolve) => setTimeout(() => {
              nativeWrites.push({ key, value: JSON.parse(value) });
              resolve();
            }, 2));
          },
          get() { return Promise.resolve({ value: null }); },
        },
      },
    },
  );
  native.Save.addMiles(1);
  native.Save.addMiles(2);
  await native.Save._nativeBackupQueue;
  assert(nativeWrites.length >= 2);
  assert.equal(nativeWrites[nativeWrites.length - 1].value.miles, 8);
  assert(
    nativeWrites.every((entry, index) => index === 0 || entry.value.saveMeta.revision >= nativeWrites[index - 1].value.saveMeta.revision),
    "native backups must preserve revision order",
  );

  console.log("Save migration and progression checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
