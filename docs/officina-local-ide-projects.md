# Officina Local IDE · Project roots and on-demand code inspection

This is the initial **local filesystem** integration. GitHub cloning/connecting and vector/BM25 semantic indexing are **not** part of this revision.

## Project structure

Each Officina conversation may bind to **one first-level folder** in `<Shiorivia>/IDE/`. Different conversations can bind the same project, but a conversation has only one currently selected project root. Its name is persisted as `session.engineeringProjectRoot` in the user's normal local session JSON, independently from the chat UI folder grouping.

Example:

```text
Shiorivia/
  IDE/
    WeatherApp/                ← Officina session project root
      package.json
      src/
        api/
          weather.ts
        components/
          Forecast.tsx
    StudyPlanner/              ← another session/project root
      main.py
```

`IDE/.gitkeep` makes the directory part of the Shiorivia checkout; `.gitignore` excludes all actual user project contents under `/IDE/*`. Do not put real credentials into project files. The local IDE reader blocks hidden files, .env variants, known key/credential filenames, binary extensions, `node_modules`, `.git`, symlinks, `..` and absolute paths, and caps file/search sizes.

## Binding and editor

- In the **left conversation manager**, open an Officina conversation's `…` menu and choose **绑定 IDE 项目**. The UI lists first-level `IDE/` directories and also offers **新建并绑定项目**.
- In **Officina IDE**, use the project selector beside the title to pick an existing root or create a new one. The selected root is saved to the current conversation.
- IDE now displays the project's nested file paths plus folder entries. `+` creates files with relative paths; the folder icon creates nested folders (e.g. `src/components`). File `…` supports download and confirmed deletion.
- **同步** re-reads the actual disk files. It warns before discarding unsaved editor changes; editing and Save write to the actual files within the bound root. This allows editing outside Shiorivia using VS Code, Notepad, etc., followed by **同步**.
- Older conversation `codeRepository` content remains intact. With a bound project, **迁入旧文件** copies those historic files into the disk project after confirmation. The old archive is not deleted automatically.

## AI file access

Once a project is bound, the engineering chat backend no longer sends its full source repository inside every System prompt. It first provides a small directory map and performs a bounded, read-only model-directed inspection loop (up to **four** steps):

- `list_files`: list the directory tree under an optional relative prefix.
- `search_code`: case-insensitive literal keyword lookup, returning at most 45 `path:line` snippets. Regex and semantic/BM25 search are not yet available.
- `read_file`: retrieve a specific local file by relative path and start/end line, capped at 200 lines.

The planner may request additional reads using results of the previous step. The backend executes the operations only under the bound root, passes their results back to the same configured model, and incorporates retrieved code into the final normal conversation generation. Planner steps are internal; this revision does not yet provide a detailed live tool-activity timeline in the chat UI. Model queries can require multiple calls, incurring extra time and tokens, but generally use much less code context than eager full-repository injection on larger projects.

**Untrusted source files are never system instructions.** The inspection tool has no write/execute tools; generated code must be delivered through normal `<file name="relative/path.ext">...</file>` blocks and written by the local app.

## Auto-project generation

If an Officina session is *unbound* and the model generates complete code files, the prompt requires one:

```xml
<project name="WeatherApp" />
<file name="src/api/weather.ts">
// code
</file>
```

The client creates `IDE/WeatherApp/`, then writes all relative files (automatically creating nested directories) and binds the session. A deterministic `officina-<session-id>` root is used if the model omits the project name. If the suggested root name already exists, a session-specific suffix avoids accidentally writing into somebody else's existing project. Already-bound sessions must not emit a new project tag.

Existing files **cannot be silently overwritten**: the user sees a confirmation listing same-name files. If saving is declined or fails, the generated code remains visible below the conversation answer as fenced blocks, and the session's legacy file repository keeps a fallback copy.

## Local smoke tests

```powershell
git switch main
git pull --ff-only origin main
node --experimental-strip-types scripts/check-officina-ide-workspace.mjs
npx tsc --noEmit
npm run build
npm run dev
```

Then:
1. Create Officina session A, open IDE, create `TestProject`, bind it, create `src/components` and `src/components/Hello.tsx`, and save.
2. Use Windows Explorer to edit `E:\Projects\Shiorivia\IDE\TestProject\src\components\Hello.tsx`; click **同步** in IDE and confirm the updated contents appear.
3. Open the session menu and bind another existing `IDE/` root. Verify that unrelated files don't appear.
4. Ask the bound engineer to inspect a method known to exist in the folder. In a terminal request log, verify read/search results are included and the source files are not all eagerly injected.
5. Create a new unbound Officina conversation, ask for a complete source component and check that a new project root is created and bound. Test overwriting an existing filename: cancelling the overwrite must preserve disk contents.
6. Check that `../`, absolute Windows paths, hidden `.env` and symbolic-link targets cannot be read or written through the local project API.

A full browser and disk I/O smoke test is still required on the actual Windows Shiorivia checkout. The regression script checks path validation and source wiring, not live provider calls.
