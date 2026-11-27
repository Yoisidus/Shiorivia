const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
test("launcher selects registry per install and skips only matching lockfile", () => {
  const bat = read("start_shiorivia.bat");
  assert.equal((bat.match(/^:SKIP_INSTALL$/gm) || []).length, 1);
  assert.equal((bat.match(/^call npm ci\b/gm) || []).length, 1);
  assert.ok(bat.includes("https://registry.npmjs.org"));
  assert.ok(bat.includes("https://registry.npmmirror.com"));
  assert.ok(bat.includes('call npm ci --registry="!NPM_REGISTRY!"'));
  assert.ok(bat.includes("node_modules/.shiorivia-lock-sha256"));
  assert.ok(!bat.includes("npm config set"));
});
test("local font assets are pinned with integrity and retained license notices", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const layout = read("src/app/layout.tsx");
  assert.ok(!layout.includes("next/font/google"));
  for (const [name, license] of [["@fontsource-variable/inter","inter"],["@fontsource/noto-serif-sc","noto-serif-sc"],["@fontsource-variable/jetbrains-mono","jetbrains-mono"]]) {
    const entry = lock.packages["node_modules/" + name];
    assert.equal(pkg.dependencies[name], entry.version);
    assert.equal(lock.packages[""].dependencies[name], entry.version);
    assert.match(entry.integrity, /^sha512-/);
    assert.ok(layout.includes(name));
    assert.match(read("public/font-licenses/" + license + ".txt"), /SIL OPEN FONT LICENSE Version 1.1/);
  }
});
