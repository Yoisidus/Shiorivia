// Run: node scripts/check-officina-character-engineer.mjs
// Structural regression coverage. Type-check and build remain separate local checks.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const api = read("src/app/api/chat/route.ts");
const builder = read("src/lib/engineeringPersona.ts");
const settings = read("src/components/SettingsCenter.tsx");
const page = read("src/app/page.tsx");
const engine = read("src/hooks/useChatEngine.ts");
const sidebar = read("src/components/SidebarRight.tsx");

assert.ok(builder.includes('import { LORE_LIBRARY }'));
assert.ok(builder.includes("fullBuiltInEngineeringLore"));
assert.ok(builder.includes("formatChartaLore({"));
assert.ok(builder.includes("relationshipNotes: included.relationships"));
assert.ok(builder.includes("relationships: included.relationships"));
assert.ok(builder.includes("experienceNotes: included.experiences"));
assert.ok(builder.includes("experiences: included.experiences"));
assert.ok(builder.includes("World setting"));
assert.ok(builder.includes("World canonical timeline"));
assert.ok(builder.includes("profile ||"));
assert.ok(builder.includes("relationships: false, experiences: false"));

assert.ok(api.includes("[IDENTITY — OFFICINA CHARACTER ENGINEER]"));
assert.ok(api.includes("You ARE the selected character"));
assert.ok(api.includes("personal pair-programming conversation"));
assert.ok(api.includes("Talk naturally when greeted"));
assert.ok(api.includes("Do not reveal hidden reasoning"));
assert.ok(api.includes("buildEngineeringCharacterContext("));
assert.ok(!api.includes("[Personality Settings]:\\n\u0024{activeChar.lore}"));
assert.ok(!api.includes("Start response with <thinking>"));
assert.ok(api.includes("const engineerWorlds = Array.isArray(body.engineeringWorlds)"));
assert.ok(api.includes("body.engineeringLore?.relationships === true"));
assert.ok(api.includes("body.engineeringLore?.experiences === true"));
assert.ok(engine.includes('currentSession.memoryMode === "infinite" ? {'));
assert.ok(engine.includes("engineeringWorlds: storyWorlds.map"));
assert.ok(engine.includes("config.engineeringLoreRelationships === true"));
assert.ok(engine.includes("config.engineeringLoreExperiences === true"));

assert.ok(page.includes("engineeringLoreRelationships: false"));
assert.ok(page.includes("engineeringLoreExperiences: false"));
assert.ok(page.includes("saved.engineeringLoreRelationships === true"));
assert.ok(page.includes("saved.engineeringLoreExperiences === true"));
assert.ok(page.includes("engineeringLoreRelationshipsEnabled={config.engineeringLoreRelationships}"));
assert.ok(page.includes("engineeringLoreExperiencesEnabled={config.engineeringLoreExperiences}"));
assert.ok(page.includes('if (currentSession?.memoryMode === "infinite") return { ...base };'));
assert.ok(!page.includes("handleToggleVariant={() =>"));
assert.ok(settings.includes("OFFICINA · 角色工程师设定"));
assert.ok(settings.includes("核心人物关系"));
assert.ok(settings.includes("主要经历"));

assert.ok(sidebar.includes("按世界观筛选 · WORLD"));
assert.ok(sidebar.includes("全部世界观 · All worlds"));
assert.ok(sidebar.includes("worldNameFor(charWorldId(char.id))"));
assert.ok(sidebar.includes("filteredPersonas.map"));
assert.ok(!sidebar.includes("handleToggleVariant"));
assert.ok(!sidebar.includes("ToggleLeft"));
assert.ok(!sidebar.includes("voiceVariant ==="));

console.log("PASS: Officina role engineer full-era persona, optional lore settings, world filter and removed variant UI.");
