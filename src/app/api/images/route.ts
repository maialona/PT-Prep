export const maxDuration = 60;

import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { CATEGORIES } from "@/lib/openai";

async function classifyImage(title: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a classifier. Given an anatomy image title, return ONLY the matching category name from this list: ${CATEGORIES.join(", ")}. If none match, return "其他". No explanation, just the category name.`,
      },
      { role: "user", content: title },
    ],
    temperature: 0,
  });

  const category = response.choices[0]?.message?.content?.trim() ?? "其他";
  return CATEGORIES.includes(category as (typeof CATEGORIES)[number])
    ? category
    : "其他";
}

// GET — list all images
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const images = await prisma.image.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, category: true, source: true, createdAt: true },
    });

    return Response.json(images);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch images";
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST — save image (from chat or upload)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, data, source } = body;

    if (!title || !data) {
      return Response.json({ error: "title and data are required" }, { status: 400 });
    }

    let category: string;
    try {
      category = await classifyImage(title);
    } catch {
      category = "其他";
    }

    const image = await prisma.image.create({
      data: { title, category, data, source: source ?? "upload" },
    });

    return Response.json({ id: image.id, title: image.title, category: image.category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save image";
    console.error("POST /api/images error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
