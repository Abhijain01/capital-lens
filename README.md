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

All outputs are from the live agent (generated June 25, 2026).
Data sourced live from Yahoo Finance + Tavily.

---

### Example 1 — NVIDIA → INVEST
- **Score:** 87/100 · **Confidence:** 96% · **Conviction:** High
- **Scorecard:** Business 90 · Financials 95 · Valuation 70 · Growth 98 · Moat 92 · Risk 80
- **One-line:** NVIDIA is a leader in the AI computing market with a strong business model and growing demand for its products, making it an attractive investment opportunity.
- **Thesis:** NVIDIA's strong position in the AI computing market, combined with its growing demand and recent product announcements, make it an attractive investment opportunity. The company's business model is well-suited to capitalise on the growing demand for AI computing. While there are risks associated with intense competition and supply chain disruptions, the company's strengths and growth prospects outweigh these risks.
- **Key strengths:** Leader in AI computing market · Strong business model · Growing demand
- **Key risks:** Intense competition · Supply chain disruptions · Geopolitical tensions
- **Catalysts:** Strong earnings reports · Growing AI computing demand · Recent product announcements
- **Fair value:** Undervalued given strong growth prospects and competitive position
- **Live data:** Mkt cap $4.72T · P/E 29.82 · Fwd P/E 15.3 · Rev growth 85.2% · Net margin 63.0% · ROE 114.3%

---

### Example 2 — Microsoft → INVEST
- **Score:** 87/100 · **Confidence:** 96% · **Conviction:** High
- **Scorecard:** Business 90 · Financials 95 · Valuation 80 · Growth 85 · Moat 95 · Risk 80
- **One-line:** Microsoft's strong competitive position, diversified business model, and recent catalysts position the company for long-term success.
- **Thesis:** Microsoft's wide economic moat, diversified business model, and strong brand position the company for long-term success. The company's recent catalysts, such as new product releases and strategic shifts, further enhance its competitive edge. Its strong financial health and competitive moat mitigate key risks including intense competition and significant R&D investment.
- **Key strengths:** Wide economic moat · Diversified business model · Strong brand
- **Key risks:** Intense competition · Significant R&D investment · Reliance on key products
- **Notable:** Active securities fraud class action lawsuit (Copilot issues) captured by the research node — risk analysts flagged it but did not downgrade below INVEST given strong fundamentals.
- **Live data:** Mkt cap $2.65T · P/E 21.3 · Fwd P/E 18.45 · Rev growth 18.3% · Net margin 39.3% · Op margin 46.3%

---

### Example 3 — Amazon → INVEST
- **Score:** 85/100 · **Confidence:** 96% · **Conviction:** High
- **Scorecard:** Business 90 · Financials 85 · Valuation 70 · Growth 95 · Moat 95 · Risk 80
- **One-line:** Amazon is a dominant player in e-commerce and cloud computing with a strong competitive position and multiple growth drivers.
- **Thesis:** Amazon's wide economic moat, driven by network effects, brand loyalty, and technological edge, provides significant competitive advantages. Strong financials, high revenue growth, and diversified revenue streams (AWS, retail, ads) position it for continued success. AI investments and AWS growth are key catalysts.
- **Key strengths:** Wide economic moat · Strong brand loyalty · Technological edge
- **Key risks:** Increasing competition · Regulatory scrutiny · Supply chain risk
- **Live data:** Mkt cap $2.46T · P/E 30.84 · Fwd P/E 23.1 · Rev growth 16.6% · Free cash flow $9.81B

---

### Example 4 — TCS → INVEST
- **Score:** 82/100 · **Confidence:** 96% · **Conviction:** High
- **Scorecard:** Business 85 · Financials 90 · Valuation 70 · Growth 80 · Moat 90 · Risk 80
- **One-line:** TCS is a well-established company with a strong business model, competitive position, and growth drivers, making it an attractive investment opportunity.
- **Thesis:** TCS has a strong business model with diverse revenue streams generating over $30B in FY26. Growth drivers include strong brand value and increasing AI adoption revenue. Low debt (D/E 0.1), high ROE (48.4%), and strong cash generation underpin the financial case. Analyst target of ₹2,944 vs current ₹2,094 implies ~41% upside.
- **Key strengths:** Strong brand · Diverse revenue streams · Increasing AI revenue
- **Key risks:** AI impact on hiring · Competitive IT services landscape
- **Indian market note:** Agent correctly resolved "TCS" → `TCS.NS` (NSE) and pulled INR-denominated fundamentals.
- **Live data:** Mkt cap ₹7.58T · P/E 15.4 · Fwd P/E 12.63 · Rev growth 9.6% · Div yield 5.9% · Beta 0.23

---

### Example 5 — Tesla → WATCH ⚠️ (LLM overrode quant model)
- **Score:** 50/100 · **Confidence:** 42% · **Conviction:** Medium
- **Quant model said:** PASS · **Portfolio manager overrode to:** WATCH
- **One-line:** Tesla's growth potential and unique business model justify a watch despite overvaluation concerns.
- **Why the override:** The quantitative scorecard scored all 6 dimensions at 50 (neutral fallback) because the Groq analyze call hit a rate limit — the agent's fallback chain engaged and defaulted to 50/50 neutral scores with `dataQuality: "weak"`. Confidence dropped to 42% accordingly. The portfolio manager LLM, reading the qualitative research, upgraded from PASS to WATCH because of Tesla's genuine long-term potential — and flagged the low confidence explicitly.
- **What this demonstrates:** Two key agent behaviours working correctly — (1) the fallback chain preventing a crash, and (2) the LLM override with a stated reason when the quant model's data quality is too weak to trust.
- **Key risks:** Intense competition · Overvaluation (P/E 341.6) · FSD regulatory challenges · Quality issues
- **Live data:** Mkt cap $1.4T · P/E 341.6 · PEG 5.79 · EV/EBITDA 124.59 · Rev growth 15.8% · Op margin 4.2%

---

### Example 6 — SpaceX (SPCX) → WATCH
- **Score:** 64/100 · **Confidence:** 96% · **Conviction:** Medium
- **Scorecard:** Business 80 · Financials 60 · Valuation 55 · Growth 70 · Moat 85 · Risk 40
- **One-line:** SpaceX's strong competitive moat and growth drivers are offset by high valuation, intense competition, and development costs, warranting a WATCH decision.
- **Note on private company guardrail:** SpaceX recently completed its IPO (ticker: SPCX on NASDAQ) — the resolve node correctly identified it as a listed equity and ran the full pipeline. Had it still been private, the agent would have exited at the resolve node with an immediate PASS and a clear explanation. Try searching `"Stripe"` to see that guardrail in action.
- **Risk downgrade triggered:** Risk score of 40 is below the `RISK_DOWNGRADE_FLOOR` of 35 — close but did not trigger. If risk had scored below 35, the decision would have been automatically downgraded from WATCH to PASS.
- **Key strengths:** Rocket reusability · Vertical integration · Competitive moat
- **Key risks:** Intense competition · High Starship development costs · Regulatory challenges
- **Live data:** Mkt cap $2.04T · Fwd P/E 787 · EV/EBITDA 230 · Op margin -41.6% · Net margin -45.0%
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
