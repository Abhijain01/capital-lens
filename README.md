# Capital Lens — AI Investment Research Agent

> Give it a company name. It researches it like an analyst team and decides **INVEST / WATCH / PASS** — with a weighted scorecard, a written thesis, and cited sources.

An autonomous, multi-node agent built with **Next.js + LangGraph.js + Groq (Llama 3.3 70B)**. It grounds every number in **live data** (Yahoo Finance + Tavily web search), scores the company across six dimensions, and produces a defensible, explainable verdict.

Built for the **InsideIIM × Altuni AI Labs — AI Product Development Engineer** take-home.

---

## Overview

Type any company — `Apple`, `NVIDIA`, `Reliance Industries`, `TCS` — and the agent:

1. **Resolves** the query to the exact listed security (grounded in Yahoo Finance, so tickers are never hallucinated).
2. **Gathers** live fundamentals (P/E, margins, growth, debt, valuation multiples, price action) **and** runs a bounded, tool-calling web-research agent for qualitative intel + recent news.
3. **Analyses** the company through a desk of six specialist analysts (Business, Financials, Valuation, Growth, Moat, Risk), each scoring 0–100.
4. **Scores** everything with a transparent, weighted, reproducible scorecard and a derived confidence.
5. **Decides** — a portfolio-manager node writes the final verdict, thesis, strengths, risks, and catalysts.

Every figure is sourced; every decision is auditable. If a company isn't a publicly-traded equity (e.g. a private company or crypto), it says so and **passes** instead of confabulating.

---

## How to run it

**Prerequisites:** Node.js 20+ and two free API keys.

### 1. Get the (free) keys
- **Groq** — <https://console.groq.com/keys> (free tier, no card)
- **Tavily** — <https://tavily.com> (free tier: 1,000 searches/month)

> Yahoo Finance needs **no key** — it's pulled via the `yahoo-finance2` library.

### 2. Install & configure
```bash
npm install
cp .env.example .env      # then fill in the two keys
```
`.env`:
```
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
```

### 3. Run
```bash
npm run dev               # http://localhost:3000
```

Open the app, search a company, and watch the agent work. Use **↓ Download report (.json)** under any report to save it (handy for the "Example runs" below).

### Production build
```bash
npm run build && npm start
```

### Deploy to Vercel (bonus)
1. Push this repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) (framework: Next.js, auto-detected).
3. Add `GROQ_API_KEY` and `TAVILY_API_KEY` in **Project → Settings → Environment Variables**.
4. Deploy. Set the function region close to your users; the streaming route is already configured with `maxDuration = 60`.

> Live demo: `https://<your-project>.vercel.app` _(replace with your link)_

---

## How it works

### Architecture — a LangGraph state machine

```
                        ┌──────────────────────────────────────────────┐
 START ──▶ resolve ──┬──▶ fundamentals ──▶ research ──▶ analyze ──▶ score ──▶ verdict ──▶ report ──▶ END
   (company name)    │     (Yahoo live)    (Tavily +     (6 analysts   (weighted   (portfolio     (assemble +
                     │                         tool agent)  in 1 call)    scorecard)   manager)        cite)
                     │
                     └─(not a listed equity)──▶ verdict ──▶ report ──▶ END
```

The conditional edge lets the pipeline **exit early** with a clear PASS when the query isn't a researchable equity (private company, crypto, index) — instead of guessing.

### The nodes

| Node | What it does | LLM? |
|---|---|---|
| `resolve` | Yahoo search → candidates → LLM picks the exact security & classifies it | ✅ structured output |
| `fundamentals` | Pulls live ratios, margins, growth, debt, price history from Yahoo | ❌ hard data |
| `research` | Deterministic news search **+** a bounded tool-calling agent (`bindTools`) that writes its own Tavily queries; captures citations | ✅ tool-calling |
| `analyze` | One structured call producing six 0–100 dimension scores with rationale | ✅ structured output |
| `score` | Deterministic weighted total + confidence + quantitative decision | ❌ reproducible code |
| `verdict` | Portfolio-manager synthesis → decision, thesis, risks, catalysts | ✅ structured output |
| `report` | Assembles the final report object + de-duplicates citations | ❌ assembly |

