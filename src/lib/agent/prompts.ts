import type { AgentStateType } from "@/lib/agent/state";
import {
  DIMENSION_LABELS,
  DISCLAIMER,
  type Dimension,
} from "@/lib/config";
import { fmtCompact, fmtNum, fmtPct } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Shared context digest — turns the raw gathered data into a clean
 * markdown brief that every downstream LLM call reads. Centralising it
 * keeps prompts consistent and token usage predictable.
 * ------------------------------------------------------------------ */
export function buildContext(state: AgentStateType): string {
  const r = state.resolved;
  const f = state.fundamentals;
  const lines: string[] = [];

  lines.push(`# COMPANY`);
  lines.push(
    `- Name: ${r?.name ?? state.company}`,
  );
  if (r?.ticker) lines.push(`- Ticker: ${r.ticker} (${r.exchange ?? ""})`);
  if (r?.sector) lines.push(`- Sector / Industry: ${r.sector} / ${r.industry ?? ""}`);
  if (r?.country) lines.push(`- Country: ${r.country}`);
  if (f?.currency) lines.push(`- Reporting currency: ${f.currency}`);
  if (f?.website) lines.push(`- Website: ${f.website}`);

  if (f?.businessDescription) {
    lines.push(`\n# BUSINESS DESCRIPTION`);
    lines.push(f.businessDescription.slice(0, 1800));
  }

  if (f) {
    lines.push(`\n# KEY FINANCIALS (live, from market data provider)`);
    const kv: string[] = [];
    const push = (label: string, v?: string | null) => {
      if (v != null && v !== "—") kv.push(`- ${label}: ${v}`);
    };
    push("Market cap", f.marketCap != null ? fmtCompact(f.marketCap) : null);
    push("Share price", f.sharePrice != null ? fmtNum(f.sharePrice) : null);
    push("P/E (trailing)", f.peTrailing != null ? fmtNum(f.peTrailing) : null);
    push("P/E (forward)", f.peForward != null ? fmtNum(f.peForward) : null);
    push("P/B", f.priceToBook != null ? fmtNum(f.priceToBook) : null);
    push("PEG", f.pegRatio != null ? fmtNum(f.pegRatio) : null);
    push("EV/EBITDA", f.evToEbitda != null ? fmtNum(f.evToEbitda) : null);
    push("EV/Revenue", f.evToRevenue != null ? fmtNum(f.evToRevenue) : null);
    push("Dividend yield", f.dividendYield != null ? fmtPct(f.dividendYield) : null);
    push("Beta", f.beta != null ? fmtNum(f.beta) : null);
    push("Revenue (TTM)", f.revenue != null ? fmtCompact(f.revenue) : null);
    push("Revenue growth", f.revenueGrowth != null ? fmtPct(f.revenueGrowth) : null);
    push("Gross margin", f.grossMargin != null ? fmtPct(f.grossMargin) : null);
    push("Operating margin", f.operatingMargin != null ? fmtPct(f.operatingMargin) : null);
    push("Net margin", f.netMargin != null ? fmtPct(f.netMargin) : null);
    push("ROE", f.roe != null ? fmtPct(f.roe) : null);
    push("Debt/equity", f.debtToEquity != null ? fmtNum(f.debtToEquity) : null);
    push("Current ratio", f.currentRatio != null ? fmtNum(f.currentRatio) : null);
    push("Operating cash flow", f.operatingCashflow != null ? fmtCompact(f.operatingCashflow) : null);
    push("Free cash flow", f.freeCashflow != null ? fmtCompact(f.freeCashflow) : null);
    push("Analyst target (mean)", f.targetMeanPrice != null ? fmtNum(f.targetMeanPrice) : null);
    push("Analyst recommendation", f.recommendation ?? null);
    push("1Y price return", f.perfOneYear != null ? fmtPct(f.perfOneYear) : null);
    push("YTD price return", f.perfYtd != null ? fmtPct(f.perfYtd) : null);
    lines.push(kv.length ? kv.join("\n") : "- (no structured financials available)");
  }

  if (state.qualitative?.trim()) {
    lines.push(`\n# QUALITATIVE RESEARCH (from live web search)`);
    lines.push(state.qualitative.slice(0, 6000));
  }

  if (state.news.length) {
    lines.push(`\n# RECENT NEWS`);
    for (const n of state.news.slice(0, 8)) {
      lines.push(`- (${n.publishedDate?.slice(0, 10) ?? "?"}) ${n.title}${n.snippet ? " — " + n.snippet.slice(0, 220) : ""}`);
    }
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------ *
 * Node prompts
 * ------------------------------------------------------------------ */

export function resolvePrompt(company: string, candidates: string): { system: string; user: string } {
  return {
    system:
      "You resolve an investor's free-text company query to a single, exact, publicly-traded security. " +
      "You are given Yahoo Finance search candidates (symbol, name, exchange, type). " +
      "Pick the best match for an equity-investment decision. " +
      "If the entity is a private company, a crypto, an index, or otherwise NOT a listed equity you can " +
      "pull real financials for, set isPublicEquity=false, ticker='' and explain in `reason`. " +
      "Never invent a ticker — only use one from the candidates, or leave it empty.",
    user:
      `Investor query: "${company}"\n\n` +
      `Yahoo Finance candidates:\n${candidates}\n\n` +
      `Return the single best match (or mark not-researchable).`,
  };
}

export function researchPrompt(state: AgentStateType): { system: string; user: string } {
  const r = state.resolved;
  return {
    system:
      "You are an equity research associate gathering qualitative intelligence from the live web. " +
      "Use the web_search tool to find CURRENT, specific, citable information. " +
      "Focus on: (1) what the company does and how it makes money, (2) its competitive position and moat, " +
      "(3) growth drivers and recent catalysts, (4) the key risks and any red flags, (5) recent analyst/market sentiment. " +
      "Prefer concrete facts, numbers, and named competitors over vague generalities. " +
      "Run up to 3 well-targeted searches, then write a structured research brief citing what you found. " +
      "Do NOT invent facts. If information is missing, say so.",
    user:
      `Company: ${r?.name ?? state.company}${r?.ticker ? ` (${r.ticker})` : ""}\n` +
      `Sector: ${r?.sector ?? "unknown"} / ${r?.industry ?? "unknown"}\n` +
      (state.fundamentals?.businessDescription
        ? `\nKnown description: ${state.fundamentals.businessDescription.slice(0, 600)}\n`
        : "") +
      `\nNow run your searches and write the brief.`,
  };
}

const ANALYST_BRIEFS: Record<Dimension, string> = {
  business:
    "Evaluate the core business: Is the business model sound? Is revenue high-quality/recurring? " +
    "Is the company a leader in a growing end-market? Score the quality of the business itself.",
  financials:
    "Evaluate financial health: profitability (margins, ROE), balance-sheet strength (debt/equity, cash, current ratio), " +
    "and cash generation (operating & free cash flow). Higher margins/ROE and lower leverage score higher.",
  valuation:
    "Evaluate valuation vs worth: P/E, forward P/E, PEG, EV/EBITDA, EV/Revenue vs peers and history. " +
    "Cheaper-for-the-quality scores higher. Expensive even if great = lower. Judge if price is reasonable.",
  growth:
    "Evaluate growth: revenue growth, earnings growth, and forward growth runway. " +
    "Faster, more durable growth scores higher. Stagnant/declining scores lower.",
  moat:
    "Evaluate the competitive moat: brand, switching costs, network effects, scale/cost advantage, IP/regulatory " +
    "advantages, and how defensible the position is. A strong, durable moat scores higher.",
  risk:
    "Evaluate the RISK PROFILE where a HIGHER score means SAFER / higher quality. Consider leverage, cyclicality, " +
    "concentration, regulatory/legal/ESG issues, competition, valuation risk, and any red flags from the news. " +
    "A very risky company should get a LOW score here.",
};

export function analystsPrompt(state: AgentStateType): { system: string; user: string } {
  const dims = (Object.keys(ANALYST_BRIEFS) as Dimension[]).map(
    (d) =>
      `### ${DIMENSION_LABELS[d]} (key: "${d}")\n${ANALYST_BRIEFS[d]}`,
  );
  return {
    system:
      "You are a desk of six senior equity analysts (business, financials, valuation, growth, moat, risk). " +
      "Each analyst scores ONE dimension 0-100 where higher is always more attractive (risk is scored as " +
      "quality/safety, so safer = higher). Be rigorous, balanced and specific — anchor every score to the data " +
      "given; if data is thin, lower the score modestly and mark dataQuality accordingly. Reference actual " +
      "numbers/facts in each rationale. Return one object with a key per dimension.",
    user:
      `${buildContext(state)}\n\n` +
      `# DIMENSIONS TO SCORE\n${dims.join("\n\n")}\n\n` +
      `Score all six dimensions now.`,
  };
}

export function verdictPrompt(
  state: AgentStateType,
  quantDecision: string,
  overall: number,
  confidence: number,
): { system: string; user: string } {
  const items = state.scorecard?.items
    .map((i) => `- ${i.name}: ${i.score}/100 (weight ${(i.weight * 100).toFixed(0)}%)`)
    .join("\n");
  return {
    system:
      "You are the portfolio manager making the final INVEST / WATCH / PASS call. " +
      "Synthesize the analyst scorecard and the research into a crisp, defensible decision. " +
      "Be decisive but honest about uncertainty. Write a real thesis, not platitudes. " +
      "You normally agree with the quantitative model decision, but you may override it ONLY with a specific, " +
      "compelling reason (e.g. a qualitative red flag the score didn't capture). Return strict structured output.",
    user:
      `${buildContext(state)}\n\n` +
      `# QUANTITATIVE SCORECARD\n${items}\n` +
      `Weighted overall: ${overall}/100. Model confidence: ${confidence}/100.\n` +
      `Quantitative model decision: ${quantDecision}\n\n` +
      `Decision rules of thumb: >=70 INVEST, 55-69 WATCH, <55 PASS. ` +
      `Risk below 35 downgrades one tier.\n\n` +
      `Make the final call.`,
  };
}

export const DISCLAIMER_TEXT = DISCLAIMER;
