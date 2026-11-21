"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, BookOpen, Code2, GitCompareArrows, MessageCircle, PenLine, Route, X } from "lucide-react";
import { createPortal } from "react-dom";

export type DialogTone = "officina" | "story" | "umbra" | "tela" | "viae" | "charta";
export type DialogOptions = { title?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; tone?: DialogTone };
export type IdeDiffOperation = { op: "insert_before" | "insert_after" | "replace" | "delete"; startLine: number; endLine?: number; expected: string; text?: string };
export type IdeDiffFile = { path: string; edits: IdeDiffOperation[] };
type DialogKind = "alert" | "confirm" | "prompt" | "review";
type DialogResponse = boolean | string | null;
type DialogRequest = {
  id: number; kind: DialogKind; message: string; options: DialogOptions; initial?: string; files?: IdeDiffFile[];
  resolve: (response: DialogResponse) => void;
};
type DialogApi = {
  alert: (message: string, options?: DialogOptions) => Promise<void>;
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
  prompt: (message: string, initial?: string, options?: DialogOptions) => Promise<string | null>;
  reviewEdits: (files: IdeDiffFile[]) => Promise<boolean>;
  setTone: (tone: DialogTone) => void;
  tone: DialogTone;
};

const DialogContext = createContext<DialogApi | null>(null);

const palette: Record<DialogTone, { title: string; kicker: string; frame: string; header: string; ink: string; button: string; cancel: string; accent: string }> = {
  officina: {
    title: "OFFICINA", kicker: "ENGINEERING WORKSPACE",
    frame: "border-[#b6cfe8] bg-[#f4f9ff] text-[#243e5d]",
    header: "bg-[#e5f1fe] border-[#c3d8ee]", ink: "text-[#37688f]",
    button: "bg-[#3475bc] hover:bg-[#265f9e] text-white",
    cancel: "border-[#c2d0e1] bg-white text-[#52667e] hover:bg-[#eaf0f7]",
    accent: "border-[#c5d9ee] bg-[#d8eaff]",
  },
  story: {
    title: "VIA LATA", kicker: "STORY NOTES",
    frame: "border-[#deb7cc] bg-[#fff9fc] text-[#68445d]",
    header: "bg-[#ffedf5] border-[#e9cada]", ink: "text-[#a04d7d]",
    button: "bg-[#b65388] hover:bg-[#9e3f74] text-white",
    cancel: "border-[#dfc9d7] bg-white text-[#745b6c] hover:bg-[#f7eaf1]",
    accent: "border-[#eacbdc] bg-[#ffe4f1]",
  },
  umbra: {
    title: "UMBRA", kicker: "CONVERSATION",
    frame: "border-[#b4d7c5] bg-[#f8fffb] text-[#35594b]",
    header: "bg-[#e6f5ec] border-[#c6e0d1]", ink: "text-[#44816a]",
    button: "bg-[#368565] hover:bg-[#277253] text-white",
    cancel: "border-[#c6d9ce] bg-white text-[#566e60] hover:bg-[#edf5f0]",
    accent: "border-[#cce3d7] bg-[#dff2e6]",
  },
  tela: {
    title: "TELA", kicker: "NOVEL STUDIO",
    frame: "border-[#dcc9a9] bg-[#fffcf6] text-[#594b39]",
    header: "bg-[#f2e5cf] border-[#e0cba9]", ink: "text-[#8c683c]",
    button: "bg-[#765034] hover:bg-[#5c3c28] text-white",
    cancel: "border-[#cbb89e] bg-[#ffffff] text-[#695c4d] hover:bg-[#efe8dc]",
    accent: "border-[#dfc9a5] bg-[#fff4dd]",
  },
  viae: {
    title: "VIAE", kicker: "ROUTES & WORLDS",
    frame: "border-[#bfc8df] bg-[#fbfcff] text-[#465373]",
    header: "bg-[#eff2fa] border-[#d4dcef]", ink: "text-[#6379ae]",
    button: "bg-[#6479a6] hover:bg-[#526996] text-white",
    cancel: "border-[#cbd2e3] bg-white text-[#65718b] hover:bg-[#f0f2f8]",
    accent: "border-[#d1dbeb] bg-[#e8effc]",
  },
  charta: {
    title: "CHARTA", kicker: "CHARACTER ARCHIVE",
    frame: "border-[#cfddca] bg-[#fbfdf8] text-[#516a4b]",
    header: "bg-[#eff5eb] border-[#dae7d4]", ink: "text-[#63875b]",
    button: "bg-[#6b8b5d] hover:bg-[#58764b] text-white",
    cancel: "border-[#cdd9c8] bg-white text-[#65725f] hover:bg-[#f0f5ed]",
    accent: "border-[#d9e8d2] bg-[#e8f3e4]",
  },
};

