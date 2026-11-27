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

test("IDE runtime file accesses do not trace the whole project", () => {
  const source = read("src/lib/ideWorkspace.ts");
  const marker = "/*turbopackIgnore: true*/ ";
  assert.equal(source.split(marker).length - 1, 9);
  for (const call of ["path.join(" + marker + "current, part)", "fs.stat(" + marker + "root)", "fs.stat(" + marker + "filename)", "fs.readFile(" + marker + 'filename, "utf8")', "fs.stat(" + marker + "await safePath(project, file.path))", "fs.readFile(" + marker + 'await safePath(project, file.path), "utf8")', "fs.readFile(" + marker + 'full, "utf8")']) assert.ok(source.includes(call), call);
  assert.ok(source.includes('path.join(process.cwd(), "IDE")'));
  assert.ok(source.includes("validProjectName(project)"));
  assert.ok(source.includes("validRelativePath(relative)"));
  assert.ok(source.includes("stat?.isSymbolicLink()"));
  assert.ok(source.includes("expectedVersion"));
});
