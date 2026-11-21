/** Metadata emitted in the SAME generation as the visible response. */
export const INLINE_TITLE_TAG = "session_title";

export function shouldReviewInlineTitle(userTurn: number): boolean {
  return Number.isInteger(userTurn) && userTurn > 0 && (userTurn - 1) % 4 === 0;
}

export function titleInstruction(currentTitle: string, userTurn: number, manual: boolean, novel: boolean, story = false): string {
  const eligible = shouldReviewInlineTitle(userTurn) && !manual;
  const title = JSON.stringify(String(currentTitle || "").slice(0, 100));
  return [
    "[INLINE SESSION TITLE — SAME RESPONSE, NO EXTRA API REQUEST]",
    `Current saved conversation title: ${title}. User turn: ${userTurn}. Manually renamed: ${manual ? "YES" : "NO"}.`,
    eligible
      ? "You MUST review whether the saved title accurately describes the CURRENT conversation and memory, including changed focus after deletions. "
        + (story
          ? "In Story, FIRST output <thinking>...</thinking>, THEN exactly ONE <session_title>NEW_TITLE_OR_KEEP</session_title> immediately after the closing thinking tag, BEFORE story prose."
          : "At the start of your response (AFTER the first-line <meta ... /> tag for novels) emit exactly ONE <session_title>NEW_TITLE_OR_KEEP</session_title> tag.")
        + " Use KEEP if the current title still fits; otherwise a concise meaningful new title in the active UI language. Do not use the words NEW_TITLE_OR_KEEP literally."
      : "Do NOT emit a <session_title> tag this turn. The saved session title must remain unchanged.",
    novel
      ? "Novel only: independent of the session_title review, ALWAYS begin each chapter's literary content with <meta title=\"CURRENT_NOVEL_TITLE\" chapter=\"MEANINGFUL_CHAPTER_TITLE\" />. Chapter title is mandatory EVERY turn; reuse it only when the chapter's main scene/theme is truly continuous. The meta title reflects the latest saved session title unless this turn's session_title changes it."
      : story
        ? "Story output order: <thinking>...</thinking>, optional <session_title>...</session_title> only on review turns, visible story prose, and finally <game_state> JSON. Do not place title metadata inside thinking or prose."
        : "Put session_title before the visible reply (but AFTER novel <meta>), and do not quote or explain the tag. Do not let it interrupt story prose, code blocks or game_state JSON.",
    "[END INLINE SESSION TITLE]",
  ].join("\n");
}

/** Return sanitized visible output + safe proposed title; never interpret prose as metadata. */
export function extractInlineTitle(text: string): { text: string; title: string | null } {
  let candidate: string | null = null;
  const clean = String(text || "").replace(/<session_title\s*>([\s\S]*?)<\/session_title\s*>/gi,
    (match: string, raw: string, index: number, source: string) => {
      // Metadata belongs at the start (or after novel <meta>). Never remove
      // a literal XML example embedded in a source file or normal prose.
      const prefix = source.slice(0, index).trim();
      const afterNovelMeta = /^<meta\s+title=["'][^"']+["']\s+chapter=["'][^"']+["']\s*\/\s*>$/i.test(prefix);
      if (index > 500 || (prefix.length > 0 && !afterNovelMeta)) return match;
      if (candidate === null) {
        const value = raw.trim().replace(/[<>\r\n]/g, " ").trim();
        candidate = value && value.length <= 100 && !/^KEEP$/i.test(value) ? value : "";
      }
      return "";
    });
  return { text: clean.trimStart(), title: candidate || null };
}
