import { z } from "zod";
import type { Dimension } from "@/lib/config";

/* ------------------------------------------------------------------ *
 * Domain types
 * ------------------------------------------------------------------ */

export interface ResolvedCompany {
  name: string;
  ticker: string;
  exchange?: string;
  type?: string; // EQUITY | ETF | MUTUALFUND | CRYPTO ...
  sector?: string;
  industry?: string;
  country?: string;
  currency?: string;
  website?: string;
  isPublicEquity: boolean;
  reason?: string;
}

export interface Fundamentals {
  ticker: string;
  name?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  country?: string;
  website?: string;
  businessDescription?: string;
  employees?: number | null;

  marketCap?: number | null;
  sharePrice?: number | null;

  peTrailing?: number | null;
  peForward?: number | null;
  priceToBook?: number | null;
  pegRatio?: number | null;
  evToEbitda?: number | null;
  evToRevenue?: number | null;
  dividendYield?: number | null;
  beta?: number | null;

  revenue?: number | null;
  revenueGrowth?: number | null; // fraction (0.12 = 12%)
  grossMargin?: number | null;
  operatingMargin?: number | null;
  netMargin?: number | null;
  roe?: number | null;

  totalDebt?: number | null;
  totalCash?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  operatingCashflow?: number | null;
  freeCashflow?: number | null;

  targetMeanPrice?: number | null;
  numberOfAnalysts?: number | null;
  recommendation?: string | null;

  perfOneYear?: number | null; // fraction
  perfYtd?: number | null; // fraction

  fetchedAt: string;
}

export interface NewsItem {
  title: string;
  url: string;
  source?: string;
  publishedDate?: string;
  snippet?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface Citation {
  title: string;
  url: string;
  source?: string;
  snippet?: string;
}

export interface DimensionAnalysis {
  score: number; // 0-100, higher = more attractive
  rationale: string;
  strengths: string[];
  concerns: string[];
  dataQuality: "good" | "partial" | "weak";
}

export type Analyses = Record<Dimension, DimensionAnalysis>;

export interface ScorecardItem {
  name: string;
  weight: number;
  score: number;
  rationale: string;
  strengths: string[];
  concerns: string[];
}

export interface Scorecard {
  items: ScorecardItem[];
  overall: number; // 0-100 weighted
  confidence: number; // 0-100
  quantitativeDecision: "INVEST" | "WATCH" | "PASS";
}

export interface Verdict {
  decision: "INVEST" | "WATCH" | "PASS";
  conviction: "High" | "Medium" | "Low";
  oneLineSummary: string;
  thesis: string;
  keyStrengths: string[];
  keyRisks: string[];
  catalysts: string[];
  fairValueView: string;
  timeHorizon: string;
  overridden?: boolean;
  overrideReason?: string;
}

export interface ResearchReport {
  company: string;
  resolved: ResolvedCompany | null;
  fundamentals: Fundamentals | null;
  news: NewsItem[];
  qualitative: string;
  analyses: Analyses | null;
  scorecard: Scorecard | null;
  verdict: Verdict | null;
  citations: Citation[];
  notResearchable: boolean;
  error?: string;
  generatedAt: string;
  durationMs: number;
  models: { reasoning: string; fast: string };
}

export interface LogEntry {
  step: string;
  message: string;
  ts: string;
}

/* ------------------------------------------------------------------ *
 * Zod schemas used for LLM structured output
 * ------------------------------------------------------------------ */

export const resolveSchema = z.object({
  name: z.string().describe("Canonical company / security name"),
  ticker: z.string().describe("Primary trading symbol (e.g. AAPL, RELIANCE.NS, TCS.NS). Empty string if not a listed equity."),
  exchange: z.string().describe("Primary exchange, e.g. NMS, NSI, NYQ"),
  type: z.string().describe("Security type, e.g. EQUITY, ETF, MUTUALFUND, CRYPTO"),
  sector: z.string(),
  industry: z.string(),
  country: z.string(),
  website: z.string(),
  isPublicEquity: z.boolean().describe("True ONLY for a publicly listed stock we can pull real financials for"),
  reason: z.string().describe("One sentence: why this is the right match (or why it is not researchable)"),
});

export const dimensionSchema = z.object({
  score: z.number().min(0).max(100).describe("Attractiveness score for THIS dimension, 0-100, higher is better"),
  rationale: z.string().describe("3-5 sentences. Reference the specific numbers/facts you used."),
  strengths: z.array(z.string()).min(1).max(5),
  concerns: z.array(z.string()).min(0).max(5),
  dataQuality: z.enum(["good", "partial", "weak"]).describe("How much reliable, specific data you had for this dimension"),
});

/** All six dimensions scored in a single structured call (token-efficient). */
export const analysisSchema = z.object({
  business: dimensionSchema,
  financials: dimensionSchema,
  valuation: dimensionSchema,
  growth: dimensionSchema,
  moat: dimensionSchema,
  risk: dimensionSchema,
});

export const verdictSchema = z.object({
  decision: z.enum(["INVEST", "WATCH", "PASS"]),
  conviction: z.enum(["High", "Medium", "Low"]),
  oneLineSummary: z.string().describe("A single punchy sentence capturing the call"),
  thesis: z.string().describe("3-6 sentences: the core investment thesis"),
  keyStrengths: z.array(z.string()).min(2).max(6),
  keyRisks: z.array(z.string()).min(2).max(6),
  catalysts: z.array(z.string()).min(0).max(5).describe("Near-term events that would move the stock"),
  fairValueView: z.string().describe("Qualitative view: undervalued / fair / overvalued, and why"),
  timeHorizon: z.string().describe("e.g. '12-24 months'"),
  overrideQuant: z.boolean().describe("Set true ONLY if you strongly disagree with the quantitative model decision provided in the prompt"),
  overrideReason: z.string().describe("Required and must be specific if overrideQuant is true; otherwise write 'N/A'"),
});
