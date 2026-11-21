import { parseStoryWorldline, canAdvanceWorldline, type StoryWorldline } from "./storyWorldline";

/**
 * Worldlines are session contracts, not editable scene drafts.
 * Saving the first worldline fixes its main world, AU baseline and chronology.
 * Later saves may move the original timeline forward (never backward), and
 * append (never remove or alter) secondary worlds.
 */
export function canExtendWorldline(previous: unknown, next: unknown): boolean {
  const proposed = parseStoryWorldline(next);
  if (!proposed) return false;
  const saved = parseStoryWorldline(previous);
  if (!saved) return true;
  const sameMain = saved.worldId === proposed.worldId
    && saved.worldName === proposed.worldName
    && saved.worldDescription === proposed.worldDescription
    && JSON.stringify(saved.canonTimeline) === JSON.stringify(proposed.canonTimeline)
    && saved.kind === proposed.kind && canAdvanceWorldline(saved, proposed)
    && saved.baseEra === proposed.baseEra && saved.basePeriod === proposed.basePeriod;
  if (!sameMain) return false;
  const former = saved.crossWorld;
  const future = proposed.crossWorld;
  if (former?.enabled && !future?.enabled) return false;
  if (former?.includeUniversal && !future?.includeUniversal) return false;
  const nextWorlds = new Map((future?.secondary || []).map(item => [item.worldId, item]));
  for (const original of former?.secondary || []) {
    const replacement = nextWorlds.get(original.worldId);
    if (!replacement || JSON.stringify(replacement) !== JSON.stringify(original)) return false;
  }
  return true;
}

/** Persisted world and AU baseline are immutable; canon era/period may advance only. */
export function immutableWorldlineMain(saved: StoryWorldline): Pick<StoryWorldline,
  "worldId" | "worldName" | "worldDescription" | "canonTimeline" | "kind" | "era" | "period" | "baseEra" | "basePeriod"> {
  return {
    worldId: saved.worldId, worldName: saved.worldName, worldDescription: saved.worldDescription,
    canonTimeline: saved.canonTimeline, kind: saved.kind, era: saved.era, period: saved.period,
    baseEra: saved.baseEra, basePeriod: saved.basePeriod,
  };
}
