import { tool } from "@langchain/core/tools";
import {
  SystemMessage,
  HumanMessage,
  ToolMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import { reasoningModel } from "@/lib/agent/models";
import { researchPrompt } from "@/lib/agent/prompts";
import { tavilySearch } from "@/lib/data/tavily";
import { RESEARCH_MAX_TOOL_CALLS } from "@/lib/config";
import { domainFromUrl, nowIso } from "@/lib/utils";
import type { NewsItem, Citation } from "@/lib/types";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/**
 * Node 3 — Qualitative research.
 *
 * Two parts:
 *  (a) A deterministic "news" search → clean structured recent news +
 *      recency signal + citations.
 *  (b) A BOUNDED tool-calling agent: the model is given a `web_search`
 *      tool (via bindTools) and decides its own queries, capped at
 *      RESEARCH_MAX_TOOL_CALLS invocations. Bounded = always terminates
 *      and keeps latency/cost predictable, while still being genuinely
 *      agentic. Every tool execution captures a citation so the final
 *      report can link its sources.
 */
export async function researchNode(state: AgentStateType): Promise<StateUpdate> {
  const citations: Citation[] = [];
  const news: NewsItem[] = [];

  const capture = (results: { title: string; url: string; content: string }[]) => {
    for (const r of results) {
      if (!r.url) continue;
      citations.push({
        title: r.title,
        url: r.url,
        source: domainFromUrl(r.url),
        snippet: r.content.slice(0, 300),
      });
    }
  };

  // (a) deterministic recent-news search
  try {
    const q = `${state.resolved?.name ?? state.company} ${state.resolved?.ticker ?? ""} news`.trim();
    const res = await tavilySearch({ query: q, topic: "news", maxResults: 6 });
    for (const r of res.results) {
      news.push({
        title: r.title,
        url: r.url,
        source: domainFromUrl(r.url),
        snippet: r.content.slice(0, 280),
      });
    }
    capture(res.results);
  } catch {
    /* news is best-effort */
  }

  // (b) bounded agentic research loop
  const searchTool = tool(
    async ({ query }) => {
      try {
        const res = await tavilySearch({
          query,
          topic: "general",
          maxResults: 5,
          searchDepth: "advanced",
        });
        capture(res.results);
        const blob = res.results
          .map(
            (r, i) =>
              `[${i + 1}] ${r.title}\n${r.url}\n${r.content.slice(0, 500)}`,
          )
          .join("\n\n");
        return (res.answer ? `Answer: ${res.answer}\n\n` : "") + blob;
      } catch (e) {
        return `Search failed: ${e instanceof Error ? e.message : "unknown error"}`;
      }
    },
    {
      name: "web_search",
      description:
        "Search the live web for current, specific information about the company: its business model, competitors, competitive moat, recent catalysts, key risks, and analyst/market sentiment.",
      schema: z.object({
        query: z.string().describe("A targeted search query"),
      }),
    },
  );

  const model = reasoningModel(0.3).bindTools([searchTool]);
  const { system, user } = researchPrompt(state);
  const messages: BaseMessage[] = [
    new SystemMessage(system),
    new HumanMessage(user),
  ];

  let toolCalls = 0;
  for (let i = 0; i <= RESEARCH_MAX_TOOL_CALLS; i++) {
    const res = (await model.invoke(messages)) as AIMessage;
    messages.push(res);
    const calls = res.tool_calls ?? [];
    if (!calls.length || toolCalls >= RESEARCH_MAX_TOOL_CALLS) break;
    for (const tc of calls) {
      if (toolCalls >= RESEARCH_MAX_TOOL_CALLS) break;
      toolCalls++;
      const out = await searchTool.invoke(tc.args as { query: string });
      messages.push(
        new ToolMessage({
          tool_call_id: tc.id ?? "",
          content:
            typeof out === "string" ? out : JSON.stringify(out),
        }),
      );
    }
  }

  const qualitative = messages
    .filter((m): m is AIMessage => m instanceof AIMessage)
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n\n")
    .trim();

  return {
    qualitative,
    news,
    citations,
    currentStep: "research",
    logs: [
      {
        step: "research",
        message: `Web research complete (${toolCalls} searches, ${citations.length} sources).`,
        ts: nowIso(),
      },
    ],
  };
}
