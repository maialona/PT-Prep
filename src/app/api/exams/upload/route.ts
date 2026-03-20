import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractQuestions } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const year = parseInt(formData.get("year") as string, 10);
    const subject = formData.get("subject") as string;

    if (!file || !year || !subject) {
      return NextResponse.json(
        { error: "缺少必要欄位：file, year, subject" },
        { status: 400 }
      );
    }

    // Parse PDF text using unpdf
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // extractText handles the extraction and returns the text content
    const { extractText } = await import("unpdf");
    const { text } = await extractText(uint8Array);
    const rawText = Array.isArray(text) ? text.join("\n\n") : text;

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { error: "PDF 內容為空或無法解析" },
        { status: 400 }
      );
    }

    // Upsert exam record
    const exam = await prisma.exam.upsert({
      where: { year_subject: { year, subject } },
      update: { fileName: file.name },
      create: { year, subject, fileName: file.name },
    });

    // Extract questions via AI and link to exam
    const questions = await extractQuestions(rawText, exam.id);

    return NextResponse.json({
      examId: exam.id,
      year,
      subject,
      questionsImported: questions.length,
      fileName: file.name,
    });
  } catch (err) {
    console.error("Exam upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "上傳處理失敗" },
      { status: 500 }
    );
  }
}
