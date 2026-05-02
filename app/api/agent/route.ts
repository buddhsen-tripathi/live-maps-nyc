import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { agentSystemPrompt, agentTools } from "@/lib/agent";

export const maxDuration = 60;

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is not set");
}

const openrouter = createOpenRouter({ apiKey });
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter(MODEL),
    system: agentSystemPrompt,
    messages: await convertToModelMessages(messages),
    tools: agentTools,
    stopWhen: stepCountIs(8),
    temperature: 0.2,
  });

  return result.toUIMessageStreamResponse();
}
