"use server";

import { prisma } from "@/lib/db";
import { openai, SYSTEM_PROMPT } from "@/lib/openai";

interface ExtractedQuestion {
  content: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  category: string;
  knowledgePoints: { title: string; description: string }[];
}

export async function extractQuestions(rawText: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `請解析以下所有題目（共有多題，請全部解析，不要遺漏任何一題）：\n\n${rawText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 16384,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("AI 未回傳任何結果");

  const parsed = JSON.parse(text);
  const questions: ExtractedQuestion[] = Array.isArray(parsed)
    ? parsed
    : parsed.questions ?? [parsed];

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
      },
    });

    for (const kp of q.knowledgePoints) {
      let knowledgePoint = await prisma.knowledgePoint.findFirst({
        where: { title: kp.title, categoryId: category.id },
      });

      if (!knowledgePoint) {
        knowledgePoint = await prisma.knowledgePoint.create({
          data: {
            title: kp.title,
            description: kp.description,
            categoryId: category.id,
          },
        });
      }

      await prisma.questionKnowledge.create({
        data: {
          questionId: question.id,
          knowledgeId: knowledgePoint.id,
        },
      });
    }

    results.push({
      ...question,
      category: category.name,
      knowledgePoints: q.knowledgePoints,
    });
  }

  return results;
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { questions: true, knowledgePoints: true } },
    },
  });
}

export async function getQuestionsByCategory(categoryId: string) {
  return prisma.question.findMany({
    where: { categoryId },
    include: {
      category: true,
      knowledgePoints: {
        include: { knowledge: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllQuestions() {
  return prisma.question.findMany({
    include: {
      category: true,
      knowledgePoints: {
        include: { knowledge: true },
      },
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
        {
          knowledgePoints: {
            some: {
              knowledge: {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ],
    },
    include: {
      category: true,
      knowledgePoints: { include: { knowledge: true } },
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

export async function getPracticeQuestions(categoryId?: string, count = 10) {
  const questions = await prisma.question.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      category: true,
      knowledgePoints: { include: { knowledge: true } },
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

  // SM-2 Spaced Repetition update
  const now = new Date();
  if (isCorrect) {
    const newReps = question.repetitions + 1;
    let newInterval: number;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(question.srsInterval * question.easeFactor);

    const newEase = Math.max(1.3, question.easeFactor + 0.1 - 0.08 - 0.02);

    await prisma.question.update({
      where: { id: questionId },
      data: {
        repetitions: newReps,
        srsInterval: newInterval,
        easeFactor: newEase,
        nextReviewAt: new Date(now.getTime() + newInterval * 86400000),
      },
    });
  } else {
    const newEase = Math.max(1.3, question.easeFactor - 0.2);
    await prisma.question.update({
      where: { id: questionId },
      data: {
        repetitions: 0,
        srsInterval: 1,
        easeFactor: newEase,
        nextReviewAt: new Date(now.getTime() + 86400000), // tomorrow
      },
    });
  }

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
      knowledgePoints: { include: { knowledge: true } },
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

export async function getReviewQuestions() {
  const now = new Date();
  return prisma.question.findMany({
    where: {
      nextReviewAt: { lte: now },
    },
    include: {
      category: true,
      knowledgePoints: { include: { knowledge: true } },
    },
    orderBy: { nextReviewAt: "asc" },
  });
}

export async function getReviewStats() {
  const now = new Date();
  const dueCount = await prisma.question.count({
    where: { nextReviewAt: { lte: now } },
  });
  const scheduledCount = await prisma.question.count({
    where: { nextReviewAt: { not: null } },
  });
  return { dueCount, scheduledCount };
}

export async function getFlashcards(categoryId?: string) {
  return prisma.knowledgePoint.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: { title: "asc" },
  });
}

export async function getExportData(categoryId?: string) {
  const questions = await prisma.question.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      category: true,
      knowledgePoints: { include: { knowledge: true } },
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
      knowledgePoints: { include: { knowledge: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// --- Learning Calendar ---
export async function getLearningCalendar() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const attempts = await prisma.practiceAttempt.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, isCorrect: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { count: number; correct: number }>();
  for (const a of attempts) {
    const day = a.createdAt.toISOString().slice(0, 10);
    const entry = map.get(day) || { count: 0, correct: 0 };
    entry.count++;
    if (a.isCorrect) entry.correct++;
    map.set(day, entry);
  }

  return Object.fromEntries(map);
}

// --- AI Generate Questions ---
export interface GeneratedQuestion {
  content: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  category: string;
  knowledgePoints?: { title: string; description: string }[];
}

export async function generateQuestions(topic: string, count: number = 5): Promise<GeneratedQuestion[]> {
  const { openai, SYSTEM_PROMPT } = await import("@/lib/openai");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `請針對「${topic}」這個主題，出 ${count} 題護理師考試的選擇題（繁體中文，四選一）。題目要有鑑別度，涵蓋不同面向。請提供答案和解析。`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 16384,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("AI 未回傳任何結果");

  const parsed = JSON.parse(text);
  const questions: GeneratedQuestion[] = Array.isArray(parsed) ? parsed : parsed.questions ?? [parsed];
  return questions;
}

export async function saveGeneratedQuestions(questions: GeneratedQuestion[]) {
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
        tags: ["AI出題"],
      },
    });

    for (const kp of q.knowledgePoints || []) {
      let knowledgePoint = await prisma.knowledgePoint.findFirst({
        where: { title: kp.title, categoryId: category.id },
      });
      if (!knowledgePoint) {
        knowledgePoint = await prisma.knowledgePoint.create({
          data: { title: kp.title, description: kp.description, categoryId: category.id },
        });
      }
      await prisma.questionKnowledge.create({
        data: { questionId: question.id, knowledgeId: knowledgePoint.id },
      });
    }

    results.push(question);
  }

  return results;
}

// --- Notes ---
export async function updateNote(noteId: string, content: string) {
  return prisma.note.update({
    where: { id: noteId },
    data: { content },
  });
}
