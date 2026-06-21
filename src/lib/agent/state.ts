import { Annotation } from "@langchain/langgraph";
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

/**
 * Shared state flowing through the LangGraph state machine.
 * Scalar channels use the simple last-write-wins form; the collection
 * channels (`news`, `citations`, `logs`) use a reducer + default so they
 * are NEVER undefined when a node reads them — even on the early-exit
 * (not-researchable) path that skips the research node.
 */
export const AgentState = Annotation.Root({
  company: Annotation<string>(),
  startedAt: Annotation<number>(),
  resolved: Annotation<ResolvedCompany | null>(),
  notResearchable: Annotation<boolean>(),
  fundamentals: Annotation<Fundamentals | null>(),
  qualitative: Annotation<string>(),
  news: Annotation<NewsItem[]>({
    reducer: (_prev, next) => next ?? [],
    default: () => [],
  }),
  citations: Annotation<Citation[]>({
    reducer: (_prev, next) => next ?? [],
    default: () => [],
  }),
  analyses: Annotation<Analyses | null>(),
  scorecard: Annotation<Scorecard | null>(),
  verdict: Annotation<Verdict | null>(),
  report: Annotation<ResearchReport | null>(),
  currentStep: Annotation<string>(),
  logs: Annotation<LogEntry[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  error: Annotation<string | null>(),
});

export type AgentStateType = typeof AgentState.State;
export type StateUpdate = Partial<AgentStateType>;