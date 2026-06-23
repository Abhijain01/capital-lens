"use client";

import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgentTimeline } from "@/components/AgentTimeline";
import { ReportView } from "@/components/ReportView";
import { cn } from "@/lib/cn";
import type {
  ResolvedCompany,
  Fundamentals,
  NewsItem,
  Citation,
  Analyses,
  Scorecard,
  Verdict,
  ResearchReport,
  LogEntry,
} from "@/lib/types";

type Phase = "idle" | "running" | "done" | "error";

interface Snapshot {
  company?: string;
  resolved?: ResolvedCompany | null;
  notResearchable?: boolean;
  fundamentals?: Fundamentals | null;
  news?: NewsItem[];
  citations?: Citation[];
  analyses?: Analyses | null;
  scorecard?: Scorecard | null;
  verdict?: Verdict | null;
  report?: ResearchReport | null;
  currentStep?: string;
  logs?: LogEntry[];
}

const EXAMPLES = [
  "Apple",
  "NVIDIA",
  "Microsoft",
  "Tesla",
  "Reliance Industries",
  "TCS",
  "Amazon",
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runResearch(company: string) {
    setPhase("running");
    setError(null);
    setSnapshot(null);

    let res: Response;
    try {
      res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
    } catch {
      setPhase("error");
      setError("Could not reach the server. Is `npm run dev` running?");
      return;
    }

    if (!res.ok || !res.body) {
      const msg = await res.json().catch(() => ({}));
      setPhase("error");
      setError(msg?.error ?? `Request failed (${res.status}).`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const line = raw
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          let payload: { type: string; state?: Snapshot; message?: string };
          try {
            payload = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          if (payload.type === "snapshot" && payload.state) {
            setSnapshot(payload.state);
          } else if (payload.type === "error") {
            setPhase("error");
            setError(payload.message ?? "Unknown error.");
            return;
          } else if (payload.type === "done") {
            setPhase("done");
          }
        }
      }
    } catch {
      setPhase("error");
      setError("Stream was interrupted.");
    }
  }

  const report = snapshot?.report ?? null;

  return (
    <main className="min-h-screen relative">
      {/* background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% -10%, rgba(14,165,233,0.12), transparent 70%), radial-gradient(50rem 30rem at 90% 10%, rgba(99,102,241,0.10), transparent 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Header />

        <div className="mt-8">
          <SearchBar
            onSubmit={runResearch}
            disabled={phase === "running"}
            examples={EXAMPLES}
          />
        </div>

        {phase === "idle" && <IdleState />}

        {(phase === "running" || phase === "done") && snapshot && (
          <div className="mt-8">
            {phase === "running" || !report ? (
              <AgentTimeline
                currentStep={snapshot.currentStep ?? "init"}
                logs={snapshot.logs ?? []}
              />
            ) : null}

            {report ? (
              <div className="mt-8">
                <ReportView report={report} />
              </div>
            ) : null}
          </div>
        )}

        {phase === "error" && (
          <div className="mt-8 rounded-2xl border border-bear/40 bg-bear/10 p-6 text-sm text-red-200">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-red-200/80">{error}</p>
          </div>
        )}

        <Footer />
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-indigo-500 shadow-lg shadow-brand-500/20">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-ink-950"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17l5-6 4 4 5-7 4 4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Capital Lens
          </h1>
          <p className="text-xs text-slate-400">
            AI Investment Research Agent
          </p>
        </div>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
        Enter any company. An autonomous analyst agent resolves it, pulls{" "}
        <span className="text-slate-100">live fundamentals &amp; news</span>,
        runs <span className="text-slate-100">six specialist analysts</span>,
        computes a weighted scorecard, and delivers a defensible{" "}
        <span className="text-bull font-medium">INVEST</span> /{" "}
        <span className="text-hold font-medium">WATCH</span> /{" "}
        <span className="text-bear font-medium">PASS</span> verdict — with full
        reasoning and cited sources.
      </p>
    </header>
  );
}

function IdleState() {
  const steps = [
    ["Resolve", "Identify the exact listed security"],
    ["Gather", "Live fundamentals + web research"],
    ["Analyse", "Six specialist analyst agents"],
    ["Score", "Weighted, transparent scorecard"],
    ["Verdict", "Portfolio-manager decision + thesis"],
  ];
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-5">
      {steps.map(([t, d], i) => (
        <div
          key={t}
          className={cn(
            "rounded-xl border border-ink-700 bg-ink-900/60 p-4",
            "transition hover:border-brand-500/50",
          )}
        >
          <div className="text-xs font-mono text-brand-400">
            {String(i + 1).padStart(2, "0")}
          </div>
          <div className="mt-1 text-sm font-medium">{t}</div>
          <div className="mt-1 text-xs text-slate-400">{d}</div>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 pt-6 text-xs leading-relaxed text-slate-500">
      Built with Next.js, LangGraph.js &amp; Groq (Llama 3.3). Live data via
      Yahoo Finance &amp; Tavily.
      <br />
      For educational purposes only — not investment advice. Verify all figures
      before acting.
    </footer>
  );
}
