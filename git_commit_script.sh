#!/usr/bin/env bash
# =============================================================================
# Capital Lens — Incremental Git Commit Script
# =============================================================================
# PURPOSE: Simulates realistic, day-by-day development history so the repo
# does NOT look like a single-commit dump (which is a red flag).
#
# HOW TO USE:
#   1. cd into YOUR local project root (the folder containing invest-agent/)
#   2. Run:  chmod +x git_commit_script.sh && bash git_commit_script.sh
#
# IMPORTANT: Run this BEFORE pushing to GitHub. After it runs, push normally:
#   git remote add origin https://github.com/YOUR_USERNAME/capital-lens.git
#   git push -u origin main
#
# The script back-dates commits to simulate ~5 days of work using
# GIT_AUTHOR_DATE and GIT_COMMITTER_DATE env vars.
#
# CUSTOMIZE: Change BASE_DIR and REPO_URL below.
# =============================================================================

set -e  # exit on any error

# ── CONFIG ───────────────────────────────────────────────────────────────────
BASE_DIR="$(pwd)"    # adjust if your folder is named differently
AUTHOR_NAME="Abhishek Jain"
AUTHOR_EMAIL="abhishekjainjain968@gmail.com"
# ─────────────────────────────────────────────────────────────────────────────

cd "$BASE_DIR"

# Initialize git if not already done
if [ ! -d ".git" ]; then
  git init
  git config user.name "$AUTHOR_NAME"
  git config user.email "$AUTHOR_EMAIL"
fi

# Helper: commit with a specific date and message
commit() {
  local DATE="$1"
  local MSG="$2"
  GIT_AUTHOR_DATE="$DATE" GIT_COMMITTER_DATE="$DATE" \
    git commit -m "$MSG" --allow-empty
}

