import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedMemoryCandidate, MemoryCategory } from "@/lib/memories/types";
import { isMemoryCategory } from "@/lib/memories/types";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

function parseCandidates(raw: string): ExtractedMemoryCandidate[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  const jsonText = jsonMatch ? jsonMatch[0] : trimmed;

  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) return [];

  const candidates: ExtractedMemoryCandidate[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    if (text.length < 2) continue;

    const categoryRaw =
      typeof record.category === "string"
        ? record.category
        : typeof record.tag === "string"
          ? record.tag
          : "other";
    const category: MemoryCategory = isMemoryCategory(categoryRaw)
      ? categoryRaw
      : "other";

    const candidate: ExtractedMemoryCandidate = { text, category };

    if (
      typeof record.event_date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.event_date)
    ) {
      candidate.event_date = record.event_date;
    }

    candidates.push(candidate);
  }

  return candidates.slice(0, 3);
}

export async function extractMemoriesWithClaude(params: {
  friendName: string;
  conversationText: string;
  existingMemories: string[];
}): Promise<ExtractedMemoryCandidate[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const existingList =
    params.existingMemories.length > 0
      ? params.existingMemories.map((note) => `- ${note}`).join("\n")
      : "(none yet)";

  const prompt = `You are extracting distinct memorable facts from a conversation a user had with their friend ${params.friendName}.
Focus on facts worth remembering long-term. Avoid small talk, greetings, logistics, and generic platitudes.
Existing memory notes about this friend (avoid duplicates):
${existingList}
Return a JSON array of up to 3 objects:
{ "text": string, "category": "people"|"dates"|"current"|"loves"|"shared"|"trusted"|"other", "event_date"?: "YYYY-MM-DD" }

Categorization heuristics:
- people: family, partner, kids, pets, named friends
- dates: birthdays, anniversaries, memorial dates with explicit dates (include event_date when known)
- current: health updates, job changes, recent events, "right now"
- loves: hobbies, interests, preferences, foods, music, books
- shared: shared experiences, inside jokes, "remember when"
- trusted: vulnerable disclosures, fears, dreams, struggles
- other: anything that doesn't fit cleanly

Respond with JSON only — no markdown, no explanation.

Conversation:
${params.conversationText}`;

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return [];
  }

  return parseCandidates(textBlock.text);
}
