"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitAnswer } from "@/lib/actions";
import {
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  content: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  category: { name: string };
  knowledgePoints: { knowledge: { title: string; description: string } }[];
}

interface Props {
  questions: Question[];
  stats: { dueCount: number; scheduledCount: number };
}

export function ReviewClient({ questions, stats }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  const router = useRouter();

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
      setFinished(true);
      return;
    }
    setCurrent((prev) => prev + 1);
    setSelected(null);
    setAnswered(false);
    setResult(null);
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            間隔複習
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            根據 SM-2 演算法自動排程，在最佳時機複習
          </p>
        </div>
        {stats.scheduledCount > 0 && (
          <Badge variant="outline">已排程 {stats.scheduledCount} 題</Badge>
        )}
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="font-medium">目前沒有需要複習的題目</p>
          <p className="text-xs mt-1">完成練習後，系統會自動安排複習時間</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const total = score.correct + score.wrong;
    const pct = Math.round((score.correct / total) * 100);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            複習完成
          </h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-5xl font-bold">{pct}%</p>
            <p className="text-muted-foreground">
              共複習 {total} 題，答對 {score.correct} 題，答錯 {score.wrong} 題
            </p>
            <p className="text-sm text-muted-foreground">
              答錯的題目會在明天再次出現，答對的題目會延後複習
            </p>
            <Button onClick={() => router.refresh()} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              重新檢查
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = questions[current];
  const options = q.options as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
          間隔複習
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {current + 1} / {questions.length}
          </Badge>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> {score.correct}
            </span>
            <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> {score.wrong}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">{q.category.name}</Badge>
          </div>
          <CardTitle className="text-base leading-relaxed font-normal">
            {q.content}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(options).map(([key, value]) => {
            let extraClass = "justify-start text-left h-auto py-3 px-4";
            let variant: "outline" | "default" | "destructive" = "outline";

            if (answered && result) {
              if (key === result.correctAnswer) {
                variant = "default";
                extraClass += " bg-green-600 hover:bg-green-600 text-white border-green-600";
              } else if (key === selected && !result.isCorrect) {
                variant = "destructive";
              }
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
            {q.knowledgePoints.length > 0 && (
              <div className="space-y-1.5">
                {q.knowledgePoints.map((kp, i) => (
                  <div key={i} className="rounded-md bg-muted p-2.5 text-xs">
                    <span className="font-medium">{kp.knowledge.title}</span>
                    <span className="text-muted-foreground">：{kp.knowledge.description}</span>
                  </div>
                ))}
              </div>
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
