import { NextResponse } from "next/server";
import { buildGraph } from "@/lib/agent/graph";
import type { AgentStateType } from "@/lib/agent/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/research
 * Body: { company: string }
 *
 * Runs the LangGraph pipeline and streams the full state snapshot back to
 * the client after each node completes (Server-Sent Events). The final
 * snapshot contains the complete `report`. The UI can render progressively
 * (timeline → scorecard → full report) as snapshots arrive.
 */
export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!groqKey || !tavilyKey) {
    return NextResponse.json(
      {
        error:
          "Server is missing GROQ_API_KEY and/or TAVILY_API_KEY. Copy .env.example to .env and fill them in.",
      },
      { status: 500 },
    );
  }

  let company: string;
  try {
    const body = await req.json();
    company = String(body?.company ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!company) {
    return NextResponse.json(
      { error: "Please provide a company name." },
      { status: 400 },
    );
  }

  const graph = buildGraph();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const iter = await graph.stream(
          { company, startedAt: Date.now() } as Partial<AgentStateType>,
          { streamMode: "values", recursionLimit: 40 },
        );

        for await (const snapshot of iter) {
          send({ type: "snapshot", state: snapshot });
        }
        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Agent failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST { company: 'Apple' } to /api/research (Server-Sent Events stream).",
  });
}
