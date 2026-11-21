# Local Edition development / 本地版开发

## Prerequisites / 环境

- Git; Node.js 24 and npm (see `.nvmrc`; Next.js 16.4.6).
- Character sprites are uploaded in Charta; retired background, Live2D and sprite scanners are no longer required.
- A trusted local computer. **Do not expose this development server directly to the public Internet.** See [SECURITY.md](../SECURITY.md).

## Run locally / 本地启动

```powershell
cd E:\Projects\Shiorivia  # Replace with your own checkout path
npm ci
npm run dev
```

Open `http://localhost:3000`. On Windows, `start_shiorivia.bat` is an alternative startup launcher.
Both repositories now track `package-lock.json`, so use `npm ci` for repeatable installs; use `npm install` only when intentionally updating dependencies.

If you need provider API keys or access-code-protected actions, make an untracked local copy of the **placeholder-only** template:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` and fill in only the values you use. Empty values in the example are intentional; do not put real secrets in `.env.example`.

**No default `ACCESS_CODE` is provided.** Without it, access-code validation returns HTTP 503. Do not commit real credentials or paste them into bug reports. `.gitignore` helps prevent accidents but does not protect secrets that were already committed; rotate any exposed key.

## Local assets / 本地素材

Open **Charta** to upload a portrait for a custom character. See [Charta portraits](charta-portraits.md).
For optional image generation with ComfyUI or a configured image provider, see [Image Studio](image-studio.md).
Live2D remains paused pending licensing review. You must supply artwork you have the right to use.
Automatic full background switching is disabled; user-picked backgrounds remain supported.

## Verify / 验证

```powershell
npx tsc --noEmit
npm run build
```

The legacy `next.config.mjs` still suppresses some build-time TypeScript/ESLint checks; running TypeScript explicitly is important. Dependency modernization and a fuller security audit remain separate work before any public service deployment.

### Current cast lookup and manual story-state completion / 登场角色工具与补齐状态

- Via Lata and Tela now use a **two-stage, model-directed cast lookup**: before the narrative/novel model response, the selected provider first reads an eligible ID/name roster, worldline, latest user direction and recent continuity, and returns a complete `<cast_request>{"ids":[...]}</cast_request>` (0–6 character IDs). The server validates all IDs against the active worldline and only then injects those characters' full period-scoped lore for the actual response. This is an extra provider request per story/chapter turn, not a cast-selection step after prose.
- **登场角色 / CAST** replaces **下一轮登场角色**. Only before the first response may the user optionally pin 0–6 characters; the selection tool must include them and may add others until the six-character cap. From the second turn onward the AI independently selects the entire cast, including whether to keep or replace the previously pinned characters. The UI displays the current response's selected cast and becomes read-only after the first user turn. Existing Local `storyNextCastIds` and `novelState.nextSceneCastIds` field names remain readable to avoid destructive JSON migrations; generated next-turn predictions no longer determine what lore is loaded.
- If Via Lata's final `game_state` is incomplete, its prose and earlier valid state are preserved and the assistant bubble displays **确认补齐状态**. The app no longer silently sends a second story-state repair. Clicking the button opens a confirmation dialog, sends a state-only request, locks the composer while the request is pending, validates the response, and applies it only if the exact latest assistant message is still current. Inline STM/LTM already received in the original response is held pending and committed only if this manual repair succeeds. No new narrative prose is generated.
- Via Lata adopts rose cast/worldline accents; Tela keeps its parchment/brown palette, including worldline and cast dialogs. Neither alters worldline validation or historical archive fields.
- This is a dev-first Local workflow: manual `npm run dev` smoke checking is preferred during active feature work. The following TypeScript/build commands remain optional diagnostic tools; no new regression scripts are required for this feature.

### November 2026 Local UI and cast reliability / 本地功能调整

- **Umbra worldline theme** uses its distinct mint/green palette from both the left chat sidebar and shared worldline editor, rather than the Via Lata rose palette.
- **Tela memory** is now opened from the top toolbar, alongside compact STM/LTM record counts; the original editable memory vault and saved formats are unchanged. The right-side memory preview is removed.
- **Tela entrance/exit** uses a local CSS parchment-scroll unroll/re-roll effect (desktop and mobile), controlled by the existing optional transition preference. The original curtain effect remains available from Developer preview.
- **Story suggestions** now ask confirmation for both clicking a suggested development to send immediately and pressing **填入输入框**. The managed dialog keeps the Via Lata palette and allows cancellation without changing the message/input.
- **Cast selection robustness:** each planning call must return the COMPLETE cast for the current turn, including unchanged characters rather than a delta of new arrivals. The currently selected observer POV is mandatory in the model-selected cast; it consumes one of the six slots. The current cast is passed to the planner as continuity context, not as a permanent lock. Compatible JSON formatting differences are parsed. Missing/malformed cast output, planning model failures or incompatible IDs fall back to the last eligible cast plus required first-turn pins/POV, avoiding a preventable 500. Profile eligibility and the worldline remain server-enforced.
- **Story relationship metrics** are now distinct: `affection` = 好感度, `Possessiveness` = 独占欲, `Obsession` = 病态程度, `Lust` = 情欲/sexual desire (not emotional intimacy). The generated JSON uses `Lust` instead of `Intimacy`. The UI and update logic read legacy `Intimacy` values when `Lust` is absent; saves are not destructively rewritten. The prompt does not equate desire with consent, affection, trust or actual acts. The update engine still smooths sudden changes for continuity.

### November 2026 follow-up polish / 本地细节完善

- **Via Lata POV:** observer POV can be picked from completed on-stage characters after any later chapter, not only after turn one. No automatic lock occurs merely because the player skipped selection on turn two; the POV becomes locked when a selected view is used on the subsequent generation. Old archives with a false-positive lock but no selected POV remain editable.
- **Relationship bars:** the interface displays only the concise English labels `Affection`, `Possessiveness`, `Obsession`, and `Lust`, without appended translations; model-facing definitions describe all four dimensions independently. Existing `Intimacy` numbers remain a read-compatible legacy alias for `Lust`.
- **Plot guides:** the managed Via Lata and Tela confirmation dialogs display the actual suggestion in a distinct themed preview box and distinguish immediate send from inserting editable text. Each accepted action triggers a matching themed feedback notice. The unused story-side Copy button was removed.
- **Tela state:** new chapters produce ONE final `<novel_state>` object holding `environment`, `event`, legacy `nextSceneCastIds:[]`, `choices:{fun,rational,radical}` and `danmaku:[]` (or enabled comments). Standalone `novel_choices` / `novel_danmaku` are no longer requested; legacy readers still parse their old tags. New per-chapter choices are saved on each assistant message because the state tag is stripped from visible prose.
- **Tela participation:** the self is treated as an ordinary active in-world fictional character who can speak, think and react naturally, rather than a silent player placeholder. Their spoken lines and private thoughts follow the same colored `{{HEX|text}}` protocol as the rest of the cast, using their saved theme color.
- **Tela chapter memory:** a dedicated prompt now injects previous STM and LTM as continuity references and requests `<turn_memory>{"stm":"...","ltm":null}</turn_memory>` before `novel_state`. Chapters 1–6 add STM; chapter 7 generates consolidated LTM in the same model response. The Local `stm`, `ltm` and `turnCount` fields remain unchanged; the old summarizer is reserved for missing inline-memory metadata. Legacy archives and edits are preserved.

### Session-specific notes / 会话设定

- Via Lata's **故事手记** and Umbra's **聊天笔记** each edit their own session worldbook. The legacy global worldbook is no longer shown or injected into AI prompts for either mode.
- Officina's **会话指南** replaces the old global Guide and injects development guidance only for the current engineering session. New sessions start empty; the old global value is retained solely for legacy archive compatibility.
- Tela's outline is labeled **SESSION SETTING** because it is stored on the current novel session, not globally.
- Editing a session note uses a local draft. Pressing **保存设定** commits it to session state and shows an in-app themed **保存成功** dialog; closing without saving discards the draft. **Save To Disk** remains a separate manual full-snapshot action, with themed confirmation and outcome dialogs. Previously archived global data is not deleted or silently migrated to a particular session.

### Large-project IDE inspection, opt-in danmaku and debug grouping / 大型项目读取与弹幕设置

- Officina's AI-directed read-only inspection loop now allows up to **20** tool calls, rather than 6. It can page through long source files with numbered line ranges and prioritize relevant files instead of assuming the entire repository must fit into one prompt. A sliding set of source/tool results is retained within a character budget proportional to the configured context window (with an upper cap), so earlier results may be evicted as newer code is inspected. The protected-file and path restrictions remain in force. This does not make one file read unlimited or guarantee the model will understand an entire large repository; additional planning calls consume tokens and time.
- Via Lata and Tela now have an opt-in **趣味弹幕** extension under Settings → AI → 扩展能力, **off by default** and starting at **8** per response. A slider adjusts the count from 1 to 24 with a live numeric readout, persisted in local browser preferences. When enabled, Via Lata requests amusing, scene-specific string comments in `game_state.danmaku`; Tela now puts them directly in `novel_state.danmaku` (with the three next-chapter options under `novel_state.choices`). Legacy standalone `novel_danmaku` and `novel_choices` blocks remain readable. Both feed the existing DanmakuOverlay and hide comments when disabled. Story-state repair also receives the user choice.
- Image generation settings are now shown only while Image Generation is enabled, in its four supported modes. **Debug Mode** is the master display/control for debug subsettings, including its own `显示生图协议标签` switch and the full input/output terminal log toggles. Effective logging is disabled while the master is off. Transition switches and preview controls remain visible regardless.
- The Via Lata suggestion approval modal now portals to `document.body` with a full-screen backdrop, covering both left and right sidebar stacking contexts.
- Story POV guidance has been made independent of any specific user's personal name; no literal-name prohibition is needed to avoid inventing an observer identity.
- Story prompt architecture: Via Lata separates **immersive narrative guidance**, **session role/POV**, **canonical worldline**, **optional extensions** (image, Auto DJ, v2.2 narrative director) and the new single **`src/lib/storyOutputContract.ts`** for all eight `game_state` keys, relation-damping rules, cast routing and next-scene suggestions. The repeated in-prompt cast index and older Lite GALGAME JSON sample were removed. The state-repair endpoint retains its own purpose-built, short extractor prompt.
- Via Lata's dynamic cast dialogue colors are composed by `src/lib/storyColorRendering.ts` instead of the legacy inline `[Text Rendering]` paragraph; the active enabled-world name-to-hex map is still injected at runtime. Extra blank lines at the story narrative/perspective section boundaries have been reduced.
- Via Lata now requests one invisible `<turn_memory>{"stm":"...","ltm":null}</turn_memory>` block per turn, positioned **after story prose and before `<game_state>`**. The first six completed turns each store one STM; on the seventh, the same model response merges the six previous records and current scene into LTM and the app resets the STM cycle. The memory is parsed, hidden from story rendering, and saved to existing Local `stm`/`ltm` fields with no migration. If a provider omits memory metadata, the previous asynchronous summarization remains a compatibility fallback; a failed seventh-turn consolidation retains STM and does not reset the counter before a successful LTM write.
- The memory-vault panels now use distinct solid palettes and labels: Via Lata rose, Umbra pale green (per character), Tela parchment, VIAE blue-gray and Officina light blue (its former engineering memories remain disabled in context-only mode). Older save fields, manual edits and memory slots remain supported.
- Via Lata output order is now **`<thinking>...</thinking>` → optional `<session_title>...</session_title>` on review turns → story prose → `<turn_memory>...</turn_memory>` → trailing `<game_state>...</game_state>`**. The story stream hides complete and in-progress thinking tags; the title parser recognizes the post-thinking title without interpreting prose examples as metadata. Novel `<meta>`-first chapter output is unchanged.
- Story's old blanket prohibition on replying to user input has been replaced with an instruction to **prioritize immersive fiction** while honoring actual story directions. Pacing may vary with the scene rather than staying artificially slow every turn. The opt-in style layer was replaced verbatim with the user's shorter **v2.2** narrative director: two calibration examples instead of three, without changing its mode/repair gating.

### Mode-specific media controls and interruption dialogs / 模式媒体与暂停确认

- Image generation settings and the Image Studio panel are displayed only in **Via Lata (sliding), Tela (novel), Officina (infinite), and Umbra (chat)**. VIAE and the hub hide these controls. The server-side tool planner also accepts `generate_image` in Umbra, so its setting is actionable.
- Pending `<draw>` cards have distinct mode styles: Officina light blue, Via Lata rose, Umbra sage green, and Tela parchment. Image rendering still requires user approval after clicking the card.
- The stop-generation button in ChatInterface, Tela and VIAE now requests confirmation through the shared modal system. Cancelling keeps the model response running; confirming invokes the same abort action as before.
- **Auto DJ is not an AI tool.** Its switch appears only in Via Lata and Tela. When enabled, the current locally indexed playlist is supplied directly to those two modes; a model must choose an exact song name and artist only if appropriate, otherwise set story music to null / omit novel audio tags. Empty playlists must never trigger invented songs. Neither additional tool-planner rounds nor Auto DJ prompts are used in Officina, Umbra, VIAE or the hub.

### AI-selected optional tools / 按需工具调度

- When image generation is enabled in a conversation mode that supports `<draw>`, the text model first receives a **small tool-selection request** listing `generate_image`; the large visualizer instruction block and outfit choices are added to the final prompt only if the model selects that tool. Actual image rendering remains gated behind the user-facing confirmation and the existing `/api/draw` route.
- Officina has a separate **AI 联网搜索工具** switch in **Settings → AI**. Enabled search appears in the planner as `web_search`, but normal turns do not automatically search. The planner can choose image generation, search, both, or neither, with a small bounded number of selection steps. Tool decisions introduce extra model calls; a skipped image/search protocol saves final prompt tokens, not necessarily total request cost.
- **当前模型原生搜索** tries the current conversational provider/model. **指定搜索模型** uses a configured text provider plus a user-entered search model ID; search results are passed as untrusted reference material back into the original conversational model. Gemini uses Google Search grounding; OpenRouter requests the current model-callable `openrouter:web_search` server tool with the native engine and validates cited sources; compatible custom endpoints are asked for their Responses API `web_search` tool. DeepSeek's present endpoint is reported unsupported rather than silently falling back. A tool error is returned to the UI with a clear message, not suppressed.
- Tavily has been removed from the server request path, environment sample and availability checks. Existing saved `webSearch` booleans remain readable; new search routing preferences are stored under `webToolConfig`.
- Custom provider names may be changed in the Settings Center. The overrides are saved to browser Local Storage under `providerAliases` and alter **display labels only**; underlying IDs, environment variable names, API keys, and routing are not changed. Only existing configured providers can be selected for the dedicated web-search route.
- Search providers vary: a configured key and model ID does **not** guarantee that model actually supports native search. Native-only failures are intentionally visible. Do not assume search result text is a trustworthy instruction source.

### Mode-aware transient feedback and activity ordering / 轻反馈与最近会话

- Confirmation, destructive decisions, prompts and IDE diff approvals remain **blocking themed dialogs** managed by `dialog.confirm`, `dialog.prompt` and `dialog.reviewEdits`. Ordinary success, info, warning and failure messages instead use **nonblocking, automatically disappearing feedback** via `dialog.notify(message, {type?, tone?, duration?})`; callers never need to click OK.
- The notifier is part of the root `DialogProvider`, rendered once through a body portal with solid, subtle mode-colored surfaces (Officina light blue, Via Lata rose, Umbra soft green, Tela parchment, VIAE blue-gray, Charta botanical). Only one toast exists at a time; repeated identical events are deduplicated and newer feedback replaces older feedback. The previous page-local green banner and dark toast are removed. `useUI().showToast` forwards to `dialog.notify` for older callers.
- Manual Save To Disk still requires a decision **before overwriting**; "already saved", "save succeeded" and "save failed" then display feedback rather than a second blocking alert. Worldbook save, file actions, archive notices and other status messages follow the same separation.
- Session Explorer uses `updatedAt` to sort recent activity first, including older imported sessions with ID fallback. Unfiled sessions and folder groups are ordered together; a folder's ranking is the latest activity of any session inside it, and sessions *inside* folders are also sorted newest-first. No archive data is reordered or migrated simply to render the list. New messages, session renames, moves and restores refresh their activity timestamp.

### Unified dialogs / 统一弹窗

Destructive confirmations, text input prompts and Officina code-edit review are managed by `DialogProvider` and `useAppDialog` under `src/context/DialogContext.tsx`. All six spaces receive their own color and visual identity (Officina, Via Lata, Umbra, Tela, VIAE and Charta). Native `alert`, `confirm` and `prompt` calls have been replaced with awaitable in-app dialogs. The dialog host portals to `document.body` above full-screen layouts, accepts at most one request at a time (no backlog), and resolves close/escape/cancel consistently. Manual Save To Disk is single-flight from its confirmation through the disk request, so repeated taps cannot enqueue extra confirmations. IDE edit review shows code snippets by file and line, and the server rechecks versions before writing.

Complex feature-specific editors (for example novel archives, worldline editors and Memory Vault) retain their specialized interfaces; the shared manager handles their simple confirmation and notification steps rather than forcing these editors into a generic text prompt.

### Officina response formatting / 工程模式回复显示

- Officina chat bubbles now render standard Markdown, including `**bold**`. Bold text uses a fixed near-black ink (`#17212b`); the other modes keep their respective existing response renderers.
- The display-only `normalizeOfficinaDisplay` helper repairs model prose that accidentally contains literal `\\n` or `\\r\\n` instead of real line breaks. The `formatOfficinaStreamingDisplay` formatter also decodes completed `<ide_edit>` JSON into a readable multiline diff preview and replaces an unfinished edit block with a pending label. Fenced code, inline code, `<file>` and actual edit payloads are not modified; engineering terminal output uses the same presentation formatter without modifying transmitted or stored raw provider content.
- On approved `<ide_edit>` operations, successfully written filenames and operation/line counts are stored in the assistant message's optional `ideEditedFiles` field and shown as a separate blue results card. No extra `**IDE 局部修改成功：**` line is appended to the model reply. Older archive messages without the field remain valid.
- Emoji are permitted in reader-visible reply prose in Officina, Via Lata, Umbra, and VIAE. Tela novel output continues to prohibit emoji. Control markup, machine-readable state, JSON and source code are not decorated with emoji unless specifically requested as a code change.

