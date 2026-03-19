import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ALLOWED_MOODS = [
  "calm",
  "happy",
  "sad",
  "angry",
  "lonely",
  "hopeful",
  "anxious",
  "stressed",
  "overwhelmed",
  "excited",
  "tired",
  "heartbroken",
  "nostalgic",
  "confident",
  "unmotivated",
  "focused",
  "peaceful",
  "restless",
  "mentally tired",
  "emotionally drained",
] as const;

export type MoodKeyword = (typeof ALLOWED_MOODS)[number];

function normalizeMood(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, "")
    .replace(/\.$/, "");
}

export async function detectMoodKeyword(moodText: string): Promise<MoodKeyword> {
  const input = moodText.trim();

  if (!input) {
    throw new Error("Mood text is required");
  }

  const prompt = `
You classify moods for a music app.

Choose exactly ONE label from this list:
${ALLOWED_MOODS.join("\n")}

Rules:
- return only the label
- no explanation
- no punctuation
- lowercase only

User text:
"""${input}"""
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const keyword = normalizeMood(response.text ?? "");

  if (ALLOWED_MOODS.includes(keyword as MoodKeyword)) {
    return keyword as MoodKeyword;
  }

  return "calm";
}