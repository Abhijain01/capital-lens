"use client";

import { VerdictCard } from "@/components/VerdictCard";
import { Scorecard } from "@/components/Scorecard";
import { FundamentalsCard } from "@/components/FundamentalsCard";
import type { ResearchReport, NewsItem, Citation, Verdict } from "@/lib/types";
import { domainFromUrl } from "@/lib/utils";

export function ReportView({ report }: { report: ResearchReport }) {
  const { resolved, fundamentals, scorecard, verdict, news, citations } =
    report;
  if (!verdict) return null;

  return (
    <div className="space-y-5">
      <CompanyHeader report={report} />

      <VerdictCard verdict={verdict} scorecard={scorecard} />

      {report.notResearchable ? (
        <div className="rounded-2xl border border-hold/30 bg-hold/5 p-5 text-sm leading-relaxed text-slate-300">
          {verdict.thesis}
        </div>
      ) : (
        <>
          {scorecard ? <Scorecard scorecard={scorecard} /> : null}
          <FundamentalsCard fundamentals={fundamentals} />
          <AnalysisPanel verdict={verdict} />
          {news && news.length > 0 ? <News news={news} /> : null}
        </>
      )}

      {citations && citations.length > 0 ? (
        <Citations citations={citations} />
      ) : null}

      <Meta report={report} />
      <Disclaimer />
    </div>
  );
}

function CompanyHeader({ report }: { report: ResearchReport }) {
  const { resolved } = report;
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
          {resolved?.name ?? report.company}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
          {resolved?.ticker ? (
            <span className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-slate-200">
              {resolved.ticker}
            </span>
          ) : null}
          {resolved?.exchange ? <span>{resolved.exchange}</span> : null}
          {resolved?.sector ? (
            <span>
              · {resolved.sector}
              {resolved.industry ? ` / ${resolved.industry}` : ""}
            </span>
          ) : null}
          {resolved?.country ? <span>· {resolved.country}</span> : null}
        </div>
      </div>
      {resolved?.website ? (
        <a
          href={resolved.website}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-brand-400 hover:underline"
        >
          {domainFromUrl(resolved.website)} ↗
        </a>
      ) : null}
    </div>
  );
}

function AnalysisPanel({ verdict }: { verdict: Verdict }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">
          Investment thesis
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">{verdict.thesis}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <KeyValue label="Fair-value view" value={verdict.fairValueView} />
          <KeyValue label="Time horizon" value={verdict.timeHorizon} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard
          title="Key strengths"
          items={verdict.keyStrengths}
          accent="text-bull"
          bullet="+"
        />
        <ListCard
          title="Key risks"
          items={verdict.keyRisks}
          accent="text-bear"
          bullet="−"
        />
      </div>

      {verdict.catalysts.length > 0 ? (
        <ListCard
          title="Catalysts to watch"
          items={verdict.catalysts}
          accent="text-brand-400"
          bullet="→"
        />
      ) : null}
    </div>
  );
}

function ListCard({
  title,
  items,
  accent,
  bullet,
}: {
  title: string;
  items: string[];
  accent: string;
  bullet: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-300">
            <span className={`mt-0.5 ${accent}`}>{bullet}</span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-800/50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-slate-200">{value}</div>
    </div>
  );
}

function News({ news }: { news: NewsItem[] }) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">Recent news</h3>
      <ul className="space-y-3">
        {news.slice(0, 8).map((n, i) => (
          <li key={i} className="text-sm">
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-slate-200 hover:text-brand-400"
            >
              {n.title}
            </a>
            <div className="mt-0.5 text-xs text-slate-500">
              {n.source ?? domainFromUrl(n.url)}
              {n.publishedDate ? ` · ${n.publishedDate.slice(0, 10)}` : ""}
            </div>
            {n.snippet ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {n.snippet}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Citations({ citations }: { citations: Citation[] }) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        Sources &amp; citations
        <span className="ml-2 text-xs font-normal text-slate-500">
          {citations.length}
        </span>
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {citations.slice(0, 16).map((c, i) => (
          <li key={i}>
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-start gap-2 text-xs"
            >
              <span className="mt-0.5 text-slate-600">{i + 1}.</span>
              <span>
                <span className="text-slate-500">
                  {c.source ?? domainFromUrl(c.url)}
                </span>
                <span className="block text-slate-300 group-hover:text-brand-400">
                  {c.title || c.url}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meta({ report }: { report: ResearchReport }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = (report.resolved?.ticker || report.company || "report")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    a.href = url;
    a.download = `capital-lens-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
      <span>
        Generated {new Date(report.generatedAt).toLocaleString()} ·{" "}
        {(report.durationMs / 1000).toFixed(1)}s
      </span>
      <span>·</span>
      <span>
        LLM: {report.models.reasoning} + {report.models.fast} (Groq)
      </span>
      <span>·</span>
      <span>Data: Yahoo Finance + Tavily</span>
      <button
        onClick={download}
        className="ml-auto rounded-md border border-ink-700 px-2 py-1 text-slate-400 transition hover:border-brand-500/50 hover:text-slate-200"
      >
        ↓ Download report (.json)
      </button>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="rounded-xl border border-ink-800 bg-ink-900/30 p-3 text-[11px] leading-relaxed text-slate-500">
      ⚠️ This report is generated by an autonomous AI research agent for
      educational and informational purposes only. It is not investment,
      financial, legal, or tax advice. Figures are pulled live from
      third-party providers and may be delayed or inaccurate. Always verify
      against primary sources and consult a licensed professional before
      investing.
    </p>
  );
}
