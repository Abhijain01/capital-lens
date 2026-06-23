"use client";

import type { Fundamentals } from "@/lib/types";
import { fmtCompact, fmtNum, fmtPct } from "@/lib/utils";

function Metric({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean | null;
}) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={
          "mt-0.5 text-sm font-medium " +
          (good === true
            ? "text-bull"
            : good === false
              ? "text-bear"
              : "text-slate-200")
        }
      >
        {value}
      </div>
    </div>
  );
}

function perfGood(v: number | null | undefined): boolean | null {
  if (v == null) return null;
  return v >= 0;
}

export function FundamentalsCard({
  fundamentals: f,
}: {
  fundamentals: Fundamentals | null;
}) {
  if (!f) {
    return (
      <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5 text-sm text-slate-400">
        Live fundamentals were unavailable for this security, so the analysis
        relied on web research only (confidence is lower as a result).
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          Live fundamentals
        </h3>
        <span className="text-[11px] text-slate-500">
          {f.currency ?? "USD"} · refreshed {new Date(f.fetchedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Metric label="Mkt cap" value={fmtCompact(f.marketCap ?? null)} />
        <Metric label="Price" value={fmtNum(f.sharePrice ?? null)} />
        <Metric
          label="1Y return"
          value={fmtPct(f.perfOneYear)}
          good={perfGood(f.perfOneYear)}
        />
        <Metric
          label="YTD"
          value={fmtPct(f.perfYtd)}
          good={perfGood(f.perfYtd)}
        />
        <Metric label="P/E (ttm)" value={fmtNum(f.peTrailing)} />
        <Metric label="Fwd P/E" value={fmtNum(f.peForward)} />
        <Metric label="P/B" value={fmtNum(f.priceToBook)} />
        <Metric label="PEG" value={fmtNum(f.pegRatio)} />
        <Metric label="EV/EBITDA" value={fmtNum(f.evToEbitda)} />
        <Metric label="Div yield" value={fmtPct(f.dividendYield)} />
        <Metric label="Rev growth" value={fmtPct(f.revenueGrowth)} good={(f.revenueGrowth ?? 0) >= 0} />
        <Metric label="Gross mgn" value={fmtPct(f.grossMargin)} />
        <Metric label="Op mgn" value={fmtPct(f.operatingMargin)} />
        <Metric label="Net mgn" value={fmtPct(f.netMargin)} />
        <Metric label="ROE" value={fmtPct(f.roe)} />
        <Metric label="Debt/eq" value={fmtNum(f.debtToEquity)} good={(f.debtToEquity ?? 0) <= 1.5 ? true : (f.debtToEquity == null ? null : false)} />
        <Metric label="Curr ratio" value={fmtNum(f.currentRatio)} good={(f.currentRatio ?? 0) >= 1 ? true : (f.currentRatio == null ? null : false)} />
        <Metric label="Beta" value={fmtNum(f.beta)} />
        <Metric
          label="Analyst tgt"
          value={fmtNum(f.targetMeanPrice)}
        />
        <Metric label="Analysts" value={f.numberOfAnalysts != null ? fmtNum(f.numberOfAnalysts, 0) : "—"} />
      </div>

      {f.businessDescription ? (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-medium text-slate-300 hover:text-slate-100">
            Business description
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {f.businessDescription}
          </p>
        </details>
      ) : null}
    </div>
  );
}
