"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface Props {
  onSubmit: (company: string) => void;
  disabled?: boolean;
  examples?: string[];
}

export function SearchBar({ onSubmit, disabled, examples }: Props) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = value.trim();
    if (c && !disabled) onSubmit(c);
  };

  const pick = (ex: string) => {
    if (disabled) return;
    setValue(ex);
    onSubmit(ex);
  };

  return (
    <form onSubmit={submit}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-900/70 p-2 pl-4 shadow-xl shadow-black/20 backdrop-blur",
          "focus-within:border-brand-500/70 focus-within:ring-2 focus-within:ring-brand-500/20",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-slate-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search any company — Apple, NVIDIA, Reliance, TCS…"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
            disabled || !value.trim()
              ? "cursor-not-allowed bg-ink-700 text-slate-500"
              : "bg-gradient-to-br from-brand-400 to-indigo-500 text-ink-950 hover:brightness-110",
          )}
        >
          {disabled ? "Researching…" : "Research"}
        </button>
      </div>

      {examples?.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Try:</span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={disabled}
              onClick={() => pick(ex)}
              className={cn(
                "rounded-full border border-ink-700 bg-ink-900/60 px-3 py-1 text-xs text-slate-300 transition",
                disabled
                  ? "opacity-50"
                  : "hover:border-brand-500/50 hover:text-slate-100",
              )}
            >
              {ex}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
