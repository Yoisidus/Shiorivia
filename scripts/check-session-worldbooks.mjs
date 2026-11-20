// Run: node scripts/check-session-worldbooks.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const route = read("src/app/api/chat/route.ts");
const hook = read("src/hooks/useChatEngine.ts");
const page = read("src/app/page.tsx");
const chat = read("src/components/ChatInterface.tsx");
const modal = read("src/components/Modals.tsx");
const novel = read("src/components/NovelInterface.tsx");
const sync = read("src/hooks/useLocalFileSync.ts");
const store = read("src/hooks/useLocalFileSync.ts");

// Legacy global settings must be kept on disk for old archives but never used by model prompts.
assert.ok(store.includes("globalWorldInfo"), "Legacy backup compatibility must remain");
assert.ok(!hook.includes("globalWorldInfo"), "Client must not transmit legacy global world info");
assert.ok(!route.includes("globalWorldInfo"), "Server must never inject legacy global world info");
assert.ok(route.includes("[SESSION PROJECT GUIDELINES]"), "Officina needs per-session engineering guidelines");
assert.ok(route.includes("[SESSION WORLD]"), "Umbra needs its independent session worldbook");
assert.ok(route.includes("[SESSION STORY NOTES]"), "Via Lata needs its independent session worldbook");
assert.ok(hook.includes("localWorldInfo: currentSession.localWorldInfo"));
assert.ok(page.includes("localWorldInfo: value") && page.includes("WorldInfoModal"));
assert.ok(!page.includes("showGlobalWorld}"), "Unused global world modal must disappear");
assert.ok(!chat.includes("setShowGlobalWorld"), "Global world controls must disappear");
assert.ok(chat.includes("故事手记") && chat.includes("聊天笔记") && chat.includes("会话指南"));
assert.ok(modal.includes("window.alert(\"保存成功\")"), "Session worldbook must confirm save");
assert.ok(modal.includes("setDraft(content)") && modal.includes("onSave(draft)"), "Cancel must not change session content");
assert.ok(novel.includes("SESSION SETTING") && !novel.includes("GLOBAL SETTING"));
assert.ok(sync.includes("window.alert(\"保存成功 · 已写入本地磁盘。\")"), "Manual sync uses browser alert");
console.log("PASS: session-only worldbooks, scoped prompts, distinct UI, save feedback and legacy storage");
