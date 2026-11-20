// Run: node --experimental-strip-types scripts/check-officina-ide-workspace.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validProjectName, validRelativePath, isWorkspaceTextFile } from "../src/lib/idePathPolicy.ts";

for (const valid of ["MyProject", "shiorivia-lab", "测试工程", "project_2026"]) {
  assert.equal(validProjectName(valid), valid);
}
for (const invalid of ["", ".", "..", "../src", "foo/bar", "foo\\bar", "C:\\Windows",
  ".env", ".git", ".ssh", "node_modules", "CON", "prn.txt", "abc. ", " bad", "x\\0"]) {
  assert.throws(() => validProjectName(invalid), undefined, `Project root must reject ${JSON.stringify(invalid)}`);
}
assert.equal(validRelativePath("src/components/App.tsx"), "src/components/App.tsx");
assert.equal(validRelativePath("a/b/c/d/file.py"), "a/b/c/d/file.py");
for (const invalid of ["../.env", "src/../../.env", "src/.env.local", "src/.git/config",
  "src/node_modules/index.js", "src\\main.ts", "/etc/passwd", "C:/Windows/win.ini",
  "foo//bar.ts", "src/./index.ts", "src/..", "src/CON.txt"]) {
  assert.throws(() => validRelativePath(invalid), undefined, `Relative path must reject ${JSON.stringify(invalid)}`);
}
assert.equal(isWorkspaceTextFile("src/components/App.tsx"), true);
assert.equal(isWorkspaceTextFile("assets/logo.png"), false);
assert.equal(isWorkspaceTextFile("private.pem"), false);
assert.equal(isWorkspaceTextFile("package-lock.json"), true);
assert.equal(isWorkspaceTextFile("Cargo.lock"), true);
// Sensitive files must be neither listed/read nor written, regardless of source of the request.
for (const sensitive of [
  ".env", ".env.local", "config/.env.production", "src/.ssh/id_ed25519",
  "credentials.json", "config/google-credentials.json", "config/service-account.json",
  "secret.yaml", "src/client_secret.json", "api-key.txt", "src/api_keys.json",
  "private_key.txt", "id_rsa", "token.json", "auth-token.json",
  "certificates/private.p8", "tls/server.key", "src/.aws/credentials",
]) {
  assert.equal(isWorkspaceTextFile(sensitive), false, `Reject sensitive file: ${sensitive}`);
}
assert.equal(isWorkspaceTextFile("src/components/App.tsx"), true);
assert.equal(isWorkspaceTextFile("src/config.ts"), true);

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const fs = read("src/lib/ideWorkspace.ts");
const api = read("src/app/api/ide/route.ts");
const runner = read("src/lib/ideInspection.ts");
const backend = read("src/app/api/chat/route.ts");
const editor = read("src/components/CodeRepositoryPanel.tsx");
const hook = read("src/hooks/useChatEngine.ts");
const sidebar = read("src/components/SidebarLeft.tsx");
const page = read("src/app/page.tsx");
const types = read("src/types.ts");
const ignore = read(".gitignore");

assert.ok(fs.includes("validRelativePath(") && fs.includes("isSymbolicLink()"));
assert.ok(fs.includes("isWorkspaceTextFile(rel)") && fs.includes("isWorkspaceTextFile(rel)"));
assert.ok(fs.includes("workspaceSnapshot") && fs.includes("listWorkspaceFiles(project)"));
assert.ok(fs.includes("MAX_PROJECT_FILES") && fs.includes("MAX_FILE_BYTES"));
assert.ok(api.includes('export async function GET') && api.includes('export async function POST'));
assert.ok(api.includes('Cross-origin IDE writes are forbidden'));
assert.ok(runner.includes("const MAX_ROUNDS = 4") && runner.includes("decodeTool"));
assert.ok(runner.includes('case "list_files"') && runner.includes('case "search_code"') && runner.includes('case "read_file"'));
assert.ok(runner.includes('await modelInstruction') && runner.includes('await executeTool'));
assert.ok(backend.includes("inspectIdeProject({") && backend.includes("engineeringProjectRoot"));
assert.ok(!backend.includes('Object.values(codeRepository).forEach'), "Bound IDE roots should not eagerly embed every file");
assert.ok(hook.includes("engineeringProjectRoot: currentSession.memoryMode"));
assert.ok(hook.includes('idePost("createProject"'));
assert.ok(hook.includes('idePost("write"'));
assert.ok(hook.includes("previousPaths") && hook.includes("window.confirm"));
assert.ok(backend.includes("return its complete replacement in <file> tags"));
assert.ok(hook.includes('idePost("write"') && editor.includes('ideRequest("write"'));
assert.ok(editor.includes("syncDisk") && editor.includes("handleNewFolder"));
assert.ok(editor.includes("onBindProject") && editor.includes("loadProjects"));
assert.ok(sidebar.includes("bindingSessionId") && sidebar.includes("onBindEngineeringProject"));
assert.ok(page.includes("onBindEngineeringProject=") && page.includes("projectRoot={"));
assert.ok(types.includes("engineeringProjectRoot?: string"));
assert.ok(ignore.includes("/IDE/*"), "Local projects must never enter the tracked repository");
console.log("PASS: root-scoped IDE path policy, project binding, bounded read-only AI tools, disk writes and sync UI.");
