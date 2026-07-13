const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "app", "www");

function copyFile(src, dest, transform) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const data = fs.readFileSync(src);
  if (transform) fs.writeFileSync(dest, transform(data.toString("utf8")));
  else fs.writeFileSync(dest, data);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const source = path.join(src, entry.name);
    const target = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(source, target);
    else if (entry.isFile()) copyFile(source, target);
  }
}

function appHome(html) {
  return html
    .replaceAll('data-href="index.html#mixtape"', 'data-href="runner.html#mixtape"')
    .replaceAll('data-href="index.html"', 'data-href="runner.html"')
    .replaceAll('goTo("index.html"', 'goTo("runner.html"');
}

function appRunner(html) {
  return html.replaceAll('href="home.html"', 'href="index.html"');
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

copyFile(path.join(root, "home.html"), path.join(out, "index.html"), appHome);
copyFile(path.join(root, "home.html"), path.join(out, "home.html"), appHome);
copyFile(path.join(root, "index.html"), path.join(out, "runner.html"), appRunner);
copyFile(path.join(root, "save.js"), path.join(out, "save.js"));
copyFile(path.join(root, "manifest.json"), path.join(out, "manifest.json"));
copyFile(path.join(root, "icon.png"), path.join(out, "icon.png"));

copyDir(path.join(root, "assets"), path.join(out, "assets"));
copyDir(path.join(root, "radio"), path.join(out, "radio"));
copyDir(path.join(root, "tap"), path.join(out, "tap"));

console.log("Prepared Capacitor web bundle at app/www");
