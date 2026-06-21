import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { reasoningModel } from "@/lib/agent/models";
import { resolveSchema } from "@/lib/types";
import { resolvePrompt } from "@/lib/agent/prompts";
import { searchCompanies } from "@/lib/data/yahoo";
import { nowIso } from "@/lib/utils";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/**
 * Node 1 — Resolve the free-text query to ONE publicly-traded security.
 * Grounded in real Yahoo Finance search results (not the LLM's memory),
 * so the ticker is never hallucinated.
 */
export async function resolveNode(state: AgentStateType): Promise<StateUpdate> {
  const candidates = await searchCompanies(state.company);
  const candText = candidates.length
    ? candidates
        .map(
          (c, i) =>
            `${i + 1}. ${c.symbol} | ${c.name ?? ""} | ${c.exchange ?? ""} | ${c.type ?? ""}`,
        )
        .join("\n")
    : "(no Yahoo Finance candidates found)";

  const model = reasoningModel(0.1);
  const structured = model.withStructuredOutput(resolveSchema, {
    name: "resolved_company",
  });

  let resolved;
  try {
    const prompt = resolvePrompt(state.company, candText);
    resolved = await structured.invoke([
      new SystemMessage(prompt.system),
      new HumanMessage(prompt.user),
    ]);
  } catch {
    const best = candidates[0];
    resolved = {
      name: best?.name ?? state.company,
      ticker: best?.symbol ?? "",
      exchange: best?.exchange ?? "",
      type: best?.type ?? "",
      sector: "",
      industry: "",
      country: "",
      website: "",
      isPublicEquity: Boolean(best),
      reason: "Fallback resolution (structured output failed).",
    };
  }

  const notResearchable = !resolved.isPublicEquity || !resolved.ticker;
  return {
    resolved,
    notResearchable,
    currentStep: "resolve",
    logs: [
      {
        step: "resolve",
        message: notResearchable
          ? `Not a researchable listed equity — ${resolved.reason}`
          : `Resolved to ${resolved.name} (${resolved.ticker})`,
        ts: nowIso(),
      },
    ],
  };
}