### AI request and response diagnostics / AI 请求与原文调试

In **Settings → Developer**, **终端输出发送给 AI 的完整请求** (above the response switch) prints the final model request before dispatch: the system instructions, selected conversation history, model and generation parameters. This includes story worldline and memory injected by the backend. For Google Gemini, it displays the actual `systemInstruction`, `startChat.history` and `sendMessageStream` arguments; OpenAI-compatible providers display Chat Completions messages and parameters. API keys are never included.

**终端输出 AI 完整原文** independently logs the raw AI stream (including `<thinking>` and `<game_state>` tags) after completion; interrupted streams are marked accordingly. Both switches are off by default, apply to the Local chat API (including Via Lata state repair and VIAE), and are independent of frontend Debug Mode. Request logs may contain private conversations, story lore or attached image data: do not share terminal logs or run the local server on untrusted networks.

In Via Lata, regenerating the **latest AI reply** or editing the **latest user message** restores the saved pre-turn story state before requesting another answer. This includes protagonist/cast statuses, suggestions, timeline, memories, scene settings, POV lock and the current worldline event; user-authored world/ERA/PERIOD and Charta profiles are preserved. Deleting the latest turn also rewinds its state. **Save to disk manually after deletions or edits**, because incremental auto-sync does not persist destructive changes.

