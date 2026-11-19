// Run: node scripts/check-officina-role-lock.mjs
// Source-wiring regression guard; run TypeScript/Next build separately.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

const page = read("src/app/page.tsx");
const chat = read("src/components/ChatInterface.tsx");
const sidebar = read("src/components/SidebarRight.tsx");
const settings = read("src/components/SettingsCenter.tsx");
const engine = read("src/hooks/useChatEngine.ts");
const server = read("src/app/api/chat/route.ts");
const summary = read("src/app/api/summarize/route.ts");
const helper = read("src/lib/engineeringSession.ts");
const types = read("src/types.ts");
const greetings = read("src/lib/sessionTitles.ts");

assert.ok(settings.includes('activeMode: "infinite" | "sliding" | "novel" | "chat" | "lime" | "hub"'));
assert.ok(settings.includes('{activeMode === "infinite" && <div'));
assert.ok(settings.includes('{(activeMode === "sliding" || activeMode === "novel") && <SwitchRow'));
assert.equal((page.match(/activeMode=/g) || []).length, 4);
for (const mode of ['"hub"', '"lime"', '"novel"']) assert.ok(page.includes('activeMode=' + mode));
assert.ok(page.includes('activeMode={currentSession?.memoryMode || "hub"}'));

assert.ok(types.includes("engineeringCharacterLocked?: boolean"));
assert.ok(helper.includes("message.role === \"user\""));
assert.ok(helper.includes('message.modelName === "System"'));
assert.ok(page.includes('const sessionCharId = nextMode === "infinite" ? "" : charId'));
assert.ok(page.includes('characterId: sessionCharId'));
assert.ok(page.includes('engineeringCharacterLocked: false'));
assert.ok(page.includes('setActiveCharacterId(sessionCharId)'));
assert.ok(page.includes('engineeringCharacterLocked: false,'));
assert.ok(page.includes('officinaUnassignedWelcome(locale)'));
assert.ok(page.includes('name: "Officina", sub: "Character Engineer"'));
assert.ok(greetings.includes('export function officinaUnassignedWelcome(locale: Locale)'));
assert.ok(chat.includes('{!requiresEngineer && <span className="text-[10px] text-gray-400'));
assert.ok(page.includes('characterId: "",'));
assert.ok(page.includes('if (currentSession?.memoryMode === "infinite" && isEngineeringCharacterLocked(currentSession))'));
assert.ok(sidebar.includes('roleLocked = isEngineeringCharacterLocked(currentSession)'));
assert.ok(sidebar.includes('<Lock size={12} /> 已绑定'));
assert.ok(sidebar.includes('cursor-not-allowed opacity-50'));

assert.ok(chat.includes("const requiresEngineer ="));
assert.ok(chat.includes("const inputLocked = requiresWorldline || requiresEngineer"));
assert.ok(chat.includes('disabled={inputLocked}'));
assert.ok(chat.includes('disabled={inputLocked || (!input.trim() && !selectedFile)}'));
assert.ok(chat.includes('!requiresEngineer && <span'));
assert.ok(chat.includes('msg.modelName === "System" ? <Hammer size={14} />'));
assert.ok(chat.includes('msg.modelName === "System" ? null : ('));

assert.ok(engine.includes("isEngineeringCharacterLocked(currentSession)"));
assert.ok(engine.includes('window.confirm("确认与当前角色开启 Officina 工程会话吗？'));
assert.ok(engine.includes('engineeringCharacterLocked: true'));
assert.ok(engine.includes('aiConversationMessages(msgs)'));
assert.ok(engine.includes('aiConversationMessages(history)'));
assert.ok(server.includes('if (!characterId || !allChars.some(char => char.id === characterId))'));
assert.ok(server.includes("fetch: globalThis.fetch"));
assert.ok(summary.includes("fetch: globalThis.fetch"));
console.log("PASS: mode-scoped settings, default unassigned Officina, first-send character lock, visual-only greeting filtering and native fetch.");
