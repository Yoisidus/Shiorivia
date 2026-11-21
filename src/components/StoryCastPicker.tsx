"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, LockKeyhole, UsersRound, X } from "lucide-react";
import { CHAR_DATA } from "../data/char_config";
import type { ChartaCharacter } from "../lib/charta";
import type { ChartaWorld } from "../lib/chartaWorld";
import { nameForCharta } from "../lib/charta";
import { BANG_DREAM_WORLD_ID, BANG_DREAM_WORLD_NAME, parseStoryWorldline } from "../lib/storyWorldline";
import { MAX_STORY_CAST, selectStoryCastIds, storyCastAllowed, storyCastOrigin } from "../lib/storyCast";
import type { Session } from "../types";
import { useLanguage } from "../context/LanguageContext";


type CastOption = { id: string; name: string; origin: string | null; color: string };

export function StoryCastPicker({ session, worlds, customCharacters, busy, onApply, mode = "story", tone = "sage" }: {
  session: Session;
  worlds: ChartaWorld[];
  customCharacters: ChartaCharacter[];
  busy: boolean;
  onApply: (ids: string[], allowCrossWorld: boolean) => void;
  mode?: "story" | "novel";
  tone?: "sage" | "paper";
}) {
  const { locale } = useLanguage();
  const novel = mode === "novel";

  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const world = parseStoryWorldline(session.storyWorldline);
  const started = session.messages.some(message => message.role === "user");
  const catalog = useMemo<CastOption[]>(() => [
    ...CHAR_DATA.map(char => ({ id: char.id, name: char.name, color: char.hex, origin: BANG_DREAM_WORLD_ID })),
    ...customCharacters.map(char => ({ id: char.id, name: nameForCharta(char, locale), color: char.hex, origin: storyCastOrigin(char) })),
  ], [customCharacters, locale]);
  const currentIds = session.storyNextCastIds ?? (mode === "novel" ? session.novelDraft?.selectedCharIds : session.sceneCastIds) ?? [];
  const available = catalog.filter(char => world && storyCastAllowed({ id: char.id, worldId: char.origin }, world));
  const allowedIds = new Set(available.map(char => char.id));
  const chosen = selectStoryCastIds(currentIds, new Set(catalog.map(char => char.id)));
  const names = chosen.map(id => catalog.find(char => char.id === id)?.name).filter(Boolean);
  useEffect(() => { setOpen(false); }, [session.id]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const begin = () => {
    if (!world || busy) return;
    setDraftIds([...chosen]);
    setOpen(true);
  };
  const toggle = (id: string) => {
    setDraftIds(current => current.includes(id) ? current.filter(item => item !== id)
      : current.length < MAX_STORY_CAST ? [...current, id] : current);
  };
  const apply = () => {
    const selected = selectStoryCastIds(draftIds, allowedIds);
    onApply(selected, world?.crossWorld?.enabled === true);
    setOpen(false);
  };
  const worldTitle = (id: string | null) => !id ? "通用 · 未绑定" : id === BANG_DREAM_WORLD_ID
    ? BANG_DREAM_WORLD_NAME : worlds.find(item => item.id === id)?.name || "未知世界观";

  return <>
    <section className={`rounded-xl border p-3 ${tone === "paper" ? "border-[#d6c29b] bg-[#fffaf0]" : "border-[#eebfcf] bg-[#fff6fa]"}`}>
      <button type="button" disabled={!world || busy} onClick={begin}
        className="flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={started ? "查看本轮登场角色" : "选择首轮登场角色"}>
        <span className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${tone === "paper" ? "text-[#765b36]" : "text-[#b13f67]"}`}>
          {world && !started ? <UsersRound size={15} /> : <LockKeyhole size={15} />}
          登场角色 · CAST
        </span>
        <span className="flex items-center gap-1 text-[11px] text-[#7a9582]">{chosen.length} / {MAX_STORY_CAST}<ChevronRight size={13}/></span>
      </button>
      <p className="mt-2 text-[11px] leading-5 text-[#849588]">
        {!world ? "请先配置世界线以解锁" : names.length ? names.join(" · ") : started ? "本轮没有指定登场角色" : "首轮可不选角色，由 AI 自行决定"}
      </p>
      {world && started && mode === "story" && <p className="mt-1 text-[10px] text-[#a28c6f]">之后每轮由 AI 自行选择全部登场角色，用户首轮选择不会持续锁定。</p>}
      {world && mode === "novel" && <p className="mt-1 text-[10px] text-[#927b57]">{started ? "后续每章由 AI 独立决定全部登场角色。" : "首章可选择必登场角色，也可留空。AI 只会增量补充所选名单。"}</p>}
    </section>
    {typeof document !== "undefined" && createPortal(<AnimatePresence>
      {open && world && <motion.div className={`fixed inset-0 ${novel ? "z-[800]" : "z-[200]"} flex items-center justify-center bg-[#152a20]/35 p-4`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <motion.div initial={{ y: 10, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: .98 }}
            role="dialog" aria-modal="true" aria-label={started ? "本轮登场角色" : "首轮登场角色"}
            className={`flex max-h-[85vh] w-full max-w-[430px] flex-col overflow-hidden rounded-2xl border shadow-2xl ${novel ? "border-[#d6c19f] bg-[#fffcf5]" : "border-[#efb9cc] bg-[#fff7fb]"}`}>
            <header className={`flex items-center justify-between border-b px-5 py-4 ${novel ? "border-[#e6d4b8] bg-[#f5e8d3]" : "border-[#f2cfdb] bg-[#fce7ef]"}`}>
              <div><p className={`text-[10px] font-semibold tracking-[.16em] ${novel ? "text-[#937453]" : "text-[#b65b79]"}`}>{mode === "novel" ? "TELA · CAST" : "VIA LATA · CAST"}</p>
                <h2 className={`mt-1 font-serif text-lg ${novel ? "text-[#67503c]" : "text-[#8d294f]"}`}>{started ? "本轮登场角色" : "首轮登场角色"}</h2></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭" className={`rounded-lg p-2 ${novel ? "text-[#806d56] hover:bg-[#e8d7bd]" : "text-[#a85e79] hover:bg-[#f9dce7]"}`}><X size={17}/></button>
            </header>
            <p className={`border-b px-5 py-3 text-[10px] leading-5 ${novel ? "border-[#e9dcc6] text-[#846f53]" : "border-[#f3d4df] text-[#a15f78]"}`}>
              可选角色由世界线面板决定：主世界、最多三个已启用的附属世界，以及开启时的通用角色。
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {available.filter(char => !started || chosen.includes(char.id)).map(char => <label key={char.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${started ? "" : "cursor-pointer"} ${novel ? "hover:bg-[#f7ecda]" : "hover:bg-[#fce8f0]"}`}>
                <input type="checkbox" checked={draftIds.includes(char.id)} disabled={started || (!draftIds.includes(char.id) && draftIds.filter(id => allowedIds.has(id)).length >= MAX_STORY_CAST)}
                  onChange={() => toggle(char.id)} className={`h-4 w-4 shrink-0 ${novel ? "accent-[#9a6d43]" : "accent-[#c74d7b]"}`} />
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: char.color }} />
                <span className={`min-w-0 flex-1 truncate text-xs ${novel ? "text-[#684d35]" : "text-[#853b59]"}`}>{char.name}</span>
                <span className="max-w-[115px] truncate text-[10px] text-[#9aa99a]">{worldTitle(char.origin)}</span>
              </label>)}
              {(!available.length || (started && !chosen.length)) && <p className="p-4 text-center text-xs text-[#9ba99e]">{started ? "本轮未选择需要完整设定的角色" : "暂无可选角色，请先在 Charta 创建档案"}</p>}
            </div>
            <footer className={`flex items-center justify-between border-t px-5 py-4 ${novel ? "border-[#e6d4b8] bg-[#f5e8d3]" : "border-[#e7ede5] bg-[#eef5ef]"}`}>
              <span className="text-[11px] text-[#8da18f]">{started ? "本轮 AI 选择" : "首轮必选"} {draftIds.filter(id => allowedIds.has(id)).length} / {MAX_STORY_CAST}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">取消</button>
                {!started && <button type="button" onClick={apply} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs text-white ${novel ? "bg-[#765034] hover:bg-[#5c3c28]" : "bg-[#c04470] hover:bg-[#a8325e]"}`}><Check size={13}/>应用</button>}
              </div>
            </footer>
          </motion.div>
        </motion.div>}
    </AnimatePresence>, document.body)}
  </>;
}
