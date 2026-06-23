"use client";

import type { Scorecard as ScorecardT } from "@/lib/types";

function barColor(v: number): string {
  return v >= 70 ? "bg-bull" : v >= 55 ? "bg-hold" : "bg-bear";
}
function textColor(v: number): string {
  return v >= 70 ? "text-bull" : v >= 55 ? "text-hold" : "text-bear";
}

export function Scorecard({ scorecard }: { scorecard: ScorecardT }) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          Weighted scorecard
        </h3>
        <span className="text-xs text-slate-500">
          weights sum to 100% · higher is better
        </span>
      </div>

      <div className="space-y-3">
        {scorecard.items.map((it) => (
          <div key={it.name}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-200">{it.name}</span>
              <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                {(it.weight * 100).toFixed(0)}%
              </span>
              <span className={`ml-auto font-mono text-sm ${textColor(it.score)}`}>
                {it.score}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
              <div
                className={`h-full rounded-full ${barColor(it.score)}`}
                style={{ width: `${it.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              {it.rationale}
            </p>
            {(it.strengths.length > 0 || it.concerns.length > 0) && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {it.strengths.length > 0 && (
                  <ul className="space-y-1">
                    {it.strengths.map((s, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-slate-300">
                        <span className="text-bull">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {it.concerns.length > 0 && (
                  <ul className="space-y-1">
                    {it.concerns.map((s, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-slate-300">
                        <span className="text-bear">−</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
