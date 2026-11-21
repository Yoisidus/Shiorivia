"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAppDialog } from "../context/DialogContext";
import { BookOpen, X, Edit2, Save } from "lucide-react";

type WorldInfoModalProps = {
   isOpen: boolean;
   onClose: () => void;
   title: string;
   subtitle?: string;
   content: string;
   onSave: (content: string) => void;
   tone?: "story" | "chat" | "engineering";
};

/** Draft-first editor: closing without Save never mutates the session. */
export const WorldInfoModal = ({ isOpen, onClose, title, subtitle, content, onSave, tone = "chat" }: WorldInfoModalProps) => {
   const dialog = useAppDialog();
   const [draft, setDraft] = useState(content);
   useEffect(() => { if (isOpen) setDraft(content); }, [isOpen, content]);
   const accent = tone === "story"
      ? { border: "border-fuchsia-200", background: "bg-fuchsia-50", text: "text-fuchsia-800", button: "bg-fuchsia-600 hover:bg-fuchsia-700", focus: "focus:ring-fuchsia-300" }
      : tone === "engineering"
      ? { border: "border-sky-200", background: "bg-sky-50", text: "text-sky-800", button: "bg-sky-700 hover:bg-sky-800", focus: "focus:ring-sky-300" }
      : { border: "border-emerald-200", background: "bg-emerald-50", text: "text-emerald-800", button: "bg-emerald-600 hover:bg-emerald-700", focus: "focus:ring-emerald-300" };
   const save = () => {
      onSave(draft);
      void dialog.alert("保存成功", { title: "会话设定已保存" });
      onClose();
   };
   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }}
                  role="dialog" aria-modal="true" aria-label={title}
                  className={`bg-white rounded-2xl shadow-2xl w-full max-w-[540px] overflow-hidden border ${accent.border}`}>
                  <div className={`px-5 py-4 border-b ${accent.border} ${accent.background} flex items-start justify-between gap-3`}>
                     <div>
                        <div className={`font-bold flex items-center gap-2 ${accent.text}`}><BookOpen size={18} />{title}</div>
                        <p className="mt-1 text-xs text-slate-500">{subtitle || "仅用于当前会话，不会影响其他会话。"}</p>
                     </div>
                     <button type="button" aria-label="关闭" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/70"><X size={18} /></button>
                  </div>
                  <div className="p-5">
                     <textarea className={`w-full h-60 resize-y border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 ${accent.focus}`}
                        placeholder="写下这个会话的背景、规则、补充说明……"
                        value={draft} onChange={e => setDraft(e.target.value)} />
                     <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100">取消</button>
                        <button type="button" onClick={save} className={`rounded-lg px-4 py-2 text-xs text-white shadow-sm flex items-center gap-2 ${accent.button}`}><Save size={14} /> 保存设定</button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export const EditModal = ({ isOpen, onClose, content, setContent, onConfirm }: any) => (
   <AnimatePresence>
      {isOpen && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-full overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-4 border-b flex justify-between items-center bg-gray-50"><div className="font-bold text-gray-700 flex items-center gap-2"><Edit2 size={16} /> 编辑消息</div><button onClick={onClose}><X size={20} /></button></div>
               <div className="p-4 flex-1 overflow-auto"><textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-64 p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm" /></div>
               <div className="p-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">取消</button><button onClick={onConfirm} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 shadow-md">确认重试</button></div>
            </motion.div>
         </motion.div>
      )}
   </AnimatePresence>
);

export const SuggestionModal = ({ isOpen, onClose, content, onConfirm, mode = "send" }: any) => (
   <AnimatePresence>
      {isOpen && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-xl shadow-2xl w-[500px] border overflow-hidden">
               <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <span className="font-bold text-emerald-800 text-sm">采纳剧情建议 / Adopt Suggestion</span>
               </div>

               <div className="p-6">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Preview content:</div>
                  <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700 leading-relaxed font-medium">
                     {content}
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                     {mode === "insert" ? "* 确认后只会填入发送文本框，不会立即发送。你可以继续编辑。" : "* 点击确认将直接发送此内容。"}
                  </div>
               </div>

               <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-bold">取消 / Cancel</button>
                  <button onClick={onConfirm} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-md flex items-center gap-2">
                     {mode === "insert" ? "确认填入 / Insert" : "确认发送 / Send"}
                  </button>
               </div>
            </motion.div>
         </motion.div>
      )}
   </AnimatePresence>
);