"use client";

import { useEffect, useRef, useState } from "react";
import type { ViaeConversation, ViaeMessage, Session } from "../types";
import { formatLocalMemoryEntries, LOCAL_STM_SLOTS, parseLocalMemoryEntries } from "../lib/localMemory";
import { useLanguage } from "../context/LanguageContext";
import { DEFAULT_CONTEXT_WINDOW_TOKENS } from "../lib/contextWindow";
import { useAppDialog } from "../context/DialogContext";
import { asChartaPromptData, type ChartaCharacter } from "../lib/charta";
import { asChartaSelfPromptData, type ChartaSelf } from "../lib/chartaSelf";
import { viaeWorldline } from "../lib/viaeWorldline";
import { applyWorldlineAdvance, stripWorldlineAdvance } from "../lib/worldlineAdvanceProtocol";
import { parseStoryTurnMemory, stripStoryTurnMemory } from "../lib/storyTurnMemory";
import { nextConversationMemory } from "../lib/conversationTurnMemory";

const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Viae messages live *inside* the Viae workspace; they never enter normal chat history. */
export function useViaeEngine({ session, updateSession, provider, model, notify, customCharacters = [], activeSelf = null, terminalRequestLogEnabled = false, terminalLogEnabled = false, contextWindowTokens = DEFAULT_CONTEXT_WINDOW_TOKENS }: {
  session: Session;
  updateSession: (updater: (current: Session) => Session) => void;
  provider: string;
  model: string;
  notify?: (message: string) => void;
  customCharacters?: ChartaCharacter[];
  activeSelf?: ChartaSelf | null;
  terminalRequestLogEnabled?: boolean;
  terminalLogEnabled?: boolean;
  contextWindowTokens?: number;
}) {
  const { locale } = useLanguage();
  const dialog = useAppDialog();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  useEffect(() => () => abortRef.current?.abort(), []);
  const activeGroup = (session.limeGroups || []).find(g => g.id === session.limeGroupId);

  const patchGroup = (id: string, mapper: (group: ViaeConversation) => ViaeConversation) => {
    updateSession(current => ({
      ...current,
      updatedAt: Date.now(),
      limeGroups: (current.limeGroups || []).map(group => group.id === id ? mapper(group) : group),
    }));
  };

  const stop = () => abortRef.current?.abort();

  const send = async (regenerate = false) => {
    if (busyRef.current || !activeGroup || !provider) return;
    if (!model.trim()) {
      dialog.notify("请先为当前供应商选择模型，确认后再发送。");
      return;
    }
    if (activeGroup.pov === "insider" && !activeSelf) { notify?.("参与模式需要当前 Charta 启用的自设。"); return; }
    if (activeGroup.type === "direct" && activeGroup.members.length !== (activeGroup.pov === "outsider" ? 2 : 1)) {
      notify?.(activeGroup.pov === "outsider" ? "旁观小径需要两位角色" : "参与小径需要一位角色");
      return;
    }
    if (activeGroup.type === "group" && activeGroup.members.length < 2) { notify?.("路口至少需要两位角色"); return; }
    const text = input.trim();
    const previous = activeGroup.messages || [];
    const isReplace = regenerate && previous[previous.length - 1]?.role === "assistant";
    const preceding = isReplace ? previous.slice(0, -1) : previous;
    if (!regenerate && !text) return;
    if (regenerate && !preceding.some(msg => msg.role === "user")) return;

    const requestId = newId();
    const userMessage: ViaeMessage | null = regenerate ? null : { id: newId(), role: "user", kind: activeGroup.pov === "outsider" ? "director" : "chat", content: text, createdAt: Date.now() };
    const context = userMessage ? [...preceding, userMessage] : preceding;
    const assistant: ViaeMessage = { id: requestId, role: "assistant", content: "", createdAt: Date.now(), modelName: model };
    const groupId = activeGroup.id;
    const controller = new AbortController();
    abortRef.current = controller;
    busyRef.current = true;
    setIsLoading(true);
    if (!regenerate) setInput("");
    patchGroup(groupId, group => ({ ...group, messages: [...context, assistant], updatedAt: Date.now() }));

    let fullText = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          // Legacy wire mode remains "lime" for compatibility with saved sessions.
          memoryMode: "lime", provider, model, uiLanguage: locale,
          contextWindowTokens,
          debugRequestPayload: terminalRequestLogEnabled,
          debugFullOutput: terminalLogEnabled,
          customCharacters: customCharacters.map(asChartaPromptData),
          viaeSelf: activeGroup.pov === "insider" && activeSelf ? asChartaSelfPromptData(activeSelf) : null,
          messages: context.map(msg => ({ role: msg.role, content: msg.content, kind: msg.kind })),
          stm: activeGroup.stm || "", ltm: activeGroup.ltm || "",
          viaeGroup: {
            name: activeGroup.name,
            type: activeGroup.type,
            members: activeGroup.members,
            pov: activeGroup.pov,
            defaultPovChar: activeGroup.defaultPovChar,
            reality: activeGroup.reality,
            auContext: activeGroup.auContext,
            timeline: activeGroup.timeline,
            storyWorldline: activeGroup.storyWorldline,
          },
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `Viae API HTTP ${response.status}`);
      }
      if (!response.body) throw new Error("Viae API response has no stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const currentText = stripStoryTurnMemory(stripWorldlineAdvance(fullText));
        patchGroup(groupId, group => ({
          ...group,
          messages: group.messages.map(message => message.id === requestId ? { ...message, content: currentText } : message),
        }));
      }
      fullText += decoder.decode();
      const rawOutput = fullText;
      const inlineMemory = parseStoryTurnMemory(rawOutput);
      fullText = stripStoryTurnMemory(stripWorldlineAdvance(rawOutput));
      if (!fullText.trim()) throw new Error("模型没有返回聊天内容");

      const originalStm = String(activeGroup.stm || "");
      const originalLtm = String(activeGroup.ltm || "");
      const inlineApplied = !regenerate && inlineMemory?.stm
        ? nextConversationMemory({ stm: originalStm, ltm: originalLtm }, inlineMemory) : null;
      patchGroup(groupId, group => {
        const currentWorldline = viaeWorldline(group);
        const advanced = applyWorldlineAdvance(currentWorldline, rawOutput);
        const nextWorldline = advanced && advanced.period !== currentWorldline.period ? advanced : currentWorldline;
        const unchanged = (group.stm || "") === originalStm && (group.ltm || "") === originalLtm;
        return {
          ...group,
          storyWorldline: nextWorldline,
          timeline: nextWorldline.kind === "canon" ? nextWorldline.period.replace(/^T-/, "") : "AU",
          ...(inlineApplied && unchanged ? { stm: inlineApplied.stm, ltm: inlineApplied.ltm,
            turnCount: inlineApplied.turnCount } : {}),
          messages: group.messages.map(message => message.id === requestId ? { ...message, content: fullText } : message),
        };
      });

      // Normally memory arrives inside the same model response. No additional
      // summarizer request is needed unless the protocol was omitted, or a
      // seventh-turn consolidation lacked its LTM.
      const needFallback = !regenerate &&
        (!inlineMemory?.stm || (parseLocalMemoryEntries(originalStm).length >= LOCAL_STM_SLOTS && !inlineMemory.ltm));
      if (needFallback) {
        try {
          let summary = inlineMemory?.stm?.trim() || "";
          if (!summary) {
            const memo = await fetch("/api/summarize", {
              method: "POST", headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                text: (activeGroup.pov === "outsider" ? "Scene direction: " : "User: ") +
                  (text || "(regenerated reply)") + "\nViae: " + fullText,
                mode: "micro", provider, model, uiLanguage: locale,
              }),
            });
            if (!memo.ok) throw new Error("Viae micro-memory unavailable");
            const data = await memo.json();
            summary = typeof data.summary === "string" ? data.summary.trim() : "";
          }
          if (summary) {
            const batch = [...parseLocalMemoryEntries(originalStm), "• " + summary];
            let consolidated = "";
            if (batch.length > LOCAL_STM_SLOTS) {
              const macro = await fetch("/api/summarize", {
                method: "POST", headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                  text: formatLocalMemoryEntries(batch), previousLtm: originalLtm,
                  mode: "macro", provider, model, uiLanguage: locale,
                }),
              });
              if (macro.ok) {
                const data = await macro.json();
                consolidated = typeof data.summary === "string" ? data.summary.trim() : "";
              }
            }
            patchGroup(groupId, group => {
              // Never overwrite a different generation, manual edits or newer
              // memories while a delayed compatibility summary finishes.
              if (group.messages[group.messages.length - 1]?.id !== requestId) return group;
              const expectedStm = inlineApplied?.stm ?? originalStm;
              if ((group.stm || "") !== expectedStm || (group.ltm || "") !== originalLtm) return group;
              if (consolidated) return { ...group, stm: "", ltm: consolidated, turnCount: 0 };
              if (inlineApplied) return group; // Preserve seventh STM if macro fails.
              return { ...group, stm: formatLocalMemoryEntries(batch), turnCount: batch.length };
            });
          }
        } catch (error) {
          if (!controller.signal.aborted) console.warn("Viae memory fallback skipped:", error);
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        if (!fullText.trim()) patchGroup(groupId, group => ({ ...group, messages: group.messages.filter(msg => msg.id !== requestId) }));
        notify?.("已停止生成");
      } else {
        const message = error instanceof Error ? error.message : "Viae 请求失败";
        notify?.(message);
        // Keep the user's text but drop an empty assistant placeholder.
        if (!fullText.trim()) patchGroup(groupId, group => ({ ...group, messages: group.messages.filter(msg => msg.id !== requestId) }));
      }
    } finally {
      busyRef.current = false;
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  const deleteMessage = (index: number) => {
    if (!activeGroup || busyRef.current) return;
    patchGroup(activeGroup.id, group => ({ ...group, messages: group.messages.filter((_, i) => i !== index) }));
  };
  return { activeGroup, input, setInput, isLoading, send, stop, deleteMessage };
}
