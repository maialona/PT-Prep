"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "@/components/QuestionCard";
import { deleteExam, getExamQuestions } from "@/lib/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Upload, Loader2, CheckCircle, ChevronDown,
  ChevronUp, Trash2, FileText, CalendarDays,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

interface Exam {
  id: string;
  year: number;
  subject: string;
  fileName: string | null;
  _count: { questions: number };
}

interface Props {
  initialExams: Exam[];
}

export function ExamsClient({ initialExams }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [year, setYear] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ count: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Exam viewer state
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  // Group exams by year
  const examsByYear = useMemo(() => {
    const grouped: Record<number, Exam[]> = {};
    for (const exam of initialExams) {
      if (!grouped[exam.year]) grouped[exam.year] = [];
      grouped[exam.year].push(exam);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([y, exams]) => ({ year: Number(y), exams }));
  }, [initialExams]);

  // Generate year options (100-120 in ROC calendar)
  const yearOptions = useMemo(() => {
    const currentRocYear = new Date().getFullYear() - 1911;
    const years = [];
    for (let y = currentRocYear; y >= 100; y--) {
      years.push(y);
    }
    return years;
  }, []);

  async function handleUpload() {
    if (!selectedFile || !year || !subject) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("year", year);
      formData.append("subject", subject);

      const res = await fetch("/api/exams/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上傳失敗");

      setUploadResult({ count: data.questionsImported });
      setSelectedFile(null);
      setYear("");
      setSubject("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleExam(examId: string) {
    if (expandedExamId === examId) {
      setExpandedExamId(null);
      setExamQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    setExpandedExamId(examId);
    try {
      const questions = await getExamQuestions(examId);
      setExamQuestions(questions);
    } catch {
      setExamQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleDeleteExam() {
    if (!deleteTarget) return;
    await deleteExam(deleteTarget.id);
    setDeleteTarget(null);
    if (expandedExamId === deleteTarget.id) {
      setExpandedExamId(null);
      setExamQuestions([]);
    }
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-5 w-5" />
            上傳歷屆試題 PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">年度（民國）</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={uploading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">選擇年度</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">考科</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={uploading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">選擇考科</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">PDF 檔案</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                disabled={uploading}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !year || !subject}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI 解析中...（可能需要數十秒）
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  上傳並解析
                </>
              )}
            </Button>
            {uploadResult && (
              <p className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                成功匯入 {uploadResult.count} 題
              </p>
            )}
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Exams List by Year */}
      {examsByYear.length > 0 ? (
        examsByYear.map(({ year: y, exams }) => (
          <div key={y} className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="h-5 w-5 text-primary" />
              {y} 年
            </h2>
            <div className="grid gap-3">
              {exams.map((exam) => (
                <Card key={exam.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggleExam(exam.id)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{exam.subject}</p>
                          {exam.fileName && (
                            <p className="text-xs text-muted-foreground">{exam.fileName}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-auto mr-2">
                          {exam._count.questions} 題
                        </Badge>
                        {expandedExamId === exam.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => setDeleteTarget(exam)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedExamId === exam.id && (
                      <div className="mt-4 space-y-4">
                        {loadingQuestions ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">載入題目...</span>
                          </div>
                        ) : examQuestions.length > 0 ? (
                          examQuestions.map((q) => (
                            <QuestionCard key={q.id} question={q} defaultCollapsed={true} />
                          ))
                        ) : (
                          <p className="text-center text-sm text-muted-foreground py-4">
                            此份試題尚無題目
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">尚未上傳任何歷屆試題</p>
          <p className="text-xs text-muted-foreground mt-1">請使用上方表單上傳 PDF</p>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="刪除歷屆試題"
        description={deleteTarget ? `確定要刪除「${deleteTarget.year}年 ${deleteTarget.subject}」嗎？所有相關題目都會一併刪除，此操作無法復原。` : ""}
        confirmLabel="刪除"
        variant="destructive"
        onConfirm={handleDeleteExam}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
