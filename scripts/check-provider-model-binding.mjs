// Run: node --experimental-strip-types scripts/check-provider-model-binding.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { modelSelectionFor, parseProviderModelSelections, selectProviderModel } from "../src/lib/providerModelSelection.ts";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

let choices = parseProviderModelSelections(null);
assert.deepEqual(choices, {});
assert.deepEqual(modelSelectionFor(choices, "google"), { selectedModel: "", customModelId: "" });
choices = selectProviderModel(choices, "google", "catalog", "gemini-4-test");
choices = selectProviderModel(choices, "deepseek", "catalog", "deepseek-chat");
choices = selectProviderModel(choices, "custom_1", "custom", "vertex/gemini-4-hydrogen");
assert.deepEqual(modelSelectionFor(choices, "google"), { selectedModel: "gemini-4-test", customModelId: "" });
assert.deepEqual(modelSelectionFor(choices, "deepseek"), { selectedModel: "deepseek-chat", customModelId: "" });
assert.deepEqual(modelSelectionFor(choices, "custom_1"), { selectedModel: "", customModelId: "vertex/gemini-4-hydrogen" });
assert.equal(selectProviderModel(choices, "google", "catalog", "").google, undefined, "Clearing one provider must not invent a model");
assert.deepEqual(modelSelectionFor(selectProviderModel(choices, "google", "catalog", ""), "deepseek"), { selectedModel: "deepseek-chat", customModelId: "" });
assert.equal(parseProviderModelSelections({ custom_1: { kind: "catalog", id: "test" } }).custom_1.kind, "custom");
assert.deepEqual(parseProviderModelSelections({ bad: { kind: "catalog", id: "foo" }, google: { kind: "catalog", id: "" } }), {});

const page = read("src/app/page.tsx");
const shared = read("src/hooks/useChatEngine.ts");
const chat = read("src/components/ChatInterface.tsx");
const novel = read("src/components/NovelInterface.tsx");
const viae = read("src/components/ViaeInterface.tsx");
const viaeEngine = read("src/hooks/useViaeEngine.ts");
const sidebar = read("src/components/SidebarLeft.tsx");
const settings = read("src/components/SettingsCenter.tsx");
const api = read("src/app/api/chat/route.ts");
const summarize = read("src/app/api/summarize/route.ts");
const providers = read("src/app/api/providers/route.ts");

assert.ok(page.includes('selectedModel: ""') && page.includes("parseProviderModelSelections(saved.providerModels)"));
assert.ok(page.includes("modelSelectionFor(providerModels, id)"));
assert.ok(page.includes("providerModels }));"), "Provider choices should be persisted with preferences");
assert.ok(page.includes("onModelChange={selectCatalogModel}") && page.includes("onCustomModelChange={selectCustomModel}"));
assert.ok(page.includes("setSelectedModel={selectCatalogModel}") && page.includes("setCustomModelId={selectCustomModel}"));

assert.ok(chat.includes('尚未选择模型 · Select model'));
assert.ok(shared.includes('window.alert("请先在模型配置中选择当前供应商的模型'));
assert.ok(shared.indexOf('window.alert("请先在模型配置中选择当前供应商的模型') < shared.indexOf('if (!isRegen) { setInput("")'));
assert.ok(shared.includes('msgs = msgs.filter(message => !(message.role === "assistant" && message.modelName === "System"))'));
assert.ok(!api.includes("defaultModelForProvider(") && !summarize.includes("defaultModelForProvider("));
assert.ok(viaeEngine.includes('window.alert("请先为当前供应商选择模型'));
assert.ok(novel.includes('window.alert("请先选择当前供应商的模型'));

assert.ok(sidebar.includes('apiProvider.startsWith("custom_")'));
assert.ok(sidebar.includes('!apiProvider.startsWith("custom_") && modelGroups.map'));
assert.ok(providers.includes('source: "manual"'));
assert.ok(viae.includes('!provider.startsWith("custom_") && availableModels.map'));
assert.ok(novel.includes('!provider.startsWith("custom_") && availableModels.map'));
assert.ok(sidebar.includes('bg-white p-3 scrollbar-thin'));
assert.ok(settings.includes('divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white'));
console.log("PASS: provider-scoped global model selection, no defaults, model-alert gating, clean greetings and manual custom provider catalogs.");
