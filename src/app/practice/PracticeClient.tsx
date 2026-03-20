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
import { getPracticeQuestions, submitAnswer } from "@/lib/actions";
import {
  Dumbbell,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Trophy,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  _count: { questions: number };
}

interface Question {
  id: string;
  content: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  category: { name: string };
}

type Phase = "setup" | "quiz" | "result";

export function PracticeClient({
  categories,
  years,
}: {
  categories: Category[];
  years: number[];
}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [count, setCount] = useState("10");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const qs = await getPracticeQuestions(
        categoryId === "all" ? undefined : categoryId,
        year === "all" ? undefined : parseInt(year),
        parseInt(count)
      );
      if (qs.length === 0) {
        alert("此分類/年度尚無題目，請先匯入題目");
        return;
      }
      setQuestions(qs as Question[]);
      setCurrent(0);
      setScore({ correct: 0, wrong: 0 });
      setSelected(null);
      setAnswered(false);
      setResult(null);
      setPhase("quiz");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(option: string) {
    if (answered) return;
    setSelected(option);
    setAnswered(true);

    const res = await submitAnswer(questions[current].id, option);
    setResult(res);
    setScore((prev) => ({
      correct: prev.correct + (res.isCorrect ? 1 : 0),
      wrong: prev.wrong + (res.isCorrect ? 0 : 1),
    }));
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setPhase("result");
      return;
    }
    setCurrent((prev) => prev + 1);
    setSelected(null);
    setAnswered(false);
    setResult(null);
  }

  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-6 w-6" />
            練習模式
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            從題庫隨機抽題練習，即時看解析
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>設定練習</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="text-sm font-medium">選擇年度</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年度</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y} 年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">題數</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["5", "10", "20", "30", "50"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} 題
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleStart} disabled={loading} className="w-full">
              {loading ? "載入中..." : "開始練習"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "result") {
    const total = score.correct + score.wrong;
    const pct = Math.round((score.correct / total) * 100);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            練習結果
          </h1>
        </div>

        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-5xl font-bold">{pct}%</p>
            <p className="text-muted-foreground">
              共 {total} 題，答對 {score.correct} 題，答錯 {score.wrong} 題
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={() => { setPhase("setup"); }} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                重新設定
              </Button>
              <Button onClick={handleStart}>
                再練一次
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz phase
  const q = questions[current];
  const options = q.options as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {current + 1} / {questions.length}
          </Badge>
          <Badge variant="secondary">{q.category.name}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> {score.correct}
          </span>
          <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> {score.wrong}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-relaxed font-normal">
            {q.content}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(options).map(([key, value]) => {
            let variant: "outline" | "default" | "destructive" = "outline";
            let extraClass = "justify-start text-left h-auto py-3 px-4";

            if (answered && result) {
              if (key === result.correctAnswer) {
                variant = "default";
                extraClass += " bg-green-600 hover:bg-green-600 text-white border-green-600";
              } else if (key === selected && !result.isCorrect) {
                variant = "destructive";
              }
            } else if (key === selected) {
              variant = "default";
            }

            return (
              <Button
                key={key}
                variant={variant}
                className={`w-full ${extraClass}`}
                onClick={() => handleSelect(key)}
                disabled={answered}
              >
                <span className="font-bold mr-2 shrink-0">({key})</span>
                {value}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {answered && result && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              {result.isCorrect ? (
                <Badge className="bg-green-600">答對了！</Badge>
              ) : (
                <Badge variant="destructive">
                  答錯了！正確答案：{result.correctAnswer}
                </Badge>
              )}
            </div>
            {q.explanation && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {q.explanation}
              </p>
            )}
            <Button onClick={handleNext} className="w-full">
              {current + 1 >= questions.length ? "查看結果" : "下一題"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
