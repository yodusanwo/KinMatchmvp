import Anthropic from "@anthropic-ai/sdk";
import type { MemoryCategory } from "@/lib/memories/types";
import { isMemoryCategory } from "@/lib/memories/types";

export type ExtractedCaptureItem = {
  text: string;
  category: MemoryCategory;
  event_date?: string;
  confidence: "high" | "medium" | "low";
};

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";

function parseItems(raw: string): ExtractedCaptureItem[] {
  const jsonMatch = raw.trim().match(/\[[\s\S]*\]/);
  const jsonText = jsonMatch ? jsonMatch[0] : raw.trim();
  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    if (text.length < 2) return [];
    const categoryRaw =
      typeof record.category === "string" ? record.category : "other";
    const confidenceRaw =
      typeof record.confidence === "string" ? record.confidence : "medium";
    const confidence: ExtractedCaptureItem["confidence"] =
      confidenceRaw === "high" ||
      confidenceRaw === "medium" ||
      confidenceRaw === "low"
        ? confidenceRaw
        : "medium";

    return [
      {
        text,
        category: isMemoryCategory(categoryRaw) ? categoryRaw : "other",
        event_date:
          typeof record.event_date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(record.event_date)
            ? record.event_date
            : undefined,
        confidence,
      },
    ];
  }).slice(0, 3);
}

export async function extractMemoriesFromResponse(input: {
  friend_name: string;
  original_question: string | null;
  intended_category: string;
  user_recap: string;
}): Promise<ExtractedCaptureItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return [
      {
        text: input.user_recap.trim(),
        category: isMemoryCategory(input.intended_category)
          ? input.intended_category
          : "current",
        confidence: "medium" as const,
      },
    ].filter((item) => item.text.length >= 2);
  }

  const client = new Anthropic({ apiKey });
  const originalQuestion = input.original_question
    ? `Original question asked: "${input.original_question}"`
    : "No original question was attached.";

  const prompt = `You are extracting memory items from a user's recap of what their friend shared.

Friend's name: ${input.friend_name}
${originalQuestion}

The user's recap of the friend's response:
"${input.user_recap}"

Extract up to 3 specific memory items worth remembering for the user's friendship with ${input.friend_name}. Each item should be:
- text: a single short sentence in third person about the friend
- category: one of "people" | "dates" | "current" | "loves" | "shared" | "trusted" | "other"
- event_date: if a date-specific item, format YYYY-MM-DD; else omit
- confidence: "high" | "medium" | "low" based on how specific and clear the detail is

The intended category for this conversation was: ${input.intended_category}.
Bias toward this category when content fits multiple, but use another category when it fits better.

Skip generic platitudes like "doing well" or "things are good." Only extract specific, concrete details.

Return JSON only:
[{ "text": "...", "category": "...", "event_date": "...", "confidence": "..." }]

If nothing specific to extract, return an empty array: []`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  try {
    return parseItems(textBlock.text);
  } catch {
    return [];
  }
}
