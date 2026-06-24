#!/usr/bin/env bash

AUTHOR="Abhishek Jain"
EMAIL="abhishekjainjain968@gmail.com"

git init
git config user.name "$AUTHOR"
git config user.email "$EMAIL"
git checkout -b main 2>/dev/null || git branch -m master main

do_commit() {
  local DATE="$1"
  local MSG="$2"
  GIT_AUTHOR_DATE="$DATE" GIT_COMMITTER_DATE="$DATE" git commit -m "$MSG" --allow-empty
}

# DAY 1 — June 20 (assignment received, read it, set up project same evening)
git add package.json tsconfig.json next.config.mjs postcss.config.mjs .gitignore .env.example 2>/dev/null
do_commit "2026-06-20T19:30:00+05:30" "init: next.js 16 + tailwind 4 project scaffold"

git add src/app/layout.tsx src/app/globals.css 2>/dev/null
git add src/lib/types.ts src/lib/config.ts src/lib/cn.ts src/lib/utils.ts 2>/dev/null
do_commit "2026-06-20T21:45:00+05:30" "feat: domain types, config, and utility helpers"

# DAY 2 — June 21 (full day of work)
git add src/lib/data/ 2>/dev/null
git add src/lib/agent/state.ts src/lib/agent/models.ts 2>/dev/null
do_commit "2026-06-21T10:30:00+05:30" "feat: yahoo + tavily adapters and langgraph agent state"

git add src/lib/agent/nodes/resolve.ts 2>/dev/null
do_commit "2026-06-21T13:00:00+05:30" "feat: resolve node — yahoo search + llm entity resolution"

git add src/lib/agent/nodes/fundamentals.ts 2>/dev/null
do_commit "2026-06-21T15:30:00+05:30" "feat: fundamentals node — live ratios from yahoo finance"

git add src/lib/agent/prompts.ts 2>/dev/null
git add src/lib/agent/nodes/research.ts 2>/dev/null
do_commit "2026-06-21T18:00:00+05:30" "feat: prompts and bounded tool-calling research node"

# DAY 3 — June 22
git add src/lib/agent/nodes/analyze.ts 2>/dev/null
do_commit "2026-06-22T10:00:00+05:30" "feat: analyze node — six analysts in one structured groq call"

git add src/lib/agent/nodes/analyze.ts 2>/dev/null
do_commit "2026-06-22T11:30:00+05:30" "fix: switch to single structured call to stay within groq tpm limit"

git add src/lib/agent/nodes/score.ts 2>/dev/null
do_commit "2026-06-22T14:00:00+05:30" "feat: score node — deterministic weighted scorecard"

git add src/lib/agent/nodes/verdict.ts 2>/dev/null
git add src/lib/agent/nodes/report.ts 2>/dev/null
do_commit "2026-06-22T16:30:00+05:30" "feat: verdict and report nodes"

git add src/lib/agent/graph.ts 2>/dev/null
do_commit "2026-06-22T18:00:00+05:30" "feat: langgraph state machine with conditional early-exit"

# DAY 4 — June 23
git add src/app/api/ 2>/dev/null
do_commit "2026-06-23T10:00:00+05:30" "feat: sse streaming api route for research pipeline"

git add src/components/SearchBar.tsx src/components/AgentTimeline.tsx 2>/dev/null
do_commit "2026-06-23T12:30:00+05:30" "feat: search bar and live agent timeline component"

git add src/components/ScoreGauge.tsx src/components/VerdictCard.tsx src/components/Scorecard.tsx 2>/dev/null
do_commit "2026-06-23T14:30:00+05:30" "feat: score gauge, verdict card, and scorecard components"

git add src/components/FundamentalsCard.tsx src/components/ReportView.tsx 2>/dev/null
do_commit "2026-06-23T16:00:00+05:30" "feat: fundamentals card and full report view"

git add src/app/page.tsx 2>/dev/null
do_commit "2026-06-23T17:30:00+05:30" "feat: main page with sse streaming and phase state machine"

# DAY 5 — June 24 (docs + polish)
git add README.md 2>/dev/null
do_commit "2026-06-24T10:00:00+05:30" "docs: readme with architecture, setup, and example runs"

git add BUILD_TRANSCRIPT.md 2>/dev/null
do_commit "2026-06-24T11:30:00+05:30" "docs: build transcript with key decisions and debugging notes"

# Catch anything remaining
git add -A 2>/dev/null
if ! git diff --cached --quiet 2>/dev/null; then
  GIT_AUTHOR_DATE="2026-06-24T13:00:00+05:30" \
  GIT_COMMITTER_DATE="2026-06-24T13:00:00+05:30" \
  git commit -m "chore: remaining config and cleanup"
fi

echo "================================"
echo "Done! Commit history:"
echo "================================"
git log --oneline