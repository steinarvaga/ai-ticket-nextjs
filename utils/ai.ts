import "server-only";
import { z } from "zod";

/**
 * AI output schema (validated & narrowed)
 */
export const AiAnalysisSchema = z.object({
  summary: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  helpfulNotes: z.string().min(1),
  relatedSkills: z.array(z.string()).default([]),
});

export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

export type TicketInput = {
  title: string;
  description: string;
};

/**
 * Shared system instructions — mirror the original contract (JSON-only).
 */
const SYSTEM_PROMPT = `You are an expert AI assistant that processes technical support tickets.

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- Respond with only valid raw JSON.
- Do NOT include markdown, code fences, comments, or extra formatting.
- The format must be a raw JSON object.

Repeat: Do not wrap your output in markdown or code fences.`;

/**
 * The user prompt that forces a strict JSON object.
 * (Same fields as in the legacy version.)
 */
function buildUserPrompt(ticket: TicketInput): string {
  return `You are a ticket triage agent.
Only return a strict JSON object with no extra text, header or markdown.

Analyze the following support ticket and provide a JSON object with:

- summary: A short 1-2 sentence summary of the issue.
- priority: One of "low", "medium", or "high". Use:
  - "high" if service is down, security/payment/data-loss risk, or deadline ≤ 24h.
  - "medium" for partial outages, performance degradation, or deadline ≤ 72h.
  - "low" for routine/how-to or non-urgent requests.
- helpfulNotes: A detailed technical explanation that a moderator can use to solve this issue. Include useful external links or resources if possible.
- relatedSkills: An array of relevant skills required to solve the issue (e.g., ["React", "MongoDB"]).

Respond ONLY with a single JSON object (no code fences, no comments):

{
  "summary": "Short summary of the ticket",
  "priority": "medium",
  "helpfulNotes": "Here are useful tips …",
  "relatedSkills": ["React", "Node.js"]
}

Ticket information:

- Title: ${ticket.title}
- Description: ${ticket.description}`;
}

/**
 * Utility: extract raw JSON from a model response that may (rarely) include ```json fences.
 */
function extractJsonCandidate(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return match ? match[1] : text.trim();
}

/* -------------------------------------------------------------------------- */
/* Option A) Use @inngest/agent-kit (closest to your original)                 */
/* -------------------------------------------------------------------------- */
// npm i @inngest/agent-kit
// Keep behavior in parity with the old file.

async function callWithAgentKit(prompt: string): Promise<string> {
  const { createAgent, gemini } = await import("@inngest/agent-kit");

  const agent = createAgent({
    model: gemini({
      model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash-8b",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: SYSTEM_PROMPT,
  });

  const response = await agent.run(prompt);

  type AgentRunResponse = { output?: unknown; text?: unknown };

  /** Return the first string-like value we recognize from a message */
  function extractString(o: unknown): string | null {
    if (typeof o === "string") return o;
    if (typeof o === "object" && o !== null) {
      const obj = o as { content?: unknown; text?: unknown };
      if (typeof obj.content === "string") return obj.content;
      if (typeof obj.text === "string") return obj.text;
    }
    return null;
  }

  const out = (response as AgentRunResponse).output;

  let raw = "";
  if (Array.isArray(out)) {
    // look for a message with a string `content` or `text`
    for (const item of out) {
      const s = extractString(item);
      if (s) {
        raw = s;
        break;
      }
    }
    if (!raw) raw = JSON.stringify(out);
  } else {
    const s = extractString(out);
    raw = s ?? String((response as AgentRunResponse).text ?? "");
  }

  return raw;
}

/* -------------------------------------------------------------------------- */
/* Option B) Use official @google/generative-ai (no agent dependency)          */
/* -------------------------------------------------------------------------- */
// npm i @google/generative-ai
// Set env: GEMINI_API_KEY

async function callWithGoogleGenAI(prompt: string): Promise<string> {
  /*const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL ?? "gemini-1.5-flash-8b";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();*/
  const text = "Use callWithAgentKit instead";
  return text;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Analyze a ticket with Gemini and return a validated, typed payload.
 * - Uses Option A by default (agent-kit) to match your previous approach.
 * - Switch to Option B by replacing the call function below.
 */
export async function analyzeTicket(
  ticket: TicketInput,
  opts?: { transport?: "agent-kit" | "google" }
): Promise<AiAnalysis> {
  const userPrompt = buildUserPrompt(ticket);

  // Choose transport (defaults to agent-kit for parity with old code)
  const transport = opts?.transport ?? "agent-kit";
  const rawText =
    transport === "google"
      ? await callWithGoogleGenAI(userPrompt)
      : await callWithAgentKit(userPrompt);

  // Be resilient to accidental fences
  const candidate = extractJsonCandidate(rawText);

  // Parse + validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `AI returned non-JSON output. Raw (truncated): ${rawText.slice(0, 300)}`
    );
  }

  function isPriority(v: string): v is "low" | "medium" | "high" {
    return v === "low" || v === "medium" || v === "high";
  }

  const safe = AiAnalysisSchema.safeParse(parsed);
  if (!safe.success) {
    // Optional: lightweight fallback to ensure priority is within enum
    const coercePriority = (p: unknown): "low" | "medium" | "high" => {
      const s = typeof p === "string" ? p.toLowerCase() : "";
      return isPriority(s) ? s : "medium";
    };

    const maybe = parsed as Record<string, unknown>;
    const attempt = {
      summary: String(maybe.summary ?? ""),
      priority: coercePriority(maybe.priority),
      helpfulNotes: String(maybe.helpfulNotes ?? ""),
      relatedSkills: Array.isArray(maybe.relatedSkills)
        ? maybe.relatedSkills.map(String)
        : [],
    };

    const second = AiAnalysisSchema.safeParse(attempt);
    if (second.success) return second.data;

    // Still not valid -> surface a concise error
    throw new Error(
      `AI JSON validation failed: ${safe.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }

  return safe.data;
}
