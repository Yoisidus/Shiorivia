"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen, Bug, Globe2, Image as ImageIcon, Mic, Music2,
  Settings2, Sparkles, X,
} from "lucide-react";
import type { PublicLocalProvider } from "../lib/localProviders";
import type { ImageSettings, ProviderCapability } from "../lib/imageSettings";
import type { WebToolConfig } from "../lib/webToolSettings";
import { capabilityFor } from "../lib/imageSettings";
import { useLanguage } from "../context/LanguageContext";
import { useAppDialog } from "../context/DialogContext";
import { LANGUAGE_OPTIONS, type Locale } from "../lib/locale";
import { CONTEXT_WINDOW_OPTIONS, type ContextWindowTokens } from "../lib/contextWindow";

import { useMusic } from "../context/MusicContext";

export type SettingKey = "webSearch" | "imageGen" | "tts" | "musicControl";
export type StoryTheme = "sky" | "sage" | "rose";

type Props = {
  open: boolean;
  onClose: () => void;
  values: Record<SettingKey, boolean>;
  onToggle: (key: SettingKey) => void;
  debugMode: boolean;
  onToggleDebug: () => void;
  debugDrawTagsEnabled: boolean;
  onToggleDebugDrawTags: () => void;
  danmakuEnabled: boolean;
  onToggleDanmaku: () => void;
  danmakuCount: number;
  onDanmakuCountChange: (count: number) => void;
  terminalRequestLogEnabled: boolean;
  onToggleTerminalRequestLog: () => void;
  terminalLogEnabled: boolean;
  onToggleTerminalLog: () => void;
  engineeringTransitionEnabled: boolean;
  onToggleEngineeringTransition: () => void;
  curtainTransitionEnabled: boolean;
  onToggleCurtainTransition: () => void;
  geminiNarrativeStyleEnabled: boolean;
  onToggleGeminiNarrativeStyle: () => void;
  engineeringLoreRelationshipsEnabled: boolean;
  engineeringLoreExperiencesEnabled: boolean;
  onToggleEngineeringLoreRelationships: () => void;
  onToggleEngineeringLoreExperiences: () => void;
  onTestEffect: (name: "rain" | "curtain" | "parchment" | "math" | "glitch") => void;
  isStory: boolean;
  activeMode: "infinite" | "sliding" | "novel" | "chat" | "lime" | "hub";
  contextWindowTokens: ContextWindowTokens;
  onContextWindowChange: (value: ContextWindowTokens) => void;
  storyTheme: StoryTheme;
  onStoryThemeChange: (value: StoryTheme) => void;
  activeProvider: string;
  providers: PublicLocalProvider[];
  disabledProviders: string[];
  onToggleProvider: (id: string) => void;
  autoSync: boolean;
  autoSyncInterval: 3 | 4 | 5;
  onAutoSyncChange: (enabled: boolean) => void;
  onAutoSyncIntervalChange: (turns: 3 | 4 | 5) => void;
  webToolConfig: WebToolConfig;
  onWebToolConfigChange: (changes: Partial<WebToolConfig>) => void;
  providerAliases: Record<string, string>;
  onProviderAliasChange: (id: string, label: string) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (changes: Partial<ImageSettings>) => void;
  providerCapabilities: Record<string, ProviderCapability>;
  onProviderCapabilitiesChange: (id: string, changes: Partial<ProviderCapability>) => void;
  falConfigured: boolean;
};

type Tab = "general" | "ai" | "media" | "developer";

const tabs = [
  { id: "general", labelKey: "settings.general", icon: Settings2 },
  { id: "ai", labelKey: "settings.ai", icon: Globe2 },
  { id: "media", labelKey: "settings.media", icon: Music2 },
  { id: "developer", labelKey: "settings.developer", icon: Bug },
] as const;

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px w-5 bg-[#91a79c]" />
      <h3 className="shrink-0 text-xs font-bold tracking-widest text-[#3d6657]">{children}</h3>
      <div className="h-px flex-1 bg-[#dce5df]" />
    </div>
  );
}

