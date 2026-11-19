/** Shared pure path policy for the local Officina IDE sandbox. */
const MAX_DEPTH = 14;
const BLOCKED_PARTS = /^(?:node_modules|\.git|\.next|\.env(?:\..*)?|\.ssh|\.npmrc|\.gitconfig|id_rsa|id_ed25519|credentials(?:\..*)?|secrets?(?:\..*)?|private[-_.]?key(?:\..*)?)$/i;
const BLOCKED_EXT = /\.(?:pem|p12|pfx|key|crt|cer|der|sqlite|db|png|jpe?g|gif|webp|ico|pdf|zip|gz|7z|exe|dll|so|wasm|mp3|mp4|woff2?)$/i;
const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

function cleanPart(part: string): string {
  if (!part || part !== part.trim() || part === "." || part === ".."
    || part.startsWith(".") || part.endsWith(".") || /[<>:"\\|?*\x00-\x1f]/.test(part)
    || BLOCKED_PARTS.test(part) || WINDOWS_RESERVED.test(part)
    || part.length > 100) throw new Error("不允许访问该项目路径或隐藏文件。");
  return part;
}
export function validProjectName(value: unknown): string {
  if (typeof value !== "string" || value.includes("/") || value.includes("\\"))
    throw new Error("项目名称只能是一个文件夹名称。");
  return cleanPart(value);
}
export function validRelativePath(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 500 || value.startsWith("/")
    || value.includes("\\") || value.includes("//"))
    throw new Error("项目文件路径无效。");
  const parts = value.split("/");
  if (parts.length > MAX_DEPTH) throw new Error("项目目录层级过深。");
  for (const part of parts) cleanPart(part);
  return parts.join("/");
}
export function isWorkspaceTextFile(relative: string): boolean {
  return !BLOCKED_EXT.test(relative) && !relative.toLowerCase().endsWith(".lock");
}
