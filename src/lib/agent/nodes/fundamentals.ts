import { getFundamentals } from "@/lib/data/yahoo";
import { nowIso } from "@/lib/utils";
import type { AgentStateType, StateUpdate } from "@/lib/agent/state";

/**
 * Node 2 — Pull live fundamentals & price performance from Yahoo Finance.
 * No LLM here: these are hard numbers, so they come straight from the
 * market-data provider. Failures degrade gracefully (null) and lower the
 * final confidence.
 */
export async function fundamentalsNode(state: AgentStateType): Promise<StateUpdate> {
  const ticker = state.resolved?.ticker;
  if (!ticker) {
    return {
      currentStep: "fundamentals",
      fundamentals: null,
      logs: [
        {
          step: "fundamentals",
          message: "No ticker available — skipping fundamentals.",
          ts: nowIso(),
        },
      ],
    };
  }

  const f = await getFundamentals(ticker);
  return {
    currentStep: "fundamentals",
    fundamentals: f,
    logs: [
      {
        step: "fundamentals",
        message: f
          ? `Pulled fundamentals — mcap ${f.marketCap ?? "n/a"}, P/E ${f.peTrailing ?? "n/a"}, revenue growth ${f.revenueGrowth ?? "n/a"}`
          : "Fundamentals fetch failed or returned nothing.",
        ts: nowIso(),
      },
    ],
  };
}
