"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExportData } from "@/lib/actions";
import { FileDown, Loader2, Printer } from "lucide-react";

interface Category {
  id: string;
  name: string;
  _count: { questions: number; knowledgePoints: number };
}

interface Question {
  content: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  category: { name: string };
  knowledgePoints: { knowledge: { title: string; description: string } }[];
}

interface Note {
  title: string;
  content: string;
  category: string;
}

export function ExportClient({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState("all");
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const data = await getExportData(
        categoryId === "all" ? undefined : categoryId
      );

      const categoryName =
        categoryId === "all"
          ? "全部"
          : categories.find((c) => c.id === categoryId)?.name ?? "";

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const html = buildPrintHtml(
        categoryName,
        includeQuestions ? (data.questions as unknown as Question[]) : [],
        includeNotes ? (data.notes as Note[]) : [],
        includeAnswers
      );

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileDown className="h-6 w-6" />
          匯出 PDF
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          將題目和筆記匯出為 PDF，方便離線或列印複習
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>匯出設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">選擇分類</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分類</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat._count.questions} 題)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">包含內容</label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={includeQuestions ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setIncludeQuestions(!includeQuestions)}
              >
                題目 {includeQuestions ? "✓" : ""}
              </Badge>
              <Badge
                variant={includeNotes ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setIncludeNotes(!includeNotes)}
              >
                AI 筆記 {includeNotes ? "✓" : ""}
              </Badge>
              <Badge
                variant={includeAnswers ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setIncludeAnswers(!includeAnswers)}
              >
                答案與解析 {includeAnswers ? "✓" : ""}
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={loading || (!includeQuestions && !includeNotes)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                準備中...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                預覽並列印 / 存為 PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function buildPrintHtml(
  categoryName: string,
  questions: Question[],
  notes: { title: string; content: string; category: string }[],
  includeAnswers: boolean
) {
  const questionsHtml = questions
    .map((q, i) => {
      const opts = q.options as Record<string, string>;
      const optionsHtml = Object.entries(opts)
        .map(
          ([key, val]) =>
            `<div style="margin:2px 0;${key === q.correctAnswer && includeAnswers ? "font-weight:bold;color:#16a34a;" : ""}">
              (${key}) ${val}
            </div>`
        )
        .join("");

      const answerHtml = includeAnswers
        ? `<div style="margin-top:8px;padding:8px;background:#f3f4f6;border-radius:4px;font-size:12px;">
            <strong>答案：${q.correctAnswer}</strong>
            ${q.explanation ? `<div style="margin-top:4px;color:#6b7280;">${q.explanation}</div>` : ""}
            ${q.knowledgePoints.length > 0 ? `<div style="margin-top:4px;border-top:1px solid #e5e7eb;padding-top:4px;">${q.knowledgePoints.map((kp) => `<div><strong>${kp.knowledge.title}</strong>：${kp.knowledge.description}</div>`).join("")}</div>` : ""}
          </div>`
        : "";

      return `
        <div style="margin-bottom:20px;page-break-inside:avoid;">
          <div style="font-size:13px;"><strong>${i + 1}.</strong> ${q.content}</div>
          <div style="margin-left:16px;font-size:13px;">${optionsHtml}</div>
          ${answerHtml}
        </div>`;
    })
    .join("");

  const notesHtml = notes
    .map(
      (n) => `
      <div style="margin-bottom:16px;page-break-inside:avoid;padding:10px;border:1px solid #e5e7eb;border-radius:6px;">
        <div style="font-size:13px;font-weight:bold;">${n.title}</div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">${n.category}</div>
        <div style="font-size:12px;white-space:pre-wrap;color:#4b5563;">${n.content}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>A&P 知識萃取 — ${categoryName}</title>
  <style>
    body { font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1f2937; }
    h1 { font-size: 20px; border-bottom: 2px solid #1f2937; padding-bottom: 8px; }
    h2 { font-size: 16px; margin-top: 30px; color: #4b5563; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>A&P 知識萃取 — ${categoryName}</h1>
  ${questions.length > 0 ? `<h2>題目（共 ${questions.length} 題）</h2>${questionsHtml}` : ""}
  ${notes.length > 0 ? `<h2>AI 筆記（共 ${notes.length} 篇）</h2>${notesHtml}` : ""}
</body>
</html>`;
}
