"use server";

import { prisma } from "@/lib/db";
import { openai, SYSTEM_PROMPT } from "@/lib/openai";
import { splitTextIntoChunks, extractQuestionsFromChunk } from "@/lib/parseQuestions";

export async function extractQuestions(rawText: string, examId?: string) {
  // Split into chunks to avoid max_tokens truncation
  const chunks = splitTextIntoChunks(rawText, 20);

  // Process all chunks in parallel
  const chunkResults = await Promise.all(chunks.map(extractQuestionsFromChunk));
  const allQuestions = chunkResults.flat();

  const questions = allQuestions;

  const results = [];

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

    const question = await prisma.question.create({
      data: {
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        categoryId: category.id,
        ...(examId ? { examId } : {}),
      },
    });

    results.push({
      ...question,
      category: category.name,
    });
  }

  return results;
}

export async function generateExplanation(questionId: string): Promise<string> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { category: true },
  });
  if (!question) throw new Error("題目不存在");

  const questionText = `題目：${question.content}\n選項：\n${Object.entries(question.options as Record<string, string>).map(([k, v]) => `${k}. ${v}`).join("\n")}\n答案：${question.correctAnswer}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `請為以下題目生成詳細解析：\n\n${questionText}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 1024,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("AI 未返回解析");

  const parsed = JSON.parse(text);
  const explanation: string =
    parsed.explanation ??
    parsed.questions?.[0]?.explanation ??
    "";

  await prisma.question.update({
    where: { id: questionId },
    data: { explanation },
  });

  return explanation;
}

// --- Exam Management ---
export async function getExams() {
  return prisma.exam.findMany({
    orderBy: [{ year: "desc" }, { subject: "asc" }],
    include: {
      _count: { select: { questions: true } },
    },
  });
}

export async function getExamYears() {
  const exams = await prisma.exam.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return exams.map((e) => e.year);
}


export async function getExamQuestions(examId: string) {
  return prisma.question.findMany({
    where: { examId },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteExam(examId: string) {
  // Delete associated questions first, then the exam
  await prisma.question.deleteMany({ where: { examId } });
  return prisma.exam.delete({ where: { id: examId } });
}


export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { questions: true } },
    },
  });
}

export async function getQuestionsByCategory(categoryId: string) {
  return prisma.question.findMany({
    where: { categoryId },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllQuestions() {
  return prisma.question.findMany({
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function searchQuestions(query: string) {
  return prisma.question.findMany({
    where: {
      OR: [
        { content: { contains: query, mode: "insensitive" } },
        { explanation: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleBookmark(questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!question) throw new Error("題目不存在");

  return prisma.question.update({
    where: { id: questionId },
    data: { isBookmarked: !question.isBookmarked },
  });
}

export async function updateCorrectAnswer(
  questionId: string,
  correctAnswer: string
) {
  return prisma.question.update({
    where: { id: questionId },
    data: { correctAnswer },
  });
}

export async function deleteQuestion(questionId: string) {
  return prisma.question.delete({ where: { id: questionId } });
}

export async function getNotes(category?: string) {
  return prisma.note.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function searchNotes(query: string) {
  return prisma.note.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteNote(noteId: string) {
  return prisma.note.delete({ where: { id: noteId } });
}

export async function getPracticeQuestions(
  categoryId?: string,
  year?: number,
  count = 10
) {
  const questions = await prisma.question.findMany({
    where: {
      AND: [
        categoryId ? { categoryId } : {},
        year ? { exam: { year } } : {},
      ],
    },
    include: {
      category: true,
      exam: true,
    },
  });
  // Shuffle and take `count`
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function submitAnswer(questionId: string, selected: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!question) throw new Error("題目不存在");

  const isCorrect = question.correctAnswer === selected;

  await prisma.practiceAttempt.create({
    data: { questionId, selected, isCorrect },
  });

  return { isCorrect, correctAnswer: question.correctAnswer };
}

export async function getWrongQuestions() {
  // Get questions that have at least one wrong attempt, ordered by most recent wrong attempt
  const wrongAttempts = await prisma.practiceAttempt.findMany({
    where: { isCorrect: false },
    select: { questionId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Deduplicate question IDs, keep order
  const seen = new Set<string>();
  const uniqueIds: string[] = [];
  for (const a of wrongAttempts) {
    if (!seen.has(a.questionId)) {
      seen.add(a.questionId);
      uniqueIds.push(a.questionId);
    }
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: uniqueIds } },
    include: {
      category: true,
      attempts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  // Maintain the order from wrongAttempts
  const map = new Map(questions.map((q) => [q.id, q]));
  return uniqueIds.map((id) => map.get(id)).filter(Boolean);
}

export async function getPracticeStats() {
  const total = await prisma.practiceAttempt.count();
  const correct = await prisma.practiceAttempt.count({ where: { isCorrect: true } });
  return { total, correct, wrong: total - correct };
}

export async function getExportData(categoryId?: string) {
  const questions = await prisma.question.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      category: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const notes = await prisma.note.findMany({
    where: categoryId
      ? {
          category: {
            in: (
              await prisma.category.findMany({
                where: { id: categoryId },
                select: { name: true },
              })
            ).map((c) => c.name),
          },
        }
      : undefined,
    orderBy: { createdAt: "asc" },
  });

  return { questions, notes };
}

// --- Tags ---
export async function addTag(questionId: string, tag: string) {
  const q = await prisma.question.findUnique({ where: { id: questionId } });
  if (!q) throw new Error("題目不存在");
  if (q.tags.includes(tag)) return q;
  return prisma.question.update({
    where: { id: questionId },
    data: { tags: [...q.tags, tag] },
  });
}

export async function removeTag(questionId: string, tag: string) {
  const q = await prisma.question.findUnique({ where: { id: questionId } });
  if (!q) throw new Error("題目不存在");
  return prisma.question.update({
    where: { id: questionId },
    data: { tags: q.tags.filter((t) => t !== tag) },
  });
}

export async function getAllTags() {
  const questions = await prisma.question.findMany({
    where: { tags: { isEmpty: false } },
    select: { tags: true },
  });
  const tagSet = new Set<string>();
  for (const q of questions) q.tags.forEach((t) => tagSet.add(t));
  return Array.from(tagSet).sort();
}

export async function getQuestionsByTag(tag: string) {
  return prisma.question.findMany({
    where: { tags: { has: tag } },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// --- Notes ---
export async function updateNote(noteId: string, content: string) {
  return prisma.note.update({
    where: { id: noteId },
    data: { content },
  });
}
