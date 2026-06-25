# Build Transcript — Capital Lens

> **Bonus section.** The assignment awards bonus points for the LLM chat
> > The **complete, verbatim LLM chat session** used to build this project
> is included in `LLM_CHAT_TRANSCRIPT.md`. It contains the full 
> conversation with Claude (Anthropic) covering architecture decisions,
> implementation, debugging, deployment, and iteration.
> This document is a curated summary of the key turning points.
> The raw transcript is the primary bonus submission.
> summary of the key decisions and turning points — useful as a quick read
> of how the product was actually designed.

## How I (the developer) used AI
- **As an architecture sparring partner** — debated single-prompt vs.
  multi-node vs. multi-agent, and chose the LangGraph state machine.
- **As the implementation engine** — wrote the nodes, prompts, adapters
  and UI from the agreed spec.
- **As a research assistant** — verified current Groq model IDs, rate
  limits, and Yahoo/Tavily API shapes.
- Throughout, I reviewed every line and can explain it.

## Key turning points (curated)

### 1. Reframed the task from "answer a question" to "build an analyst team"
First instinct was a single prompt ("analyse X, invest or not?"). Rejected
it: that's what most submissions do, it hallucinates numbers, and shows no
skill. Pivoted to a **grounded, multi-node agent with a defensible
framework**.

### 2. Chose grounding over fluency as the core differentiator
Decided numbers must come from Yahoo Finance and qualitative claims from
Tavily with citations — **never from the LLM's memory**. This became the
central design principle and is what makes the output trustworthy.

### 3. Added a conditional early-exit for non-equities
Realised "invest or pass" is undefined for private companies / crypto.
Added a resolve → verdict short-circuit so the agent **passes with a
reason** instead of confabulating. (Try `SpaceX`.)

### 4. Replaced 6 parallel analyst calls with 1 structured call
**Mid-build discovery:** looked up Groq free-tier limits and found
`llama-3.3-70b-versatile` is capped at **12k tokens/min**. Six parallel
calls each repeating the context (~18k tokens) would blow the limit and
silently degrade the report via fallbacks. Switched to **one structured
call that scores all six dimensions** — ~4× fewer tokens, more robust, and
trivially re-parallelisable later. Documented as an explicit trade-off.

### 5. Kept scoring deterministic
Resisted making the score an LLM output. The weighted total, confidence and
quantitative decision are **pure code** so they're reproducible and a human
can audit them. The LLM only *narrates* the verdict (and may override the
quant call with a stated reason).

### 6. Made the agent "bounded"
The research node uses real tool-calling (`bindTools`) so the model chooses
its own queries — but capped at 3 invocations so it **always terminates**.
Genuinely agentic, yet predictable.

## Notable debugging moments
- LangGraph `Annotation` channels don't accept a default-only config object
  in this version — switched scalars to the simple form, kept the append
  reducer only for `logs`.
- Typed every node return as `StateUpdate` to satisfy the graph's node
  action contract.
- `ToolMessage.tool_call_id` requires a string, but `tool_calls[].id` is
  optional — guarded with `?? ""`.
- Verified `@langchain/groq` `ChatGroq`, `withStructuredOutput`, `bindTools`,
  and `tool()` signatures against the *installed* versions before trusting
  them (the ecosystem is ahead of training data).

## What I'd watch next (honest risks)
- Yahoo's unofficial API can rate-limit → fundamentals may go missing
  (handled; confidence drops).
- Tavily content quality varies → analysts rely on it for qualitative
  depth.
- Llama 3.3 70b is strong but not frontier — verdict prose is good, not
  GPT-4-class.
