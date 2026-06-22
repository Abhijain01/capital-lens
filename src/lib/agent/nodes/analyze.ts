import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { reasoningModel, fastModel } from "@/lib/agent/models";
import {
  analysisSchema,
  type Analyses,
  type DimensionAnalysis,
} from "@/lib/types";
import { analystsPrompt } from "@/lib/agent/prompts";
import { DIMENSIONS } from "@/lib/config";
import { nowIso } from "@/lib/utils";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/**
 * Node 4 — A desk of six specialist analysts.
 *
 * All six dimensions are scored in ONE structured-output call rather than
 * six parallel calls. This shares the research context once (≈4× fewer
 * tokens) which keeps the pipeline inside Groq's free-tier token-per-minute
 * limit and makes it far more robust. The prompt still treats them as six
 * distinct specialist roles. Fallbacks: 70b → 8b → neutral defaults.
 */
function defaultAnalyses(): Analyses {
  const make = (label: string): DimensionAnalysis => ({
    score: 50,
    rationale: `Analysis unavailable for ${label}; a neutral score was assigned. Treat with low confidence.`,
    strengths: [],
    concerns: [`The ${label} analysis could not be completed.`],
    dataQuality: "weak",
  });
  return {
    business: make("business"),
    financials: make("financials"),
    valuation: make("valuation"),
    growth: make("growth"),
    moat: make("moat"),
    risk: make("risk"),
  };
}

export async function analyzeNode(state: AgentStateType): Promise<StateUpdate> {
  const { system, user } = analystsPrompt(state);

  const call = (factory: () => ReturnType<typeof reasoningModel>) =>
    factory()
      .withStructuredOutput(analysisSchema, { name: "analyses" })
      .invoke([new SystemMessage(system), new HumanMessage(user)]);

  let analyses: Analyses;
  try {
    analyses = await call(() => reasoningModel(0.2));
  } catch {
    try {
      analyses = await call(() => fastModel(0.2));
    } catch {
      analyses = defaultAnalyses();
    }
  }

  return {
    analyses,
    currentStep: "analyze",
    logs: [
      {
        step: "analyze",
        message: `Analysts scored ${DIMENSIONS.length} dimensions — ${DIMENSIONS.map(
          (d) => `${d}:${analyses[d].score}`,
        ).join(", ")}.`,
        ts: nowIso(),
      },
    ],
  };
}
