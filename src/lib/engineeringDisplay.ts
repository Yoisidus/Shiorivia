/**
 * Presentation-only fallback for models that serialize visible Officina prose
 * as literal "\n" characters. Never use this for code edits or on-disk files.
 *
 * Fenced/inline code and IDE XML payloads are protected, including unfinished
 * tags or fences that may arrive while the stream is still growing.
 */
export function normalizeOfficinaDisplay(text: string): string {
  if (!text.includes("\\n") && !text.includes("\\r\\n")) return text;
  const protectedRegions = /<ide_edit\b[\s\S]*?(?:<\/ide_edit\s*>|$)|<file\b[\s\S]*?(?:<\/file\s*>|$)|\x60{3}[\s\S]*?(?:\x60{3}|$)|\x60[^\x60\n]*(?:\x60|$)/gi;
  const normalizeProse = (value: string) => {
    // Avoid treating a lone escape in a pathname or JS example as a newline.
    const escaped = value.match(/(?<!\\)\\(?:r\\n|n)/g) || [];
    if (escaped.length < 2 && !/(?<!\\)\\n(?=[ \t]|$)/.test(value)) return value;
    return value.replace(/(?<!\\)\\r\\n|(?<!\\)\\n/g, "\n");
  };
  let result = "";
  let position = 0;
  for (const match of text.matchAll(protectedRegions)) {
    const index = match.index ?? 0;
    result += normalizeProse(text.slice(position, index)) + match[0];
    position = index + match[0].length;
  }
  return result + normalizeProse(text.slice(position));
}

/**
 * The streaming response contains machine-readable <ide_edit> JSON while the
 * edit is still in flight. Present decoded line changes, never raw JSON with
 * escaped "\\n" strings. Raw model text remains unchanged for processing.
 */
export function formatOfficinaStreamingDisplay(raw: string): string {
  const text = normalizeOfficinaDisplay(raw);
  const formatted = text.replace(/<ide_edit\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/ide_edit\s*>/gi,
    (_full, filePath: string, payload: string) => {
      try {
        const data: unknown = JSON.parse(payload);
        if (!data || typeof data !== "object" || !Array.isArray((data as { edits?: unknown }).edits))
          return "\n\nIDE 修改预览正在解析…\n";
        const edits = (data as { edits: Array<Record<string, unknown>> }).edits;
        const changes: string[] = [];
        for (const edit of edits.slice(0, 10)) {
          const op = String(edit.op || "");
          const position = String(edit.startLine ?? "?");
          changes.push("@@ " + op + " · L" + position + " @@");
          if (typeof edit.expected === "string") {
            const prefix = op.startsWith("insert_") ? "  " : "- ";
            changes.push(...edit.expected.split(/\r?\n/).map(line => prefix + line));
          }
          if (typeof edit.text === "string" && op !== "delete") {
            changes.push(...edit.text.split(/\r?\n/).map(line => "+ " + line));
          }
        }
        if (edits.length > 10) changes.push("…其余 " + (edits.length - 10) + " 处修改将在审核窗口显示");
        const preview = changes.map(line => "    " + line).join("\n");
        return "\n\n**IDE 代码修改预览 · " + filePath + "**\n\n" + preview + "\n\n";
      } catch {
        return "\n\nIDE 修改预览正在解析…\n";
      }
    });
  // Partial model chunks may end in the middle of JSON. Never print broken
  // editing instructions into the chat bubble while streaming.
  return formatted.replace(/<ide_edit\b[\s\S]*$/i, "\n\n正在准备 IDE 局部修改…");
}