export function useAppDialog(): DialogApi {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error("Dialogs require DialogProvider");
  return dialog;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [tone, setTone] = useState<DialogTone>("officina");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [active, setActive] = useState<DialogRequest | null>(null);
  const [input, setInput] = useState("");
  const activeRef = useRef<DialogRequest | null>(null);
  const nextId = useRef(0);

  // A native confirm blocks additional clicks. Our managed dialogs must provide
  // the same single-flight behavior: NEVER queue requests behind an open dialog.
  // Requests arriving while another dialog is visible are cancelled immediately.
  // Returning a shared Promise instead would run duplicated destructive callbacks.
  const enqueue = useCallback((kind: DialogKind, message: string, options: DialogOptions = {}, initial?: string, files?: IdeDiffFile[]) =>
    new Promise<DialogResponse>(resolve => {
      if (activeRef.current) {
        resolve(kind === "prompt" ? null : false);
        return;
      }
      const item: DialogRequest = { id: ++nextId.current, kind, message, options, initial, files, resolve };
      activeRef.current = item;
      setActive(item);
    }), []);

  const finish = useCallback((accept: boolean, responseText?: string) => {
    const current = activeRef.current;
    if (!current) return;
    // Clear synchronously: double-click/Enter/Escape must not resolve twice.
    activeRef.current = null;
    setActive(null);
    current.resolve(current.kind === "prompt" ? (accept ? responseText ?? "" : null) : accept);
  }, []);

  const api = useMemo<DialogApi>(() => ({
    alert: async (message, options) => { await enqueue("alert", message, options); },
    confirm: async (message, options) => (await enqueue("confirm", message, {
      destructive: /删除|覆盖|放弃|清除|丢失|无法撤销|不可撤销|移除|delete|overwrite/i.test(message),
      ...options,
    })) === true,
    prompt: async (message, initial = "", options) => {
      const result = await enqueue("prompt", message, options, initial);
      return typeof result === "string" ? result : null;
    },
    reviewEdits: async files => (await enqueue("review", "", { title: "审阅 IDE 代码修改", confirmLabel: "应用全部修改", cancelLabel: "取消修改", tone: "officina" }, undefined, files)) === true,
    setTone,
    tone,
  }), [enqueue, tone]);

  useEffect(() => { setInput(active?.initial || ""); }, [active?.id]);
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); finish(false); }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active, finish]);

  const currentTone = active?.options.tone || tone;
  const theme = palette[currentTone];
  const Icon = currentTone === "officina" ? Code2 : currentTone === "story" ? BookOpen
    : currentTone === "umbra" ? MessageCircle : currentTone === "tela" ? PenLine
      : currentTone === "viae" ? Route : BookOpen;

  return (
    <DialogContext.Provider value={api}>
      {children}
      {mounted && active && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-[#070c19]/75 p-3 backdrop-blur-[6px] sm:p-6"
          style={{ zIndex: 2147483647, pointerEvents: "auto" }}
          onMouseDown={event => { if (event.target === event.currentTarget) finish(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="shiorivia-dialog-title"
            className={`flex w-full flex-col overflow-hidden rounded-2xl border shadow-[0_35px_100px_rgba(0,0,0,.4)] ${theme.frame} ${active.kind === "review" ? "max-w-5xl max-h-[92dvh]" : "max-w-lg max-h-[90dvh]"}`}>
            <header className={`flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4 ${theme.header}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className={`rounded-xl border p-2 ${theme.accent}`}>{active.options.destructive ? <AlertTriangle size={18} className="text-rose-500"/> : <Icon size={18} className={theme.ink}/>}</div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold tracking-[0.19em] ${theme.ink}`}>{theme.title} · {theme.kicker}</p>
                  <h2 id="shiorivia-dialog-title" className="mt-1 text-base font-semibold">{active.options.title || (active.kind === "alert" ? "提示" : active.kind === "prompt" ? "输入内容" : active.kind === "review" ? "审阅代码修改" : "操作确认")}</h2>
                </div>
              </div>
              <button type="button" aria-label="关闭弹窗" onClick={() => finish(false)} className="rounded-lg p-2 opacity-60 transition hover:bg-black/10 hover:opacity-100"><X size={18}/></button>
            </header>
            <div className="min-h-0 overflow-y-auto px-5 py-5">
              {active.message && <p className="whitespace-pre-wrap break-words text-sm leading-7">{active.message}</p>}
              {active.kind === "prompt" && (
                <input autoFocus aria-label={active.options.title || "输入内容"} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); finish(true, input); } }}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-300"/>
              )}
              {active.kind === "review" && (
                <div className="space-y-4">
                  <p className="text-xs text-[#536b86]">修改只作用于绑定的 IDE 项目。下方展示每一处变更，确认后还会再次校验文件版本。</p>
                  {(active.files || []).map(file => (
                    <section key={file.path} className="overflow-hidden rounded-xl border border-[#bdd4eb] bg-white">
                      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#bdd4eb] bg-[#e6f2fd] px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2"><GitCompareArrows size={15} className="text-[#5081b6]"/><span className="truncate font-mono text-xs text-[#294f78]">{file.path}</span></div>
                        <span className="text-[10px] text-[#607e9e]">{file.edits.length} 处修改</span>
                      </header>
                      <div className="space-y-3 px-3 py-3">
                        {file.edits.map((edit, index) => (
                          <div key={index} className="overflow-hidden rounded-lg border border-[#d6e2ee]">
                            <div className="bg-[#f1f6fc] px-3 py-1.5 text-[11px] text-[#59718e]">
                              {edit.op === "insert_before" ? "在行前插入" : edit.op === "insert_after" ? "在行后插入" : edit.op === "replace" ? "替换" : "删除"}
                              {" · L"}{edit.startLine}{edit.endLine && edit.endLine !== edit.startLine ? `–${edit.endLine}` : ""}
                            </div>
                            <pre className={`overflow-x-auto whitespace-pre p-3 font-mono text-xs leading-5 ${edit.op.startsWith("insert_") ? "bg-[#f0f6fc] text-[#496786]" : "bg-[#fff0f0] text-[#a34b54]"}`}>{edit.expected.split("\n").map((line, i) => <span key={i} className="block">{edit.op.startsWith("insert_") ? "  " : "- "}{line || " "}</span>)}</pre>
                            {edit.text !== undefined && <pre className="overflow-x-auto whitespace-pre border-t border-[#cce4d6] bg-[#edf9f1] p-3 font-mono text-xs leading-5 text-[#24764e]">{edit.text.split("\n").map((line, i) => <span key={i} className="block">+ {line || " "}</span>)}</pre>}
                            {(edit.op === "insert_before" || edit.op === "insert_after") && <div className="bg-[#f1f6fc] px-3 py-1 text-[10px] text-[#607f9b]">蓝色行是定位锚点，不会被删除。</div>}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
            <footer className={`flex shrink-0 justify-end gap-2 border-t px-5 py-4 ${theme.header}`}>
              {active.kind !== "alert" && <button type="button" onClick={() => finish(false)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${theme.cancel}`}>{active.options.cancelLabel || "取消"}</button>}
              <button type="button" autoFocus={active.kind !== "prompt"} onClick={() => finish(true, input)}
                className={`rounded-xl px-5 py-2 text-xs font-semibold shadow-sm transition ${active.options.destructive ? "bg-rose-700 text-white hover:bg-rose-600" : theme.button}`}>
                {active.options.confirmLabel || (active.kind === "alert" ? "知道了" : active.kind === "prompt" ? "确定" : "确认")}
              </button>
            </footer>
          </section>
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  );
}
