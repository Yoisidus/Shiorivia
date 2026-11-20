// Run: node --experimental-strip-types scripts/check-context-window.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONTEXT_WINDOW_OPTIONS, DEFAULT_CONTEXT_WINDOW_TOKENS,
  normalizeContextWindowTokens, selectContextMessages, ContextWindowError,
} from "../src/lib/contextWindow.ts";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

assert.equal(DEFAULT_CONTEXT_WINDOW_TOKENS, 32768);
assert.deepEqual([...CONTEXT_WINDOW_OPTIONS], [8192,16384,32768,65536,98304,131072]);
assert.equal(normalizeContextWindowTokens("65536"), 32768);
assert.equal(normalizeContextWindowTokens(65536), 65536);
assert.equal(normalizeContextWindowTokens(-1), 32768);

const history = Array.from({ length: 150 }, (_, i) => ({
  role: i % 2 ? "assistant" : "user", content: `Turn ${i + 1}: ` + "A".repeat(120),
}));
const full = selectContextMessages(history, "Stable instructions", 32768);
assert.equal(full.omitted, 0, "150 medium-length messages should not be cut to 4/6/9/18/20/24");
assert.equal(full.messages.length, 150);
const larger = Array.from({ length: 220 }, (_, i) => ({
  role: i % 2 ? "assistant" : "user", content: `Turn ${i}: ` + "x".repeat(900),
}));
const trimmed = selectContextMessages(larger, "You are a writer", 8192);
assert.ok(trimmed.omitted > 0 && trimmed.messages.length > 0);
assert.equal(trimmed.messages.at(-1).content, larger.at(-1).content, "Newest message must survive");
assert.equal(trimmed.messages[0], larger[trimmed.omitted], "No historical gaps allowed");
assert.throws(() => selectContextMessages([
  {role:"user", content:"X".repeat(90000)}
], "You are the assistant", 8192), ContextWindowError);
assert.throws(() => selectContextMessages([{role:"user",content:"Hello"}],
  "S".repeat(60000), 8192), ContextWindowError);
assert.throws(() => selectContextMessages([], "Prompt", 32768), ContextWindowError);

const client = read("src/hooks/useChatEngine.ts");
const viae = read("src/hooks/useViaeEngine.ts");
const viaeUi = read("src/components/ViaeInterface.tsx");
const route = read("src/app/api/chat/route.ts");
const settings = read("src/components/SettingsCenter.tsx");
const page = read("src/app/page.tsx");
const chat = read("src/components/ChatInterface.tsx");
assert.ok(!client.includes("MAX_CONTEXT_MSG = 20"));
assert.ok(client.includes("contextWindowTokens: config.contextWindowTokens"));
assert.ok(!route.includes("const MAX_HISTORY = 6"));
assert.ok(!route.includes("const ENGINEERING_WINDOW = 8"));
assert.ok(!route.includes("const WINDOW_SIZE = 4"));
assert.ok(!route.includes("messages.slice(-18)"));
assert.ok(!route.includes("messages.slice(-24)"));
assert.ok(route.includes("selectContextMessages(") && route.includes("contextOutputReserve") === false);
assert.ok(route.includes("status: error instanceof ContextWindowError ? 413 : 500"));
assert.ok(viae.includes("contextWindowTokens,") && viaeUi.includes("contextWindowTokens,"));
assert.equal((page.match(/contextWindowTokens=\{config\.contextWindowTokens\}/g) || []).length, 5, "Four settings surfaces plus VIAE");
assert.ok(settings.includes("CONTEX"+"T_WINDOW_OPTIONS"));
assert.ok(page.includes('contextWindowTokens: DEFAULT_CONTEXT_WINDOW_TOKENS'));
assert.ok(page.includes('normalizeContextWindowTokens(saved.contextWindowTokens)'));
assert.ok(page.includes('config.contextWindowTokens'));
assert.ok(!route.includes("[OFFICINA TURN MEMORY — REQUIRED]"));
assert.ok(!route.includes("[ENGINEERING STM]") && !route.includes("[ENGINEERING LTM]"));
assert.ok(!client.includes("extractEngineeringTurnMemory"));
assert.ok(!client.includes("extractedEngineerMemory.memory"));
assert.ok(chat.includes('currentSession?.memoryMode !== "infinite" && <button'));
assert.ok(page.includes('open={showMemoryVault && currentSession?.memoryMode !== "infinite"}'));
assert.ok(route.includes("implicit prompt") || route.includes("implicit caching"));
console.log("PASS: universal context budgets, reserved output, no fixed message windows, persisted settings and context-only Officina");
