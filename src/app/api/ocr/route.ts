import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  const { image } = await request.json();

  if (!image || typeof image !== "string") {
    return Response.json({ error: "缺少圖片資料" }, { status: 400 });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `你是一位 OCR 專家。請仔細辨識圖片中的所有考題文字，完整輸出每一題的：
- 題號
- 題目內容
- 選項 (A)(B)(C)(D)
- 答案（如果圖片中有標示）

請用純文字格式輸出，保持原始排版。不要遺漏任何一題。使用繁體中文。`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: image, detail: "high" },
          },
          {
            type: "text",
            text: "請辨識這張圖片中的所有考題，完整輸出文字內容。",
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return Response.json({ error: "無法辨識圖片內容" }, { status: 500 });
  }

  return Response.json({ text });
}
