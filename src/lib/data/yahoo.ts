import YahooFinance from "yahoo-finance2";
import { num } from "@/lib/utils";
import type { Fundamentals } from "@/lib/types";

/**
 * yahoo-finance2 v3.x is a CLASS — it must be instantiated with
 * `new YahooFinance()`. Using the default export directly throws
 * "Call `const yahooFinance = new YahooFinance()` first" on every call.
 * We create one shared instance for the whole app.
 */
const yf = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

type Rec = Record<string, unknown>;

export interface ResolvedCandidate {
  symbol: string;
  name?: string;
  exchange?: string;
  type?: string;
}

/** Resolve a free-text company name to candidate symbols via Yahoo search. */
export async function searchCompanies(
  query: string,
): Promise<ResolvedCandidate[]> {
  try {
    const res = (await yf.search(query)) as unknown as { quotes?: Rec[] };
    const quotes = res.quotes ?? [];
    return quotes
      .filter((q) => q.symbol && typeof q.symbol === "string")
      .slice(0, 8)
      .map((q) => ({
        symbol: String(q.symbol),
        name: (q.shortname as string) || (q.longname as string) || undefined,
        exchange:
          (q.exchangeDisp as string) || (q.exchange as string) || undefined,
        type: (q.quoteType as string) || undefined,
      }));
  } catch {
    return [];
  }
}

/** Pull live fundamentals + price performance for a symbol. */
export async function getFundamentals(
  symbol: string,
): Promise<Fundamentals | null> {
  try {
    const qs = (await yf.quoteSummary(symbol, {
      modules: [
        "price",
        "summaryDetail",
        "summaryProfile",
        "financialData",
        "defaultKeyStatistics",
      ],
    })) as unknown as Record<string, Rec | undefined>;

    const price = qs.price ?? {};
    const detail = qs.summaryDetail ?? {};
    const profile = qs.summaryProfile ?? {};
    const fin = qs.financialData ?? {};
    const keys = qs.defaultKeyStatistics ?? {};

    const fundamentals: Fundamentals = {
      ticker: String(price.symbol ?? symbol),
      name: (price.longName as string) || (price.shortName as string) || undefined,
      exchange:
        (price.exchange as string) || (price.exchangeName as string) || undefined,
      currency: (price.currency as string) || undefined,
      sector: (profile.sector as string) || undefined,
      industry: (profile.industry as string) || undefined,
      country: (profile.country as string) || undefined,
      website: (profile.website as string) || undefined,
      businessDescription:
        (profile.longBusinessDescription as string) || undefined,
      employees: num(profile.fullTimeEmployees),

      marketCap: num(price.marketCap),
      sharePrice: num(price.regularMarketPrice),

      peTrailing: num(detail.trailingPE),
      peForward: num(detail.forwardPE),
      priceToBook: num(detail.priceToBook),
      pegRatio: num(keys.pegRatio),
      evToEbitda: num(keys.enterpriseToEbitda),
      evToRevenue: num(keys.enterpriseToRevenue),
      dividendYield: num(detail.dividendYield),
      beta: num(detail.beta),

      revenue: num(fin.totalRevenue),
      revenueGrowth: num(fin.revenueGrowth),
      grossMargin: num(fin.grossMargins),
      operatingMargin: num(fin.operatingMargins),
      netMargin: num(fin.profitMargins),
      roe: num(fin.returnOnEquity),

      totalDebt: num(fin.totalDebt),
      totalCash: num(fin.totalCash),
      // Yahoo returns D/E as a percentage (e.g. 6.5 = 6.5%). Convert to a
      // proper ratio (0.065) so it's not misread as "high leverage" by the
      // UI and by the analyst LLM.
      debtToEquity: (() => {
        const v = num(fin.debtToEquity);
        return v == null ? null : v / 100;
      })(),
      currentRatio: num(fin.currentRatio),
      operatingCashflow: num(fin.operatingCashflow),
      freeCashflow: num(fin.freeCashflow),

      targetMeanPrice: num(fin.targetMeanPrice),
      numberOfAnalysts: num(fin.numberOfAnalystOpinions),
      recommendation: (fin.recommendationKey as string) || undefined,

      perfOneYear: null,
      perfYtd: null,

      fetchedAt: new Date().toISOString(),
    };

    // One extra call for price performance (best-effort).
    const perf = await getPerformance(symbol);
    fundamentals.perfOneYear = perf.oneYear;
    fundamentals.perfYtd = perf.ytd;

    return fundamentals;
  } catch {
    return null;
  }
}

async function getPerformance(
  symbol: string,
): Promise<{ oneYear: number | null; ytd: number | null }> {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = nowSec - 370 * 24 * 3600;
    const chart = (await yf.chart(symbol, {
      period1: fromSec,
      period2: nowSec,
      interval: "1wk",
    })) as unknown as { quotes?: Rec[]; timestamp?: number[] };

    const closes = (chart.quotes ?? [])
      .map((q) => num(q.close))
      .filter((v): v is number => v != null);
    if (closes.length < 2) return { oneYear: null, ytd: null };

    const first = closes[0];
    const last = closes[closes.length - 1];
    const oneYear = last / first - 1;

    // YTD: first close on/after Jan 1 of the current year.
    const timestamps = chart.timestamp ?? [];
    const yearStart = Date.UTC(new Date().getUTCFullYear(), 0, 1) / 1000;
    let ytd: number | null = null;
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= yearStart && closes[i] != null) {
        ytd = last / closes[i] - 1;
        break;
      }
    }
    return { oneYear, ytd };
  } catch {
    return { oneYear: null, ytd: null };
  }
}