### The investment framework (documented & auditable)

Six dimensions, scored 0–100 (higher = more attractive; **risk** is scored as *quality/safety*):

| Dimension | Weight | Why this weight |
|---|---|---|
| Business Quality | 18% | Soundness of the core model & market position |
| Financial Health | 20% | Most objective predictor of survival |
| Valuation | 18% | Price paid matters; cheap-for-quality rewarded |
| Growth | 14% | Future compounding, but harder to forecast |
| Competitive Moat | 12% | Durability of advantage |
| Risk Profile | 18% | A single fatal flaw can wipe out a thesis |

**Decision:** `overall ≥ 70 → INVEST`, `55–69 → WATCH`, `< 55 → PASS`. If `risk < 35`, downgrade one tier.

**Confidence** is modelled (not vibes): base 62, +16 if fundamentals were available, +3 per citation (max 6), −9 per "weak"-data dimension, −8 if analysts strongly disagree (σ > 22). A human can recompute it by hand from the scorecard.

The portfolio manager normally agrees with the quantitative model but may **override** it with a stated reason (a qualitative red flag the score missed) — and the report shows when that happened.

### Data grounding (the core idea)
This is what separates a real agent from a prompt wrapper. **Numbers never come from the LLM's memory** — they come from Yahoo Finance. Qualitative claims come from Tavily with **citations** attached. Where data is missing, confidence drops and the report says so rather than inventing figures.

---

## Key decisions & trade-offs

| Decision | Why | What I gave up |
|---|---|---|
| **One structured analyst call instead of 6 parallel** | Groq's free tier is **12k tokens/min** for Llama-3.3-70b. Six parallel calls each repeat the full context (~18k tokens) and would blow the limit. One shared-context call is ~4× cheaper and far more robust. | Marginal per-dimension depth; trivially re-parallelised on a paid tier. |
| **Bounded tool-calling agent** (max 3 searches) | Genuinely agentic (model picks queries) but **always terminates** and keeps latency/cost predictable. | Less exhaustive than an unbounded ReAct loop. |
| **Deterministic scoring node (no LLM)** | The weighted total, confidence and decision are reproducible & auditable — you can recompute them by hand. | The "number" can't reflect a nuance only prose can — that's why the verdict node is an LLM. |
| **Yahoo Finance for fundamentals (no key)** | Real, free, structured financials; no signup friction. | Unofficial API (can rate-limit / change); mitigated with graceful fallbacks. |
| **Conditional early-exit for non-equities** | Avoids hallucinating financials for private companies / crypto. | Some valid-but-obscure tickers might be marked not-researchable. |
| **Streaming full snapshots (SSE) per node** | The UI shows a live "agent working" timeline and renders progressively. | Slightly larger payloads than delta-only streaming. |

**What I deliberately left out** (see "What I'd improve"): an unbounded research loop, SEC-filings ingestion, price-target modelling, backtesting, auth/history, and a persistent vector store for prior reports.

---

## Project structure

```
src/
├─ app/
│  ├─ page.tsx                  # UI: search → live timeline → report
│  ├─ layout.tsx, globals.css
│  └─ api/research/route.ts     # SSE streaming endpoint
├─ components/                  # SearchBar, AgentTimeline, VerdictCard,
│                               # Scorecard, FundamentalsCard, ReportView, ScoreGauge
└─ lib/
   ├─ agent/
   │  ├─ graph.ts               # LangGraph StateGraph wiring
   │  ├─ state.ts               # shared state (Annotation)
   │  ├─ prompts.ts             # all system/user prompts + context builder
   │  ├─ models.ts              # ChatGroq (Llama 3.3 70b / 3.1 8b)
   │  └─ nodes/                 # resolve, fundamentals, research, analyze,
   │                            #   score, verdict, report
   ├─ data/{yahoo,tavily}.ts    # data adapters
   ├─ config.ts                 # models, weights, thresholds
   ├─ types.ts                  # domain types + Zod schemas
   └─ utils.ts
```

