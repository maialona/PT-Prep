export const dynamic = "force-dynamic";

import { openai } from "@/lib/openai";
import type { QuestionContext } from "@/contexts/ChatContext";

const CHAT_SYSTEM_PROMPT = `你是一位專業的物理治療師教學助教，協助物理治療師國考準備。
- 使用繁體中文回答
- 回答清楚有條理，適合學生理解
- 可用臨床例子、生物力學或解剖學知識幫助記憶
- 若學生問的問題超出物理治療師國考範圍，禮貌地引導回主題`;

function buildSystemPrompt(questionContext?: QuestionContext) {
  if (!questionContext) return CHAT_SYSTEM_PROMPT;

  const optionsText = Object.entries(questionContext.options)
    .map(([k, v]) => `${k}. ${v}`)
    .join("\n");

  return `${CHAT_SYSTEM_PROMPT}
 
 目前學生正在複習以下題目，請根據這道題目的內容來回答問題：
 
 【題目】${questionContext.content}
 【選項】
 ${optionsText}
 【正確答案】${questionContext.correctAnswer}
 【解析】${questionContext.explanation ?? "無"}
 【分類】${questionContext.category}`;
}

export async function POST(request: Request) {
  const { messages, questionContext } = await request.json();

  const systemPrompt = buildSystemPrompt(questionContext);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
