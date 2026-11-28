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

test("sync conflict dialog is mounted once in the shared screen host", () => {
  const source = read("src/app/page.tsx");
  assert.equal((source.match(/<SyncConflictModal\b/g) || []).length, 1);
  const host = source.indexOf("const renderWithTransition");
  const modal = source.indexOf("<SyncConflictModal", host);
  const firstMode = source.indexOf("if (showCharta && cloud.initLoaded)", host);
  assert.ok(host >= 0 && modal > host && firstMode > modal);
  assert.ok(source.indexOf("{screen}", host) < modal);
});

test("local save messages use the active locale and VIAE-aware loss guard", () => {
  const source = read("src/hooks/useLocalFileSync.ts");
  assert.ok(source.includes('deepText(locale, "local.storage.saveConfirm")'));
  assert.ok(source.includes('hasMajorMessageLoss(sessions, serverData?.sessions || [])'));
  assert.ok(!source.includes('dialog.confirm("💾 确定'));
});

test("major deletion protection includes nested VIAE roads", () => {
  const { countSavedMessages, hasMajorMessageLoss } = require("../src/lib/appendSync.ts");
  const messages = n => Array.from({length:n}, () => ({role:"user",content:"x"}));
  const ordinary = {id:"chat",messages:messages(80)};
  const road = n => ({id:"viae",messages:[],limeGroups:[{id:"road",messages:messages(n)}]});
  assert.equal(countSavedMessages([ordinary,road(12)]),92);
  assert.equal(hasMajorMessageLoss([ordinary,road(5)],[ordinary,road(12)]),true);
  assert.equal(hasMajorMessageLoss([ordinary,road(6)],[ordinary,road(12)]),false);
  assert.equal(hasMajorMessageLoss([ordinary],[ordinary,road(12)]),true);
  assert.equal(hasMajorMessageLoss([road(4)],[road(8)]),false);
});

test("localized dialog messages resolve in all five supported languages", () => {
  const { deepText } = require("../src/lib/i18nDeep.ts");
  for (const key of ["local.storage.saveConfirm","engine.officinaBind","engine.repairMetadata","engine.viaeRepairConfirm","engine.ideWriteFailed","syncConflict.messages"]) {
    const values = ["zh-CN","zh-TW","en","ja","ko"].map(locale => deepText(locale,key));
    for (const value of values) { assert.ok(value && value !== key, key); }
    assert.ok(!/[\u3400-\u9fff]/.test(values[2]), key);
    assert.notEqual(values[0],values[2],key);
    assert.notEqual(values[0],values[3],key);
    assert.notEqual(values[0],values[4],key);
  }
});

test("story and novel cast picker localizes built-in names without changing IDs or custom names", () => {
  const source = read("src/components/StoryCastPicker.tsx");
  const { characterDisplayName, CHARACTER_NAMES } = require("../src/lib/characterNames.ts");
  assert.ok(source.startsWith('"use client";'));
  assert.ok(source.includes('id: char.id, name: characterDisplayName(char.id, char.name, locale)'));
  assert.ok(source.includes('id: char.id, name: nameForCharta(char, locale)'));
  assert.ok(source.includes('[customCharacters, locale]'));
  assert.ok(source.includes('catalog.find(char => char.id === id)?.name'));
  for (const [id, names] of Object.entries(CHARACTER_NAMES)) {
    for (const [locale, expected] of [["zh-CN", names.zh], ["zh-TW", names.ja], ["en", names.romanized], ["ja", names.ja], ["ko", names.romanized]]) {
      assert.equal(characterDisplayName(id, names.zh, locale), expected);
    }
  }
  assert.equal(characterDisplayName("custom-cast-id", "原创角色", "en"), "原创角色");
});

test("Tela chapter numbering preserves intentionally empty English suffix", () => {
  const { deepText, novelChapterLabel } = require("../src/lib/i18nDeep.ts");
  assert.equal(deepText("en", "novel.toolbar.chapterSuffix"), "");
  for (const [locale, expected] of [["zh-CN", "第1章"], ["zh-TW", "第1章"], ["en", "Chapter 1"], ["ja", "第1章"], ["ko", "제1장"]]) {
    assert.equal(novelChapterLabel(locale, 1), expected);
  }
  assert.equal(novelChapterLabel("en", 12), "Chapter 12");
  assert.equal(deepText("en", "missing.test.key"), "missing.test.key");
  const readSource = p => fs.readFileSync(require("node:path").join(__dirname, "..", p), "utf8");
  const ui = readSource("src/components/NovelInterface.tsx");
  assert.equal((ui.match(/novelChapterLabel\(locale, i \+ 1\)/g) || []).length, 3);
  assert.ok(readSource("src/hooks/useChatEngine.ts").includes("previousTitle || novelChapterLabel(locale, chapterCount)"));
  assert.ok(readSource("src/components/NovelArchiveActions.tsx").includes("extractNovelChapters(session.messages, locale)"));
  assert.ok(readSource("src/lib/novelDocx.ts").includes("meta?.[1]?.trim() || novelChapterLabel(locale, index + 1)"));
});

test("composer placeholders use localized character names and natural word order", () => {
  const { chatComposerPlaceholder } = require("../src/lib/i18nDeep.ts");
  const { characterDisplayName } = require("../src/lib/characterNames.ts");
  const cases = [
    ["zh-CN", "和千早 爱音聊聊天…"],
    ["zh-TW", "和千早 愛音聊聊天…"],
    ["en", "Chat with Chihaya Anon…"],
    ["ja", "千早 愛音とおしゃべり…"],
    ["ko", "Chihaya Anon에게 메시지 보내기…"],
  ];
  for (const [locale, expected] of cases) {
    const name = characterDisplayName("anon", "千早 爱音", locale);
    assert.equal(chatComposerPlaceholder(locale, "chat", name), expected);
    assert.ok(!chatComposerPlaceholder(locale, "infinite", name).includes("{name}"));
    assert.ok(!chatComposerPlaceholder(locale, "sliding", name).includes(name));
  }
  assert.equal(chatComposerPlaceholder("en", "infinite", characterDisplayName("uika", "三角 初华", "en")), "Speak to Misumi Uika…");
  assert.equal(chatComposerPlaceholder("en", "chat", characterDisplayName("custom-id", "OC $&", "en")), "Chat with OC $&…");
  assert.equal(chatComposerPlaceholder("en", "sliding", ""), "Start your dream…");
  const source = read("src/components/ChatInterface.tsx");
  assert.ok(source.startsWith('"use client";'));
  assert.ok(source.includes("chatComposerPlaceholder(locale, currentSession?.memoryMode, characterDisplayName(currentCharacter.id, currentCharacter.name, locale))"));
  assert.ok(source.includes('storyStateRepairing ? deepText(locale, "chat.waitRepair")'));
});
