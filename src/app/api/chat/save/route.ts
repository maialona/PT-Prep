import { prisma } from "@/lib/db";
import { openai, CATEGORIES } from "@/lib/openai";

export async function POST(request: Request) {
  const { content, questionContext } = await request.json();

  if (!content || typeof content !== "string") {
    return Response.json({ error: "缺少內容" }, { status: 400 });
  }

  let title: string;
  let categoryName: string;

  if (questionContext?.category) {
    categoryName = questionContext.category;
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `從以下解剖生理學的 AI 解釋中，提取一個簡短的知識點標題（10-20字，繁體中文）。只回傳標題文字，不要加任何標點或前綴。`,
        },
        { role: "user", content },
      ],
      max_tokens: 100,
      temperature: 0,
    });
    title = res.choices[0]?.message?.content?.trim() || content.slice(0, 50);
  } else {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `從以下解剖生理學的 AI 解釋中，提取：
1. 一個簡短的知識點標題（10-20字，繁體中文）
2. 最相關的系統分類，必須是以下之一：${CATEGORIES.join("、")}

回傳 JSON 格式：{"title": "...", "category": "..."}`,
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0,
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    title = parsed.title || content.slice(0, 50);
    categoryName = parsed.category || "神經系統";
  }

  const note = await prisma.note.create({
    data: {
      title,
      content,
      category: categoryName,
      questionId: questionContext?.questionId || null,
    },
  });

  return Response.json({
    id: note.id,
    title,
    category: categoryName,
  });
}
