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
