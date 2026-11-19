// Run: node scripts/check-umbra-multichar-worldlines.mjs
// Wiring/contract checks. Not a substitute for TypeScript, build or browser smoke tests.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

const lock = read("src/lib/worldlineLock.ts");
const recovery = read("src/lib/engineeringCompletion.ts");
assert.ok(lock.includes("export function canExtendWorldline"));
assert.ok(lock.includes("saved.worldId === proposed.worldId"));
assert.ok(lock.includes("saved.period === proposed.period"));
assert.ok(lock.includes("former?.secondary") && lock.includes("if (!replacement"));
assert.ok(lock.includes("nextWorlds.get(original.worldId)"));
assert.ok(recovery.includes("export function engineeringOutputIncomplete"));
assert.ok(recovery.includes("opens !== closes"));
assert.ok(recovery.includes("requestsWholeFile && opens === 0"));

const hook = read("src/hooks/useChatEngine.ts");
const api = read("src/app/api/chat/route.ts");
const page = read("src/app/page.tsx");
const chat = read("src/components/ChatInterface.tsx");
const right = read("src/components/SidebarRight.tsx");
const left = read("src/components/SidebarLeft.tsx");
const modal = read("src/components/StoryWorldlineFateModal.tsx");
const viae = read("src/components/ViaeInterface.tsx");
const viaeEditor = read("src/components/ViaeWorldlineEditor.tsx");
const setting = read("src/components/SettingsCenter.tsx");

assert.ok(left.includes("UMBRA · WORLDLINE") && left.includes("chatWorldlineOpen"));
assert.ok(right.includes("hasChatWorldline") && right.includes("StoryCastAllowed") === false);
assert.ok(right.includes('isChatMode && !hasChatWorldline') && right.includes('worldNameFor(charWorldId(char.id))'));
assert.ok(chat.includes("requiresChatWorldline") && chat.includes("requiresChatCharacter"));
assert.ok(chat.includes("inputLocked = requiresWorldline || requiresEngineer || requiresChatWorldline || requiresChatCharacter"));
assert.ok(page.includes('nextMode === "infinite" || nextMode === "chat" ? "" : charId'));
assert.ok(page.includes("chatCharacterMemories:") && page.includes("onSaveChatWorldline={saveChatWorldline}"));
assert.ok(page.includes("onCompleteEngineeringOutput={engine.completeEngineeringOutput}"));
assert.ok(hook.includes("chatCharacterMemories?.[activeCharacterId]"));
assert.ok(hook.includes("activeChartaSelf:") && hook.includes('currentSession.memoryMode === "chat"'));
assert.ok(hook.includes("engineeringOutputIncomplete(requestText, currentText)"));
assert.ok(chat.includes("msg.engineeringOutputIncomplete") && chat.includes("确认补全"));
assert.ok(api.includes("UMBRA — MULTI-CHARACTER CONVERSATION"));
assert.ok(api.includes("Previous character speaker"));
assert.ok(api.includes("User message addressed to"));
assert.ok(api.includes("CURRENT SPEAKER STM") && api.includes("ACTIVE CHARTA SELF"));
assert.ok(api.includes('memoryMode === "sliding" || memoryMode === "chat" ? finalMessages : messages'), "Model adapters must receive annotated Umbra history");
assert.ok(modal.includes("canExtendWorldline(value, next)"));
assert.ok(viae.includes("canExtendWorldline(viaeWorldline(activeGroup), parsed)"));
assert.ok(viaeEditor.includes("protectedSecondary"));
assert.ok(setting.includes("Image Studio · 生图设置"));
console.log("PASS: additive worldlines, Umbra multi-speaker and memory wire, Officina completion and neutral settings.");