function SwitchRow({ title, description, checked, onClick, icon: Icon }: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
  icon: typeof Music2;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-4 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon size={17} /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={onClick} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#5c927b]" : "bg-slate-200"}`}>
        <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export function SettingsCenter({ open, onClose, values, onToggle, debugMode, onToggleDebug, debugDrawTagsEnabled, onToggleDebugDrawTags, danmakuEnabled, onToggleDanmaku, danmakuCount, onDanmakuCountChange, terminalRequestLogEnabled, onToggleTerminalRequestLog, terminalLogEnabled, onToggleTerminalLog, engineeringTransitionEnabled, onToggleEngineeringTransition, curtainTransitionEnabled, onToggleCurtainTransition, geminiNarrativeStyleEnabled, onToggleGeminiNarrativeStyle, engineeringLoreRelationshipsEnabled, engineeringLoreExperiencesEnabled, onToggleEngineeringLoreRelationships, onToggleEngineeringLoreExperiences, onTestEffect, isStory, activeMode, contextWindowTokens, onContextWindowChange, storyTheme, onStoryThemeChange, activeProvider, providers, disabledProviders, onToggleProvider, autoSync, autoSyncInterval, onAutoSyncChange, onAutoSyncIntervalChange, webToolConfig, onWebToolConfigChange, providerAliases, onProviderAliasChange, imageSettings, onImageSettingsChange, providerCapabilities, onProviderCapabilitiesChange, falConfigured }: Props) {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const { refreshLibrary, allTracks } = useMusic();
  const [scanningMusic, setScanningMusic] = useState(false);
  const [scanNotice, setScanNotice] = useState("");
  const scanMusic = async () => {
    if (scanningMusic || !await dialog.confirm("扫描 Shiorivia/music/ 中的音乐与同名 .lrc？\n这会更新本地曲库索引，不会移动或修改音乐文件。")) return;
    setScanningMusic(true); setScanNotice("");
    try {
      const response = await fetch("/api/local/music", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "音乐扫描失败");
      await refreshLibrary();
      setScanNotice(`已扫描 ${result.count} 首歌曲，歌单已更新。`);
    } catch (error) { setScanNotice(error instanceof Error ? error.message : "音乐扫描失败"); }
    finally { setScanningMusic(false); }
  };
  const { t, locale, setLocale } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={t("settings.title")} className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcfb] text-slate-700 shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><Settings2 size={20} className="text-[#517d69]" /><div><h2 className="text-lg font-bold">{t("settings.title")}</h2><p className="text-[11px] text-slate-400">Shiorivia · Local</p></div></div>
          <button type="button" onClick={onClose} aria-label={t("settings.close")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav aria-label={t("settings.categories")} className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-[#f5f8f6] p-2 md:w-[216px] md:flex-col md:border-b-0 md:border-r md:p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition md:w-full ${activeTab === tab.id ? "bg-white text-[#376c54] shadow-sm ring-1 ring-emerald-100" : "text-slate-500 hover:bg-white/60"}`}>
                  <Icon size={16} /> {t(tab.labelKey)}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
            {activeTab === "general" && (
              <section>
                <h2 className="mb-2 text-xl font-bold">{t("settings.general")}</h2>
                <p className="mb-5 text-sm text-slate-400">{t("settings.general.description")}</p>
                <div className="mb-7 rounded-xl border border-slate-200 bg-white p-4">
                  <label htmlFor="shiorivia-language" className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#376c54]"><Globe2 size={16} />{t("settings.language")}</label>
                  <select id="shiorivia-language" value={locale} onChange={e => setLocale(e.target.value as Locale)} className="w-full rounded-lg border border-slate-200 bg-[#fbfcfb] px-3 py-2 text-sm text-slate-700 focus:border-[#81a58f] focus:outline-none">
                    {LANGUAGE_OPTIONS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{t("settings.language.description")}</p>
                </div>
                <div className="mb-7 rounded-xl border border-slate-200 bg-white p-4">
                  <label htmlFor="shiorivia-context-window" className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <BookOpen size={16} /> 默认上下文窗口
                  </label>
                  <select id="shiorivia-context-window" value={contextWindowTokens}
                    onChange={event => onContextWindowChange(Number(event.target.value) as ContextWindowTokens)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400">
                    {CONTEXT_WINDOW_OPTIONS.map(tokens => <option key={tokens} value={tokens}>
                      {tokens / 1024}K Token{tokens === 32768 ? " · 默认" : ""}
                    </option>)}
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    所有模式通用。按 Token 预算优先保留连续的近期对话，不再按固定消息数量截断；
                    故事、小说、聊天和 VIAE 继续使用记忆档案。窗口包含系统提示与输出预留空间。
                    实际上限仍受所选模型与供应商限制，较大窗口可能增加费用。
                  </p>
                </div>
                {isStory ? (
                  <>
                    <SectionTitle>{t("settings.storyTheme")}</SectionTitle>
                    <p className="mb-3 text-xs text-slate-500">{t("settings.storyTheme.description")}</p>
                    <div className="mb-8 flex flex-wrap gap-3">
                      {([
                        { id: "sky", name: t("settings.sky"), swatch: "bg-[#e0f2fe]" },
                        { id: "sage", name: t("settings.sage"), swatch: "bg-[#b7d3b0]" },
                        { id: "rose", name: t("settings.rose"), swatch: "bg-[#f4c6d2]" },
                      ] as const).map((option) => (
                        <button key={option.id} type="button" aria-pressed={storyTheme === option.id} onClick={() => onStoryThemeChange(option.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${storyTheme === option.id ? "border-[#65927c] bg-[#edf6ef] text-[#366b54]" : "border-slate-200 bg-white text-slate-500"}`}>
                          <span className={`h-4 w-4 rounded-full border border-black/5 ${option.swatch}`} /> {option.name}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mb-7 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-500">{t("settings.storyTheme.unavailable")}</div>
                )}
                <SectionTitle>{t("settings.data")}</SectionTitle>
                <div className="mb-6 rounded-2xl border border-[#dce7de] bg-white p-5">
                  <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold text-[#345b48]">自动增量同步</h3><p className="mt-2 text-xs leading-5 text-slate-500">默认关闭。仅在完整对话达到设定轮数后追加新消息；删除和编辑仍需手动保存。</p></div><button type="button" role="switch" aria-checked={autoSync} aria-label="自动增量同步" onClick={() => onAutoSyncChange(!autoSync)} className={`h-6 w-11 shrink-0 rounded-full p-1 transition ${autoSync ? "bg-[#5c927b]" : "bg-slate-200"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition ${autoSync ? "translate-x-5" : ""}`}/></button></div>
                  <label className="mt-4 block text-xs text-[#61786d]">每隔多少轮完整对话同步<select disabled={!autoSync} value={autoSyncInterval} onChange={e => onAutoSyncIntervalChange(Number(e.target.value) as 3 | 4 | 5)} className="mt-2 block w-full rounded-xl border border-[#dce7de] bg-[#f9fbf9] px-3 py-2 text-sm disabled:opacity-40"><option value={3}>3 轮</option><option value={4}>4 轮 · 默认</option><option value={5}>5 轮</option></select></label>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-500">
                  <BookOpen size={17} className="mt-0.5 shrink-0 text-[#65927c]" />
                  <span>{t("settings.data.description")}</span>
                </div>
              </section>
            )}

            {activeTab === "ai" && (
              <section>
                <h2 className="mb-2 text-xl font-bold">{t("settings.ai")}</h2>
                <p className="mb-8 text-sm text-slate-400">{t("settings.ai.description")}</p>
                <SectionTitle>通用模型 · {t("settings.providers")}</SectionTitle>
                <div className="mb-7 space-y-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold">{provider.label} {provider.id === "fal" && <span className="ml-2 text-[10px] font-normal text-[#71917d]">IMAGE ONLY</span>} {provider.id !== "fal" && activeProvider === provider.id && <span className="ml-1 text-[10px] text-emerald-600">{t("settings.active")}</span>}</p>
                        <p className="mt-1 text-xs text-slate-400">{provider.configured ? t("settings.configured") : t("settings.unconfigured")}{" · "}{provider.custom ? t("settings.custom") : t("settings.default")}</p>
                      </div>
                      {provider.custom && <label className="block mt-2 max-w-[250px] text-[11px] text-slate-500">自定义供应商显示名称（仅本地 UI）
                        <input aria-label={`${provider.id} 显示名称`} value={providerAliases[provider.id] || ""}
                          onChange={event => onProviderAliasChange(provider.id, event.target.value)}
                          placeholder={provider.id} maxLength={40}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-[#8ea9cd]" />
                      </label>}
                      {provider.custom && <div className="flex shrink-0 gap-2 text-[11px] text-slate-600"><label className="flex items-center gap-1"><input type="checkbox" checked={capabilityFor(provider.id, providerCapabilities).llm} onChange={e => onProviderCapabilitiesChange(provider.id, { llm: e.target.checked })}/>LLM</label><label className="flex items-center gap-1"><input type="checkbox" checked={capabilityFor(provider.id, providerCapabilities).image} onChange={e => onProviderCapabilitiesChange(provider.id, { image: e.target.checked })}/>生图</label></div>}
                      <button type="button" disabled={!provider.configured} aria-pressed={!disabledProviders.includes(provider.id)} onClick={() => onToggleProvider(provider.id)}
                        className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold ${disabledProviders.includes(provider.id) ? "border-slate-200 bg-slate-50 text-slate-400" : "border-emerald-200 bg-emerald-50 text-emerald-700"} disabled:opacity-40`}>
                        {disabledProviders.includes(provider.id) ? t("settings.disabled") : t("settings.enabled")}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mb-6 text-xs leading-6 text-slate-500">{t("settings.providers.description")}</p>
                <SectionTitle>扩展能力 · EXTENSIONS</SectionTitle>
                {(activeMode === "sliding" || activeMode === "novel") && <>
                  <SwitchRow title="趣味弹幕" description="默认关闭。开启后 AI 为本轮故事或小说生成有趣、贴合场景的虚拟观众弹幕，不参与剧情或角色对话。" checked={danmakuEnabled} onClick={onToggleDanmaku} icon={Sparkles} />
                  {danmakuEnabled && <div className="mb-4 flex items-center gap-4 rounded-xl border border-amber-200 bg-[#fffaf0] p-4">
                    <label htmlFor="danmaku-count" className="min-w-0 flex-1 text-xs font-medium text-[#745a3d]">每轮弹幕数量（1–24 条）</label>
                    <input id="danmaku-count" aria-label="弹幕数量" type="number" min={1} max={24} step={1}
                      value={danmakuCount}
                      onChange={event => onDanmakuCountChange(Math.max(1, Math.min(24, Math.round(Number(event.target.value) || 1))))}
                      className="w-20 rounded-lg border border-[#e0cba9] bg-white px-3 py-2 text-center text-sm text-[#745a3d]" />
                  </div>}
                </>}
                {(activeMode === "sliding" || activeMode === "novel") && <SwitchRow
                  title="文风优化"
                  description="参考 Gemini 与日轻文风优化叙事节奏。作用于 Via Lata 故事正文及 Tela 小说正文，不改变角色设定、世界线、状态 JSON、修复请求或摘要；默认关闭。"
                  checked={geminiNarrativeStyleEnabled}
                  onClick={onToggleGeminiNarrativeStyle}
                  icon={BookOpen}
                />}

                {activeMode === "infinite" && <div className="mt-3 space-y-2">
                  <div className="px-1">
                    <p className="text-xs font-semibold text-slate-700">Officina · 角色工程师设定</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">基础性格与角色还原指南始终加载；以下扩展资料默认关闭，可按需要独立开启。</p>
                  </div>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white px-3">
                    <SwitchRow title="核心人物关系" description="附加全时间线的重要关系与互动记录，增加 Token 用量。" checked={engineeringLoreRelationshipsEnabled} onClick={onToggleEngineeringLoreRelationships} icon={BookOpen} />
                    <SwitchRow title="主要经历" description="附加全时间线的主要事件与角色经历，增加 Token 用量。" checked={engineeringLoreExperiencesEnabled} onClick={onToggleEngineeringLoreExperiences} icon={BookOpen} />
                  </div>
                </div>}
                {activeMode === "infinite" && <>
                  <SwitchRow title="Officina · AI 联网搜索工具" description="开启后，AI 会先判断当前对话是否需要检索；只有选择联网工具时才请求搜索供应商。未配置或模型不支持时明确报错，不会静默切换搜索引擎。" checked={values.webSearch} onClick={() => onToggle("webSearch")} icon={Globe2} />
                  {values.webSearch && <div className="mt-2 mb-5 space-y-3 rounded-xl border border-sky-200 bg-[#f5f9ff] p-4">
                    <p className="text-xs font-semibold text-[#3b6589]">搜索路由</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button type="button" aria-pressed={webToolConfig.mode === "native"}
                        onClick={() => onWebToolConfigChange({mode:"native"})}
                        className={`rounded-lg border px-3 py-3 text-left text-xs ${webToolConfig.mode === "native" ? "border-blue-400 bg-white font-semibold text-[#275b94]" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        当前模型原生联网搜索
                        <span className="mt-1 block text-[10px] font-normal">尝试当前对话供应商与模型的搜索能力，不支持则报错。</span>
                      </button>
                      <button type="button" aria-pressed={webToolConfig.mode === "model"}
                        onClick={() => onWebToolConfigChange({mode:"model"})}
                        className={`rounded-lg border px-3 py-3 text-left text-xs ${webToolConfig.mode === "model" ? "border-blue-400 bg-white font-semibold text-[#275b94]" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        指定搜索模型
                        <span className="mt-1 block text-[10px] font-normal">使用另一已配置供应商和手动填写的模型 ID。</span>
                      </button>
                    </div>
                    {webToolConfig.mode === "model" && <>
                      <label className="block text-xs text-slate-600">搜索供应商
                        <select value={webToolConfig.provider} onChange={e => onWebToolConfigChange({provider:e.target.value})}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                          {providers.filter(provider => provider.configured && provider.id !== "fal" && !disabledProviders.includes(provider.id)).map(provider =>
                            <option key={provider.id} value={provider.id}>{provider.label}</option>)}
                        </select>
                      </label>
                      <label className="block text-xs text-slate-600">搜索模型 ID
                        <input value={webToolConfig.model} onChange={e => onWebToolConfigChange({model:e.target.value})}
                          placeholder="例如支持原生联网搜索的模型 ID" maxLength={160}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
                      </label>
                    </>}
                    <p className="text-[11px] leading-5 text-slate-500">只有当前模型或指定模型具备兼容的联网接口时才能成功。AI 选择搜索之后，结果会作为参考资料提供给当前回复。</p>
                  </div>}
                </>}
                {(["sliding", "novel", "infinite", "chat"].includes(activeMode)) && <>
                <SwitchRow title={t("settings.imageGen")} description={t("settings.imageGen.description")} checked={values.imageGen} onClick={() => onToggle("imageGen")} icon={ImageIcon} />
                {values.imageGen && <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-wide text-slate-700">Image Studio · 生图设置</p>
                  <label className="block text-xs text-slate-600">图像供应商<select value={imageSettings.provider} onChange={e => onImageSettingsChange({provider: e.target.value})} className="mt-1 block w-full rounded-lg border bg-white p-2 text-sm">
                    <option value="comfyui">ComfyUI · Local</option>
                    {falConfigured && !disabledProviders.includes("fal") && <option value="fal">fal.ai</option>}
                    {providers.filter(p => p.configured && (p.id === 'google' || p.id === 'openrouter' || (p.custom && capabilityFor(p.id, providerCapabilities).image))).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select></label>
                  <label className="block text-xs text-slate-600">{imageSettings.provider === "comfyui" ? "模板 Checkpoint（可选；自定义工作流以 ComfyUI 为准）" : "生图模型 ID"}<input value={imageSettings.model} onChange={e => onImageSettingsChange({model:e.target.value})} placeholder={imageSettings.provider === "comfyui" ? "可留空，使用 ComfyUI 工作流的模型" : "请输入供应商模型 ID"} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/40 p-2 text-sm text-slate-700 outline-none focus:border-slate-400"/></label>
                  {imageSettings.provider !== "comfyui" && <div className="space-y-3">
                  <label className="block text-xs text-slate-600">正面风格提示词<textarea rows={2} value={imageSettings.positive} onChange={e => onImageSettingsChange({positive:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/40 p-2 text-sm text-slate-700 outline-none focus:border-slate-400"/></label>
                  <label className="block text-xs text-slate-600">负面提示词<textarea rows={2} value={imageSettings.negative} onChange={e => onImageSettingsChange({negative:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/40 p-2 text-sm text-slate-700 outline-none focus:border-slate-400"/></label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {([['width','宽度'],['height','高度'],['steps','步数'],['cfg','CFG']] as const).map(([key,label]) => <label key={key} className="text-xs text-slate-600">{label}<input type="number" min={1} max={2048} value={imageSettings[key]} onChange={e => onImageSettingsChange({[key]:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/40 p-2 text-sm text-slate-700 outline-none focus:border-slate-400"/></label>)}
                  </div>
                  </div>}
                  <p className="text-[11px] leading-5 text-slate-500">ComfyUI 从 API 工作流读取模型、CLIP、KSampler 和尺寸；Shiorivia 只填入 {"{{SHIORIVIA_SCENE}}"}。保存至 data_storage/comfyui-workflow.json。</p>
                </div>}
                </>}
              </section>
            )}

            {activeTab === "media" && (
              <section>
                <h2 className="mb-2 text-xl font-bold">{t("settings.media")}</h2>
                <p className="mb-8 text-sm text-slate-400">{t("settings.media.description")}</p>
                <SectionTitle>{t("settings.voiceAndMusic")}</SectionTitle>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400"><Mic size={18}/><span>{t("settings.tts")} · 开发中 / In development</span></div>
                {(activeMode === "sliding" || activeMode === "novel") && <SwitchRow
                  title={t("settings.autoDJ")}
                  description="开启后，把当前歌单提供给故事／小说模型。只有找到适合场景的歌曲才输出音乐配置；没有合适曲目则保持为空，不进行额外工具轮询。"
                  checked={values.musicControl} onClick={() => onToggle("musicControl")} icon={Music2}
                />}
                <div className="mt-6 rounded-2xl border border-[#dfE8df] bg-white p-5">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold text-[#345b48]">本地音乐 · 扫描曲库</h3><p className="mt-2 text-xs leading-6 text-slate-500">扫描项目根目录 music/ 中的歌曲与同名歌词。子文件夹自动成为歌单与子歌单，重复扫描更新配置。</p></div><Music2 size={19} className="shrink-0 text-[#8ca58f]"/></div>
                  <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={scanningMusic} onClick={() => void scanMusic()} className="rounded-xl border border-[#bed1c2] bg-[#edf5ef] px-4 py-2 text-xs font-semibold text-[#416952] transition hover:bg-[#e1eee4] disabled:opacity-50">{scanningMusic ? "扫描中…" : "扫描本地音乐"}</button><span className="text-xs text-slate-400">当前曲库：{allTracks.filter(track => track.id.startsWith("local_")).length} 首本地歌曲</span></div>
                  {scanNotice && <p role="status" className="mt-3 text-xs leading-6 text-[#607866]">{scanNotice}</p>}
                  <p className="mt-3 text-[11px] leading-5 text-slate-400">建议采用「歌手 - 歌名」命名；冷门或较新的歌曲可能不被 AI 熟悉。封面提取失败时使用默认唱片。</p>
                </div>
              </section>
            )}

            {activeTab === "developer" && (
              <section>
                <h2 className="mb-2 text-xl font-bold">{t("settings.developer")}</h2>
                <p className="mb-8 text-sm text-slate-400">{t("settings.developer.description")}</p>
                <SectionTitle>{t("settings.debugging")}</SectionTitle>
                <SwitchRow title="Debug Mode" description={t("settings.debug.description")} checked={debugMode} onClick={onToggleDebug} icon={Bug} />
                {debugMode && <>
                <SwitchRow title="显示生图协议标签" description="在故事、小说或工程回复中显示生图指令与请求参数。只用于调试，不影响生图功能本身。" checked={debugDrawTagsEnabled} onClick={onToggleDebugDrawTags} icon={ImageIcon} />
                <SwitchRow title="终端输出发送给 AI 的完整请求" description="默认关闭；在 Node.js 终端查看最终 System Prompt、对话内容及模型参数（不含 API Key）。可能包含私密设定、对话和图片数据。" checked={terminalRequestLogEnabled} onClick={onToggleTerminalRequestLog} icon={Bug} />
                <SwitchRow title="终端输出 AI 完整原文" description="默认关闭；开启后在运行 Shiorivia 的终端打印模型的完整流式原文（包括隐藏标签与状态 JSON）。可能包含私人对话，请勿分享终端日志。" checked={terminalLogEnabled} onClick={onToggleTerminalLog} icon={Bug} />
                </>}
                <SwitchRow title={t("settings.transition")} description={t("settings.transition.description")} checked={engineeringTransitionEnabled} onClick={onToggleEngineeringTransition} icon={Sparkles} />
                <SwitchRow title="Tela 羊皮纸卷轴转场" description="进入或退出小说模式时展开羊皮纸卷轴。原幕布动画仍可在下方预览；关闭后直接切换界面。" checked={curtainTransitionEnabled} onClick={onToggleCurtainTransition} icon={Sparkles} />
                <SectionTitle>{t("settings.preview")}</SectionTitle>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    { id: "rain", label: "Rain" },
                    { id: "curtain", label: "Curtain" },
                    { id: "parchment", label: "Parchment" },
                    { id: "math", label: "Math" },
                    { id: "glitch", label: "Glitch" },
                  ] as const).map((effect) => (
                    <button key={effect.id} type="button" onClick={() => { onClose(); onTestEffect(effect.id); }} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50">
                      <Sparkles size={14} /> {effect.label}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-right text-[11px] text-slate-400 sm:px-6">Shiorivia · Settings</footer>
      </div>
    </div>
  );
}
