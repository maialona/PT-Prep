import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { splitTextIntoChunks, extractQuestionsFromChunk } from "@/lib/parseQuestions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const year = parseInt(formData.get("year") as string, 10);
  const subject = formData.get("subject") as string;

  if (!file || !year || !subject) {
    return new Response(
      JSON.stringify({ error: "缺少必要欄位：file, year, subject" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(enc.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // Parse PDF text
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const { extractText } = await import("unpdf");
        const { text } = await extractText(uint8Array);
        const rawText = Array.isArray(text) ? text.join("\n\n") : text;

        if (!rawText || rawText.trim().length < 10) {
          send({ type: "error", message: "PDF 內容為空或無法解析" });
          controller.close();
          return;
        }

        // Upsert exam record
        const exam = await prisma.exam.upsert({
          where: { year_subject: { year, subject } },
          update: { fileName: file.name },
          create: { year, subject, fileName: file.name },
        });

        const chunks = splitTextIntoChunks(rawText, 20);
        let totalImported = 0;

        // Process all chunks in parallel; save + emit progress as each chunk completes
        await Promise.all(
          chunks.map(async (chunk) => {
            const questions = await extractQuestionsFromChunk(chunk);

            for (const q of questions) {
              const category = await prisma.category.upsert({
                where: { name: q.category },
                update: {},
                create: { name: q.category },
              });

              const existing = await prisma.question.findFirst({
                where: { content: q.content },
              });
              if (existing) continue;

              await prisma.question.create({
                data: {
                  content: q.content,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                  categoryId: category.id,
                  examId: exam.id,
                },
              });

              totalImported++;
            }

            send({ type: "progress", count: totalImported });
          })
        );

        send({ type: "done", examId: exam.id, questionsImported: totalImported });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "上傳處理失敗" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
