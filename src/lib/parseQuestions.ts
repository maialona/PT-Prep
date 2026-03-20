import { openai, PARSE_ONLY_PROMPT } from "@/lib/openai";

export interface ExtractedQuestion {
  content: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  category: string;
}

/**
 * Split raw text into chunks of roughly `questionsPerChunk` questions each.
 * Detects question boundaries by common numbering patterns (e.g., "1.", "1、", "1）", "(1)").
 */
export function splitTextIntoChunks(rawText: string, questionsPerChunk = 20): string[] {
  const questionPattern = /^(?:\d{1,3}[\.\、\)\）]|\(\d{1,3}\))/m;
  const lines = rawText.split("\n");

  const questionStarts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (questionPattern.test(lines[i].trim())) {
      questionStarts.push(i);
    }
  }

  if (questionStarts.length <= questionsPerChunk) {
    return [rawText];
  }

  const chunks: string[] = [];
  for (let i = 0; i < questionStarts.length; i += questionsPerChunk) {
    const startLine = questionStarts[i];
    const endLine =
      i + questionsPerChunk < questionStarts.length
        ? questionStarts[i + questionsPerChunk]
        : lines.length;
    chunks.push(lines.slice(startLine, endLine).join("\n"));
  }

  return chunks;
}

export async function extractQuestionsFromChunk(chunkText: string): Promise<ExtractedQuestion[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PARSE_ONLY_PROMPT },
      {
        role: "user",
        content: `請解析以下所有題目（共有多題，請全部解析，不要遺漏任何一題）：\n\n${chunkText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 8192,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    const questions: ExtractedQuestion[] = Array.isArray(parsed)
      ? parsed
      : parsed.questions ?? [parsed];
    return questions.map((q) => ({ ...q, explanation: q.explanation ?? "" }));
  } catch {
    console.error("Failed to parse AI response for chunk:", text.slice(0, 200));
    return [];
  }
}
