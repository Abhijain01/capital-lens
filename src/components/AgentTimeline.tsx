"use client";

import { cn } from "@/lib/cn";
import type { LogEntry } from "@/lib/types";

interface Props {
  currentStep: string;
  logs: LogEntry[];
}

const STEPS: { key: string; label: string; sub: string }[] = [
  { key: "resolve", label: "Resolve company", sub: "Find the exact security" },
  { key: "fundamentals", label: "Live fundamentals", sub: "Yahoo Finance data" },
  { key: "research", label: "Web research", sub: "News + qualitative intel" },
  { key: "analyze", label: "Six analysts", sub: "Score each dimension" },
  { key: "score", label: "Scorecard", sub: "Weighted, transparent" },
  { key: "verdict", label: "Verdict", sub: "Portfolio-manager call" },
  { key: "report", label: "Build report", sub: "Assemble & cite" },
];

type Status = "done" | "active" | "skipped" | "pending";

export function AgentTimeline({ currentStep, logs }: Props) {
  const completed = new Set(logs.map((l) => l.step));
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const statusFor = (key: string, idx: number): Status => {
    if (completed.has(key)) return "done";
    if (key === currentStep) return "active";
    if (currentIndex !== -1 && idx < currentIndex) return "skipped";
    return "pending";
  };

  const messageFor = (key: string): string | undefined =>
    [...logs].reverse().find((l) => l.step === key)?.message;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-400" />
        </span>
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">
          Agent working
        </h2>
        <span className="ml-auto font-mono text-[11px] text-slate-500">
          {currentStep}
        </span>
      </div>

      <ol className="space-y-1">
        {STEPS.map((s, idx) => {
          const status = statusFor(s.key, idx);
          const msg = messageFor(s.key);
          return (
            <li
              key={s.key}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2 transition",
                status === "active" && "bg-brand-500/10",
              )}
            >
              <Indicator status={status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      status === "pending"
                        ? "text-slate-500"
                        : status === "skipped"
                          ? "text-slate-600 line-through"
                          : "text-slate-200",
                    )}
                  >
                    {s.label}
                  </span>
                  {status === "skipped" && (
                    <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                      n/a
                    </span>
                  )}
                </div>
                {(status === "done" || status === "active") && msg ? (
                  <p className="mt-0.5 truncate text-xs text-slate-400">{msg}</p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-600">{s.sub}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Indicator({ status }: { status: Status }) {
  if (status === "done") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bull/20 text-bull">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-ink-600 text-[10px] text-slate-600">
        –
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-700" />
  );
}
