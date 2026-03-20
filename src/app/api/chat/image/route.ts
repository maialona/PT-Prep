import { GoogleGenAI } from "@google/genai";
import type { QuestionContext } from "@/contexts/ChatContext";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function buildImagePrompt(
  userPrompt: string,
  questionContext?: QuestionContext
) {
  const base =
    "Generate a clear, educational medical/anatomy illustration. Use clean lines, labeled annotations in Traditional Chinese (繁體中文), and a white background. Style: textbook-quality diagram. All labels and text MUST be in Traditional Chinese.";

  if (questionContext) {
    return `${base}\n\nContext: This is about "${questionContext.category}" — ${questionContext.content}\n\nUser request: ${userPrompt}`;
  }

  return `${base}\n\nUser request: ${userPrompt}`;
}

async function generateImage(imagePrompt: string): Promise<string> {
  const response = await genai.models.generateContent({
    model: "nano-banana-pro-preview",
    contents: imagePrompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No response from model");

  for (const part of parts) {
    if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/")) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Model did not generate an image");
}

export async function POST(request: Request) {
  const { prompt, questionContext } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const imagePrompt = buildImagePrompt(prompt, questionContext);

  try {
    const imageUrl = await generateImage(imagePrompt);
    return Response.json({ imageUrl, provider: "banana" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
