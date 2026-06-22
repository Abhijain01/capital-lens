import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "@/lib/agent/state";
import { resolveNode } from "@/lib/agent/nodes/resolve";
import { fundamentalsNode } from "@/lib/agent/nodes/fundamentals";
import { researchNode } from "@/lib/agent/nodes/research";
import { analyzeNode } from "@/lib/agent/nodes/analyze";
import { scoreNode } from "@/lib/agent/nodes/score";
import { verdictNode } from "@/lib/agent/nodes/verdict";
import { reportNode } from "@/lib/agent/nodes/report";
import type { AgentStateType } from "@/lib/agent/state";

/**
 * The investment-research pipeline as a LangGraph state machine:
 *
 *   START
 *     ↓
 *   resolve ──(not researchable)──→ makeVerdict → buildReport → END
 *     ↓ (researchable)
 *   fetchFundamentals → research → analyze → score → makeVerdict → buildReport → END
 *
 * NOTE: LangGraph 1.x forbids a node name from matching a state channel
 * name. Our state has channels named `fundamentals`, `verdict`, and
 * `report`, so those three nodes use distinct verb-style keys
 * (fetchFundamentals / makeVerdict / buildReport). The nodes still set
 * `currentStep` to the friendly UI label (fundamentals / verdict / done).
 */
export function buildGraph() {
  const builder = new StateGraph(AgentState)
    .addNode("resolve", resolveNode)
    .addNode("fetchFundamentals", fundamentalsNode)
    .addNode("research", researchNode)
    .addNode("analyze", analyzeNode)
    .addNode("score", scoreNode)
    .addNode("makeVerdict", verdictNode)
    .addNode("buildReport", reportNode);

  builder.addEdge(START, "resolve");

  builder.addConditionalEdges(
    "resolve",
    (state: AgentStateType) =>
      state.notResearchable ? "makeVerdict" : "fetchFundamentals",
    { makeVerdict: "makeVerdict", fetchFundamentals: "fetchFundamentals" },
  );

  builder.addEdge("fetchFundamentals", "research");
  builder.addEdge("research", "analyze");
  builder.addEdge("analyze", "score");
  builder.addEdge("score", "makeVerdict");
  builder.addEdge("makeVerdict", "buildReport");
  builder.addEdge("buildReport", END);

  return builder.compile();
}

export type ResearchGraph = ReturnType<typeof buildGraph>;