### Via Lata cast routing / 故事登场角色

Once a story worldline is configured, the right sidebar offers a compact **登场角色** picker (up to six characters) editable before the first user turn only. All built-in characters belong to BanG Dream!. Charta characters may optionally bind to an existing world; unbound characters remain world-neutral. Characters bound to another world are available only with the explicit cross-world switch. If a foreign-world character is selected, the AI receives that character's original world description as well as their character biography.

The cast-lookup round decides the complete roster for the **current** generation before any biographies are injected. `<game_state>.sceneCastIds` still identifies characters actually present in the completed scene, while `nextSceneCastIds` remains an archive-compatibility key and no longer predicts the next turn. The UI shows the cast returned by the current tool round; it cannot manually override a later turn. On the first turn any user-selected characters are mandatory, and the model may only add to them. Later rounds may choose zero to six eligible characters. Old archives with `storyNextCastIds` remain readable; new generation no longer treats their contents as persistent pins.

Via Lata's `<game_state>` now requests only live protagonist status (`name`, `timeDesc`, `environment`, `temperature`, `clothing`, `sensation`, `innerState`), scene cast IDs, other characters' relationship/status data, plot suggestions, danmaku, timeline and music. The top-level `environment`, `live2d`, `effect`, `age` and `gender` output requirements are retired. `protagonist.environment` remains visible as **Env** in the story sidebar; pre-existing archive fields remain readable. In participant mode the self is `protagonist` only, never a relationship target in `character[]`.
