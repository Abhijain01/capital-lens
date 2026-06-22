import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { reasoningModel } from "@/lib/agent/models";
import { verdictSchema, type Verdict } from "@/lib/types";
import { verdictPrompt } from "@/lib/agent/prompts";
import { nowIso } from "@/lib/utils";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/**
 * Node 6 — The portfolio manager. Takes the quantitative scorecard +
 * research and writes the final, narrated decision. Normally agrees with
 * the model's quantitative decision; may override only with a specific,
 * stated reason (a qualitative factor the score didn't capture). We
 * record whether an override happened for full transparency.
 */
export async function verdictNode(state: AgentStateType): Promise<StateUpdate> {
  // Short-circuit for non-researchable entities.
  if (state.notResearchable || !state.scorecard) {
    const verdict: Verdict = {
      decision: "PASS",
      conviction: "High",
      oneLineSummary: `${state.resolved?.name ?? state.company} is not a researchable listed equity.`,
      thesis:
        state.resolved?.reason ??
        "The agent could not resolve this query to a publicly-traded equity with available financials, so no investment analysis could be performed.",
      keyStrengths: [],
      keyRisks: ["No public financials are available to analyse."],
      catalysts: [],
      fairValueView: "N/A — not analysable as a listed equity.",
      timeHorizon: "N/A",
    };
    return {
      verdict,
      currentStep: "verdict",
      logs: [
        {
          step: "verdict",
          message: "Not researchable → PASS.",
          ts: nowIso(),
        },
      ],
    };
  }

  const sc = state.scorecard;
  const structured = reasoningModel(0.2).withStructuredOutput(verdictSchema, {
    name: "verdict",
  });
  const { system, user } = verdictPrompt(
    state,
    sc.quantitativeDecision,
    sc.overall,
    sc.confidence,
  );

  let out: z.infer<typeof verdictSchema>;
  try {
    out = await structured.invoke([
      new SystemMessage(system),
      new HumanMessage(user),
    ]);
  } catch {
    out = {
      decision: sc.quantitativeDecision,
      conviction:
        sc.confidence >= 70 ? "High" : sc.confidence >= 50 ? "Medium" : "Low",
      oneLineSummary: `Quantitative model suggests ${sc.quantitativeDecision} at ${sc.overall}/100.`,
      thesis:
        "Verdict synthesis failed; falling back to the quantitative scorecard.",
      keyStrengths: [],
      keyRisks: [],
      catalysts: [],
      fairValueView: "Unable to synthesise a fair-value view.",
      timeHorizon: "N/A",
      overrideQuant: false,
      overrideReason: "N/A",
    };
  }

  const overridden =
    !!out.overrideQuant && out.decision !== sc.quantitativeDecision;

  const verdict: Verdict = {
    decision: out.decision,
    conviction: out.conviction,
    oneLineSummary: out.oneLineSummary,
    thesis: out.thesis,
    keyStrengths: out.keyStrengths,
    keyRisks: out.keyRisks,
    catalysts: out.catalysts,
    fairValueView: out.fairValueView,
    timeHorizon: out.timeHorizon,
    overridden,
    overrideReason: overridden ? out.overrideReason : undefined,
  };

  return {
    verdict,
    currentStep: "verdict",
    logs: [
      {
        step: "verdict",
        message: `Decision: ${verdict.decision} (${verdict.conviction} conviction)${
          overridden
            ? ` — overrode quantitative model: ${verdict.overrideReason}`
            : ""
        }.`,
        ts: nowIso(),
      },
    ],
  };
}
