import { ChatGroq } from "@langchain/groq";
import { MODELS } from "@/lib/config";

/** Fresh model instances per call (cheap, avoids shared state). */

export function reasoningModel(temperature = 0.2) {
  return new ChatGroq({
    model: MODELS.reasoning,
    temperature,
    apiKey: process.env.GROQ_API_KEY,
  });
}

export function fastModel(temperature = 0.3) {
  return new ChatGroq({
    model: MODELS.fast,
    temperature,
    apiKey: process.env.GROQ_API_KEY,
  });
}
