// Run: node --experimental-strip-types scripts/check-umbra-multichar-worldlines.mjs
// Wiring/contract checks. Not a substitute for TypeScript, build or browser smoke tests.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canExtendWorldline } from "../src/lib/worldlineLock.ts";
import { worldlineFor, BANG_DREAM_CANON } from "../src/lib/storyWorldline.ts";
import { engineeringOutputIncomplete } from "../src/lib/engineeringCompletion.ts";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

const w = { ...worldlineFor(null), era: BANG_DREAM_CANON[5].era, period: BANG_DREAM_CANON[5].period };
const extra = { worldId: "world-12345678", worldName: "Other", worldDescription: "",
  canonTimeline: [{ era: "Past", period: "P1" }], baseEra: "Past", basePeriod: "P1" };
assert.ok(canExtendWorldline(null, w));
assert.ok(canExtendWorldline(w, w));
assert.ok(!canExtendWorldline(w, { ...w, era: "未来", period: "T-9-10" }));
assert.ok(!canExtendWorldline(w, { ...w, worldId: "world-12345678" }));
const extended = { ...w, crossWorld: { enabled: true, includeUniversal: false, secondary: [extra] } };
assert.ok(canExtendWorldline(w, extended));
assert.ok(!canExtendWorldline(extended, w), "Cannot delete enabled secondary world");
assert.ok(!canExtendWorldline(extended, { ...w, crossWorld: { enabled: true, includeUniversal: false, secondary: [] } }));
const extra2 = { ...extra, worldId: "world-87654321" };
assert.ok(canExtendWorldline(extended, { ...w, crossWorld: { enabled: true, includeUniversal: false, secondary: [extra, extra2] } }));
assert.ok(!canExtendWorldline(extended, { ...w, crossWorld: { enabled: true, includeUniversal: false, secondary: [{ ...extra, basePeriod: "P2" }] } }));

assert.ok(!engineeringOutputIncomplete("睦，你好", "你好。"));
assert.ok(engineeringOutputIncomplete("请创建一个完整组件", "组件如下：可以使用按钮。"));
assert.ok(engineeringOutputIncomplete("请写完整组件", '<file name="a.tsx">const a=1;'));
assert.ok(!engineeringOutputIncomplete("请写完整组件", '<file name="a.tsx">const a=1;</file>'));

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
assert.ok(modal.includes("canExtendWorldline(value, next)"));
assert.ok(viae.includes("canExtendWorldline(viaeWorldline(activeGroup), parsed)"));
assert.ok(viaeEditor.includes("protectedSecondary"));
assert.ok(setting.includes("Image Studio · 生图设置"));
console.log("PASS: additive worldlines, Umbra multi-speaker and memory wire, Officina completion and neutral settings.");
