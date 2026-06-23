import { NextResponse } from "next/server";
import { buildGraph } from "@/lib/agent/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const graph = buildGraph();
    const nodes = graph.nodes ? Object.keys(graph.nodes) : [];
    return NextResponse.json({
      ok: true,
      graphBuilt: true,
      nodes,
      hasKeys: {
        groq: Boolean(process.env.GROQ_API_KEY),
        tavily: Boolean(process.env.TAVILY_API_KEY),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}