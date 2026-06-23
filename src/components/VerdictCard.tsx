"use client";

import { ScoreGauge } from "@/components/ScoreGauge";
import type { Verdict, Scorecard } from "@/lib/types";

const DECISION_STYLE: Record<
  Verdict["decision"],
  { label: string; text: string; bg: string; ring: string }
> = {
  INVEST: {
    label: "INVEST",
    text: "text-bull",
    bg: "bg-bull/15",
    ring: "ring-bull/40",
  },
  WATCH: {
    label: "WATCH",
    text: "text-hold",
    bg: "bg-hold/15",
    ring: "ring-hold/40",
  },
  PASS: {
    label: "PASS",
    text: "text-bear",
    bg: "bg-bear/15",
    ring: "ring-bear/40",
  },
};

interface Props {
  verdict: Verdict;
  scorecard: Scorecard | null;
}

export function VerdictCard({ verdict, scorecard }: Props) {
  const style = DECISION_STYLE[verdict.decision];

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900">
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-5">
          <ScoreGauge value={scorecard?.overall ?? 0} />
          <div>
            <div
              className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold uppercase tracking-wider ring-1 ${style.bg} ${style.text} ${style.ring}`}
            >
              {style.label}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              <span className="text-slate-200">{verdict.conviction}</span>{" "}
              conviction
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Horizon: {verdict.timeHorizon}
            </div>
          </div>
        </div>

        <div>
          <p className="text-lg font-medium leading-snug text-slate-100">
            {verdict.oneLineSummary}
          </p>

          {scorecard ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Confidence</span>
                <span className="font-mono text-slate-300">
                  {scorecard.confidence}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-indigo-400"
                  style={{ width: `${scorecard.confidence}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span>
                  Quant model:{" "}
                  <span className="text-slate-300">
                    {scorecard.quantitativeDecision}
                  </span>
                </span>
                {verdict.overridden && (
                  <span className="rounded bg-hold/15 px-1.5 py-0.5 text-hold">
                    LLM overrode quant model
                  </span>
                )}
                {verdict.overridden && verdict.overrideReason ? (
                  <span className="text-slate-400">
                    {verdict.overrideReason}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
