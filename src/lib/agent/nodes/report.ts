import { MODELS } from "@/lib/config";
import type { Citation, ResearchReport } from "@/lib/types";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/** De-duplicate citations by URL, keeping the richest snippet. */
function dedupeCitations(citations: Citation[] | undefined | null): Citation[] {
  const list = Array.isArray(citations) ? citations : [];
  const map = new Map<string, Citation>();
  for (const c of list) {
    if (!c?.url) continue;
    const existing = map.get(c.url);
    if (!existing || (c.snippet?.length ?? 0) > (existing.snippet?.length ?? 0)) {
      map.set(c.url, c);
    }
  }
  return Array.from(map.values());
}

/**
 * Node 7 — Assemble the final, self-contained report object that the API
 * returns to the UI. Pure assembly (no LLM), so the output is fully
 * determined by upstream state. Every array is guarded so the node can
 * never crash on an undefined channel.
 */
export function reportNode(state: AgentStateType): StateUpdate {
  const report: ResearchReport = {
    company: state.company,
    resolved: state.resolved ?? null,
    fundamentals: state.fundamentals ?? null,
    news: Array.isArray(state.news) ? state.news : [],
    qualitative: state.qualitative ?? "",
    analyses: state.analyses ?? null,
    scorecard: state.scorecard ?? null,
    verdict: state.verdict ?? null,
    citations: dedupeCitations(state.citations),
    notResearchable: Boolean(state.notResearchable),
    error: state.error ?? undefined,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - (state.startedAt ?? Date.now()),
    models: { reasoning: MODELS.reasoning, fast: MODELS.fast },
  };

  return { report, currentStep: "done" };
}