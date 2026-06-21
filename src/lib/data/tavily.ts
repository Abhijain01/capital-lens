const ENDPOINT = "https://api.tavily.com/search";

export interface TavilyRawResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface TavilyResponse {
  query: string;
  answer?: string | null;
  results: TavilyRawResult[];
}

/**
 * Thin wrapper around the Tavily Search REST API.
 * We call it directly (rather than @langchain/community's bundled tool)
 * so we have full control over retries, the returned shape, and citation
 * capture. The key is sent both as a header and in the body for
 * compatibility across Tavily API versions.
 */
export async function tavilySearch(args: {
  query: string;
  topic?: "general" | "news";
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
}): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const body = {
    api_key: apiKey,
    query: args.query,
    topic: args.topic ?? "general",
    max_results: args.maxResults ?? 5,
    search_depth: args.searchDepth ?? "basic",
    include_answer: true,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const results = Array.isArray(data.results)
    ? (data.results as Record<string, unknown>[]).map((r) => ({
        title: String(r.title ?? ""),
        url: String(r.url ?? ""),
        content: String(r.content ?? ""),
        score: typeof r.score === "number" ? r.score : undefined,
      }))
    : [];

  return {
    query: args.query,
    answer: typeof data.answer === "string" ? data.answer : null,
    results,
  };
}
