// Run: node --experimental-strip-types scripts/check-inline-title-story-recovery.mjs
// Self-contained regression for misleading protocol labels in reasoning, no prose truncation,
// and same-turn title / engineering memory metadata.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shouldReviewInlineTitle, extractInlineTitle, titleInstruction } from "../src/lib/inlineTitle.ts";
import { stripStoryThinking, lastStoryGameState, storyProseWithoutState } from "../src/lib/storyResponseProtocol.ts";
import { extractEngineeringTurnMemory } from "../src/lib/engineeringTurnMemory.ts";
import { normalizeStoryProtocol, isUsableStoryProtocol, storyProtocolIssues } from "../src/lib/storyStateRecovery.ts";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const sampleState = {
  protagonist: { name: "涼宮 月", timeDesc: "高一春夏季·周末", environment: "自动贩卖机旁",
    temperature: "初夏微热", clothing: "", sensation: "", innerState: "" },
  sceneCastIds: ["anon"],
  nextSceneCastIds: ["anon", "tomori", "taki"],
  character: [{ id: "anon", name: "千早 爱音", affection: 52,
    Possessiveness: 12, Obsession: 6, Intimacy: 38 }],
  suggestions: { fun: "开个玩笑", rational: "递一瓶水", radical: "直接追问" },
  danmaku: [],
  timeline: { major: "高一春夏季", medium: "MyGO!!!!!", minor: "T-5-6" },
  music: null,
};
const prose = "初夏午后的阳光落得有些直白。\n\n爱音拿出手机，笑着说：要不要喝点什么？";
const raw = `<thinking>
1. 时间线已确认。
2. 结尾附完整 <game_state>，勿缺失。
</thinking>

${prose}

<game_state>
${JSON.stringify(sampleState)}
</game_state>`;
const gameBlock = lastStoryGameState(raw);
assert.ok(gameBlock, "Must find actual trailing game_state, not the thinking mention");
assert.deepEqual(normalizeStoryProtocol(JSON.parse(gameBlock.json)), sampleState);
assert.ok(isUsableStoryProtocol(normalizeStoryProtocol(JSON.parse(gameBlock.json))),
  storyProtocolIssues(sampleState).join("; "));
assert.equal(storyProseWithoutState(raw).trim(), prose);
assert.ok(!stripStoryThinking(raw).includes("<thinking>"));
const repaired = `${storyProseWithoutState(raw)}\n\n<game_state>${JSON.stringify(sampleState)}</game_state>`;
assert.ok(repaired.includes(prose), "A repaired state must never overwrite prose");
assert.ok(isUsableStoryProtocol(JSON.parse(lastStoryGameState(repaired).json)));

assert.deepEqual([1,2,3,4,5,6,7,8,9].filter(shouldReviewInlineTitle), [1,5,9]);
assert.ok(titleInstruction("新工程", 1, false, false).includes("You MUST review"));
assert.ok(!titleInstruction("手改的标题", 1, true, false).includes("You MUST review"));
const title = extractInlineTitle("<session_title>代码协作与调试</session_title>\n正文");
assert.deepEqual(title, { text: "正文", title: "代码协作与调试" });
const novel = extractInlineTitle('<meta title="旧书名" chapter="第一章" />\n<session_title>新书名</session_title>\n章节正文');
assert.equal(novel.title, "新书名");
assert.ok(novel.text.startsWith("<meta"));
assert.equal(extractInlineTitle("代码：'<session_title>不要删除</session_title>'").text,
  "代码：'<session_title>不要删除</session_title>'");
const memory = extractEngineeringTurnMemory("代码正文\n<turn_memory>完成工程初始化。</turn_memory>");
assert.equal(memory.memory, "完成工程初始化。");
assert.equal(memory.text, "代码正文");
assert.equal(extractEngineeringTurnMemory("const x = '<turn_memory>example</turn_memory>';").memory, null);

const hook = read("src/hooks/useChatEngine.ts");
const route = read("src/app/api/chat/route.ts");
const ide = read("src/components/CodeRepositoryPanel.tsx");
assert.ok(hook.includes("lastStoryGameState(fullText)"));
assert.ok(hook.includes("storyProseWithoutState(fullText)"));
assert.ok(hook.includes("titleReviewTurn:"));
assert.ok(hook.includes("extractInlineTitle(fullText)"));
assert.ok(!hook.includes("requestAutomaticTitle("), "No invisible post-response title requests");
assert.ok(!hook.includes('mode: "chapter_title"'), "No invisible chapter title requests");
assert.ok(route.includes("titleInstruction(") && route.includes("ENGINEERING STM"));
assert.ok(!route.includes("[OFFICINA TURN MEMORY — REQUIRED]"), "Officina no longer requests separate memory blocks");
assert.ok(!hook.includes("extractEngineeringTurnMemory"), "Officina uses conversational context instead of STM updates");
assert.ok(ide.includes("max-w-[960px]") && ide.includes("handleDownload") && ide.includes("handleDelete"));
assert.ok(ide.includes("<MoreHorizontal size={15}/>"));
console.log("PASS: complete story state avoids repairs, intact prose, 1/5/9 titles, inline memory, stellar IDE file actions");