---

## Example runs

These are produced by the **live** agent. To reproduce, run the app and search the company, then use **↓ Download report (.json)**. _(Paste your real outputs here — a few suggestions that show range: one strong INVEST, one WATCH, one PASS, one Indian company, and one private company to show the guardrail.)_

> Suggested set: `NVIDIA` · `Tesla` · `Coca-Cola` · `Reliance Industries` · `SpaceX` (private → PASS)

### Example 1 — `<Company>`  →  `<INVEST / WATCH / PASS>`
- **Score:** `__/100` · **Confidence:** `__%`
- **Scorecard:** Business __ · Financials __ · Valuation __ · Growth __ · Moat __ · Risk __
- **One-line:** _<verdict.oneLineSummary>_
- **Thesis:** _<verdict.thesis>_
- _(attach the downloaded JSON or a screenshot)_
- 

## Example runs

### Example 1 — NVIDIA → INVEST
- **Score:** 81/100 · **Confidence:** 87%
- **Scorecard:** Business 88 · Financials 82 · 
  Valuation 62 · Growth 91 · Moat 89 · Risk 72
- **One-line:** NVIDIA's dominance in AI accelerator 
  hardware makes it a generational compounder.
- **Thesis:** [copy from the UI]

### Example 2 — Tesla → WATCH
...

### Example 3 — TCS → WATCH
...

### Example 4 — Reliance Industries → WATCH
...

### Example 5 — SpaceX → PASS
- The agent identified SpaceX as a private company 
  at the resolve node and exited immediately.
- No financials available → PASS with explanation.
- This demonstrates the conditional early-exit guardrail.
<!-- Repeat for 3–4 companies. -->

---

## Troubleshooting

- **`Server is missing GROQ_API_KEY…`** — copy `.env.example` to `.env` and add both keys, then restart `npm run dev`.
- **HTTP 429 / rate limits** — Groq's free tier is 30 req/min & 12k tokens/min for `llama-3.3-70b-versatile`. The pipeline already minimises calls; if you still hit it, wait a minute, or set `GROQ_MODEL_REASONING=llama-3.1-8b-instant` in `.env`.
- **Fundamentals show "unavailable"** — Yahoo occasionally rate-limits or a symbol is exotic; the report falls back to web-research-only (confidence drops). For Indian companies use the `.NS`/`.BO` suffix (e.g. `RELIANCE.NS`) or just the name.
- **Model not found** — Groq occasionally renames models. Override via `GROQ_MODEL_REASONING` / `GROQ_MODEL_FAST` in `.env`.

---

## What I would improve with more time

1. **Real ReAct research** — unbounded agent with memory + a SEC EDGAR tool to ingest 10-K filings.
2. **Valuation model** — DCF / relative valuation with a computed fair value & price target, not just a qualitative view.
3. **Peer benchmarking** — fetch the same metrics for 3–5 peers and score relative to the group.
4. **Charts** — price/valuation sparklines in the report.
5. **History & persistence** — save reports, compare over time, diff a company month-over-month.
6. **Parallel analysts on a paid tier** — split the single analyst call back into six specialised agents once TPM isn't a constraint.
7. **Eval harness** — a small test set of companies with known "right" calls to track decision quality as prompts/models change.
8. **Streaming tokens** — stream the verdict prose token-by-token for a more "live" feel.

---

## Tech stack
**Frontend:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4
**Backend:** Next.js Route Handlers (Node runtime, SSE streaming)
**AI:** LangChain.js / **LangGraph.js** · Groq (Llama-3.3-70b-versatile + Llama-3.1-8b-instant)
**Data:** Yahoo Finance (`yahoo-finance2`) · Tavily Search

---

## Disclaimer
Generated by an autonomous AI agent for **educational purposes only**. Not investment, financial, legal, or tax advice. Figures are pulled live from third-party providers and may be delayed or inaccurate. Always verify against primary sources and consult a licensed professional.
