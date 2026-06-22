import {
  WEIGHTS,
  DECISION,
  RISK_DOWNGRADE_FLOOR,
  DIMENSION_LABELS,
  type Dimension,
} from "@/lib/config";
import { clamp, nowIso } from "@/lib/utils";
import type { Scorecard } from "@/lib/types";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/**
 * Node 5 — Deterministic, transparent scoring. No LLM here on purpose:
 * the weighted total, confidence and quantitative decision are computed
 * in code so they are reproducible and auditable (a real analyst can
 * recompute them by hand from the scorecard).
 */
export function scoreNode(state: AgentStateType): StateUpdate {
  const a = state.analyses;
  if (!a) {
    return {
      scorecard: null,
      currentStep: "score",
      logs: [
        { step: "score", message: "No analyses to score.", ts: nowIso() },
      ],
    };
  }

  const dims = Object.keys(WEIGHTS) as Dimension[];
  const items = dims.map((d) => ({
    name: DIMENSION_LABELS[d],
    weight: WEIGHTS[d],
    score: clamp(Math.round(a[d].score)),
    rationale: a[d].rationale,
    strengths: a[d].strengths,
    concerns: a[d].concerns,
  }));

  const overall = clamp(
    Math.round(items.reduce((sum, it) => sum + it.score * it.weight, 0)),
  );

  // Confidence model (documented in README): base + data completeness +
  // citation breadth - quality penalties - score dispersion penalty.
  const qualities = dims.map((d) => a[d].dataQuality);
  const weakCount = qualities.filter((q) => q === "weak").length;
  const partialCount = qualities.filter((q) => q === "partial").length;

  let confidence = 62;
  confidence += state.fundamentals ? 16 : -12;
  confidence += Math.min(state.citations.length, 6) * 3;
  confidence -= weakCount * 9 + partialCount * 3;

  const scores = items.map((it) => it.score);
  const mean = scores.reduce((x, y) => x + y, 0) / scores.length;
  const sd = Math.sqrt(
    scores.reduce((x, y) => x + (y - mean) ** 2, 0) / scores.length,
  );
  if (sd > 22) confidence -= 8; // analysts disagree strongly → less confident

  confidence = clamp(Math.round(confidence));

  let quantitativeDecision: Scorecard["quantitativeDecision"] =
    overall >= DECISION.INVEST_FLOOR
      ? "INVEST"
      : overall >= DECISION.WATCH_FLOOR
        ? "WATCH"
        : "PASS";

  // Risk downgrade: a single bad risk score caps the call one tier lower.
  if (a.risk.score < RISK_DOWNGRADE_FLOOR) {
    quantitativeDecision =
      quantitativeDecision === "INVEST"
        ? "WATCH"
        : "PASS";
  }

  const scorecard: Scorecard = {
    items,
    overall,
    confidence,
    quantitativeDecision,
  };

  return {
    scorecard,
    currentStep: "score",
    logs: [
      {
        step: "score",
        message: `Overall ${overall}/100 → ${quantitativeDecision} (confidence ${confidence}%).`,
        ts: nowIso(),
      },
    ],
  };
}
