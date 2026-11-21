/**
 * Via Lata's single canonical game_state contract.
 * Narrative craft and role/worldline data are intentionally kept elsewhere.
 * State-repair requests use their own short extractor prompt.
 */
export function storyOutputContract(input: {
  danmakuEnabled: boolean;
  danmakuCount: number;
}): string {
  const count = Math.min(24, Math.max(1, Math.round(input.danmakuCount || 8)));
  const danmakuExample = input.danmakuEnabled
    ? '["针对当前剧情的机智短评", "从另一角度吐槽的短评"]'
    : '[]';

  return `
[STORY GAME STATE — SOLE STRUCTURED OUTPUT CONTRACT]
After writing the immersive story prose, append exactly ONE complete <game_state> JSON object, outside <thinking> and after any <session_title> metadata. It must be the LAST output block. Save sufficient output room for the entire object.
These fields describe current dynamic state; static biography, established worldline and historical canon belong to supplied setting data, not generated state.

Required JSON shape (examples are placeholders, NOT actual story facts):
<game_state>
{
  "protagonist": null,
  "sceneCastIds": [],
  "nextSceneCastIds": [],
  "character": [],
  "suggestions": {"fun": "", "rational": "", "radical": ""},
  "danmaku": ${danmakuExample},
  "timeline": {"major": "", "medium": "", "minor": ""},
  "music": null
}
</game_state>

- All eight keys are mandatory; maintain exactly these object/array shapes. Use valid JSON, never markdown fences, commentary or an array of {tag,text} suggestions.
- protagonist: in observer mode without a selected POV use null; in participant or chosen-POV mode use an object with exactly SEVEN strings: name, timeDesc, environment, temperature, clothing, sensation, innerState. Use "" for genuinely unknown details. Protagonist.environment describes the protagonist's present location.
- character: other in-world characters ONLY, NEVER the active self or selected POV. Each entry identifies a known id and name and may include clothing, shoes, bodyState, legState, innerState and numeric affection, Possessiveness, Obsession, Intimacy. Relationship numbers describe the TARGET character's feeling TOWARD the active self/POV, never the reverse or self-to-self. Do not invent absent status or impossible knowledge. No age or gender in live status objects.
- sceneCastIds: IDs of characters actually on stage in the current scene. nextSceneCastIds: conservative prediction (usually 1–3 eligible IDs) likely to appear NEXT turn. These are different purposes. Use the allowed roster only, never invent IDs, include the human observer as a cast member, or include the participant's self ID. Empty arrays are valid.
- suggestions: three distinct, specific NEXT-SCENE developments that respect the active canon/AU period, personality, knowledge and causality; fun is playful and surprising, rational is grounded and tactful, radical is consequential but believable. For observers, use third-person director commands making characters DO something, not commands to the human observer to watch or wait; for participants, use actions the chosen self can plausibly take. No forced OOC acts, future spoilers or repeated vague suggestions.
- timeline: descriptive major/medium/minor continuity notes. NEVER overwrite, rename or infer a replacement WORLD / ERA / PERIOD or AU baseline from this field.
- music: use only the separate Auto DJ instructions if enabled; otherwise null.
- Never add top-level environment, age, gender, live2d or effect fields. Background, Live2D and cinematic effects are not generated game-state commands.
- Stats represent RAW event intensity, not desired final relationship scores. The application damps affection growth (especially over 60 and 90); use small changes for small events (+1/+2) and only large changes for genuinely major events. Obsession has strong inertia.
- ${input.danmakuEnabled
      ? `danmaku: exactly ${count} distinct, short, genuinely FUNNY fictional audience comments grounded in this scene. Use strings (roughly 5–28 Chinese characters for Chinese output); vary playful teasing, surprise and perceptive reactions. They are NOT dialogue, real viewer identities or canon facts. No repetitive templates or future spoilers. Do not copy the sample strings.`
      : 'danmaku: always [] because this extension is switched off.'}
- When facts are uncertain, prefer empty or null placeholders rather than inventing story state; never omit a required field.
[END STORY GAME STATE]
`;
}