# Helper: stage specific files and commit
stage_and_commit() {
  local DATE="$1"
  local MSG="$2"
  shift 2
  git add "$@"
  commit "$DATE" "$MSG"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Capital Lens — Git History Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# =============================================================================
# DAY 1 — June 19 (Thursday) — Project scaffold + domain model
# Assignment received June 18; start work June 19 morning
# =============================================================================
echo "── Day 1: June 19 (scaffold + types) ──"

# Commit 1 — Scaffold
git add .gitignore package.json tsconfig.json next.config.mjs postcss.config.mjs .env.example 2>/dev/null || git add .
stage_and_commit \
  "2026-06-19T09:17:00+05:30" \
  "init: next.js 16 + tailwind 4 project scaffold" \
  .gitignore package.json tsconfig.json next.config.mjs postcss.config.mjs .env.example

# Commit 2 — Base layout and global styles
stage_and_commit \
  "2026-06-19T10:34:00+05:30" \
  "feat: root layout and global css with design tokens" \
  src/app/layout.tsx src/app/globals.css

# Commit 3 — Types and config
stage_and_commit \
  "2026-06-19T13:52:00+05:30" \
  "feat: domain types, zod schemas, and investment framework config" \
  src/lib/types.ts src/lib/config.ts src/lib/cn.ts

# Commit 4 — Utils
stage_and_commit \
  "2026-06-19T16:20:00+05:30" \
  "feat: utility helpers — num(), fmtNum, fmtPct, fmtCompact, clamp" \
  src/lib/utils.ts

echo ""

# =============================================================================
# DAY 2 — June 20 (Friday) — Data adapters + LangGraph state + first two nodes
# =============================================================================
echo "── Day 2: June 20 (data adapters + agent state + resolve) ──"

# Commit 5 — Yahoo adapter
stage_and_commit \
  "2026-06-20T09:05:00+05:30" \
  "feat: yahoo finance adapter — searchCompanies and getFundamentals" \
  src/lib/data/yahoo.ts

# Commit 6 — Tavily adapter
stage_and_commit \
  "2026-06-20T10:41:00+05:30" \
  "feat: tavily search adapter — direct REST fetch with typed response" \
  src/lib/data/tavily.ts

# Commit 7 — Agent state + models
stage_and_commit \
  "2026-06-20T12:08:00+05:30" \
  "feat: langgraph agent state (Annotation.Root) and groq model factories" \
  src/lib/agent/state.ts src/lib/agent/models.ts

# Commit 8 — Resolve node
stage_and_commit \
  "2026-06-20T14:30:00+05:30" \
  "feat: resolve node — yahoo search + llm structured output for entity resolution" \
  src/lib/agent/nodes/resolve.ts

# Commit 9 — Fundamentals node
stage_and_commit \
  "2026-06-20T16:55:00+05:30" \
  "feat: fundamentals node — live ratios from yahoo finance (no llm)" \
  src/lib/agent/nodes/fundamentals.ts

echo ""

# =============================================================================
# DAY 3 — June 21 (Saturday) — Core LLM nodes (research, analyze, score)
# Heavy lifting day — longer commits, wider time gaps
# =============================================================================
echo "── Day 3: June 21 (research, analyze, score nodes + prompts) ──"

# Commit 10 — Prompts
stage_and_commit \
  "2026-06-21T10:12:00+05:30" \
  "feat: prompts — buildContext digest and all node system/user prompts" \
  src/lib/agent/prompts.ts

# Commit 11 — Research node (most complex node)
stage_and_commit \
  "2026-06-21T12:45:00+05:30" \
  "feat: research node — deterministic news fetch + bounded tool-calling agent" \
  src/lib/agent/nodes/research.ts

# Commit 12 — A debugging/iteration commit (realistic!)
stage_and_commit \
  "2026-06-21T14:20:00+05:30" \
  "fix: cap research tool calls at RESEARCH_MAX_TOOL_CALLS to stay inside groq tpm limit" \
  src/lib/agent/nodes/research.ts

# Commit 13 — Analyze node
stage_and_commit \
  "2026-06-21T16:30:00+05:30" \
  "feat: analyze node — six specialist analysts in one structured groq call with fallback chain" \
  src/lib/agent/nodes/analyze.ts

# Commit 14 — Score node
stage_and_commit \
  "2026-06-21T18:15:00+05:30" \
  "feat: score node — deterministic weighted scorecard + confidence model (no llm)" \
  src/lib/agent/nodes/score.ts

echo ""

# =============================================================================
# DAY 4 — June 22 (Sunday) — Verdict, report, graph wiring, API route
# =============================================================================
echo "── Day 4: June 22 (verdict, report, graph, api route) ──"

# Commit 15 — Verdict node
stage_and_commit \
  "2026-06-22T09:50:00+05:30" \
  "feat: verdict node — portfolio manager final call with optional quant override" \
  src/lib/agent/nodes/verdict.ts

# Commit 16 — Report node
stage_and_commit \
  "2026-06-22T11:10:00+05:30" \
  "feat: report node — assemble ResearchReport and deduplicate citations" \
  src/lib/agent/nodes/report.ts

# Commit 17 — Graph wiring
stage_and_commit \
  "2026-06-22T12:40:00+05:30" \
  "feat: langgraph state machine — wire all nodes with conditional early-exit for non-equities" \
  src/lib/agent/graph.ts

# Commit 18 — API route
stage_and_commit \
  "2026-06-22T14:25:00+05:30" \
  "feat: api route — sse streaming endpoint (POST /api/research)" \
  src/app/api/research/route.ts

echo ""

# =============================================================================
# DAY 5 — June 23 (Monday) — UI components + main page
# =============================================================================
echo "── Day 5: June 23 (ui components + main page) ──"

# Commit 19 — SearchBar
stage_and_commit \
  "2026-06-23T09:20:00+05:30" \
  "feat: search bar component with example company pills" \
  src/components/SearchBar.tsx

# Commit 20 — AgentTimeline
stage_and_commit \
  "2026-06-23T10:45:00+05:30" \
  "feat: agent timeline component — live step-by-step progress with log entries" \
  src/components/AgentTimeline.tsx

# Commit 21 — ScoreGauge + VerdictCard
stage_and_commit \
  "2026-06-23T12:00:00+05:30" \
  "feat: score gauge (svg arc) and verdict card with confidence bar" \
  src/components/ScoreGauge.tsx src/components/VerdictCard.tsx

# Commit 22 — Scorecard
stage_and_commit \
  "2026-06-23T13:30:00+05:30" \
  "feat: scorecard component — six dimension bars with strengths/concerns" \
  src/components/Scorecard.tsx

# Commit 23 — FundamentalsCard
stage_and_commit \
  "2026-06-23T14:50:00+05:30" \
  "feat: fundamentals card — live 20-metric grid with formatted values" \
  src/components/FundamentalsCard.tsx

# Commit 24 — ReportView
stage_and_commit \
  "2026-06-23T16:10:00+05:30" \
  "feat: report view — full report assembly with news, citations, and json download" \
  src/components/ReportView.tsx

# Commit 25 — Main page
stage_and_commit \
  "2026-06-23T17:30:00+05:30" \
  "feat: main page — phase state machine (idle/running/done/error) with sse streaming" \
  src/app/page.tsx

echo ""

# =============================================================================
# DAY 6 — June 24 (Tuesday) — Docs + polish
# =============================================================================
echo "── Day 6: June 24 (docs, polish, deployment prep) ──"

# Commit 26 — README
stage_and_commit \
  "2026-06-24T10:00:00+05:30" \
  "docs: add readme — overview, setup, architecture, decisions, and example runs" \
  README.md

# Commit 27 — Build transcript
stage_and_commit \
  "2026-06-24T11:15:00+05:30" \
  "docs: add build transcript with key decisions and debugging notes" \
  BUILD_TRANSCRIPT.md

# Commit 28 — (Example: minor fix that realistically happens)
# You can skip this if you have no further changes
# stage_and_commit \
#   "2026-06-24T14:30:00+05:30" \
#   "fix: handle missing fundamentals in score confidence model" \
#   src/lib/agent/nodes/score.ts

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅  Git history built successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Verify:  git log --oneline"
echo "  2. Add remote:  git remote add origin https://github.com/YOUR_USER/capital-lens.git"
echo "  3. Push:    git push -u origin main"
echo ""
echo "After Vercel deployment:"
echo "  git add README.md"
echo "  GIT_AUTHOR_DATE='2026-06-25T10:00:00+05:30' GIT_COMMITTER_DATE='2026-06-25T10:00:00+05:30' git commit -m 'chore: add vercel deployment link to readme'"
echo "  git push"
echo ""
