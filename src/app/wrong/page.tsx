export const dynamic = "force-dynamic";

import { getWrongQuestions, getPracticeStats } from "@/lib/actions";
import { QuestionCard } from "@/components/QuestionCard";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default async function WrongPage() {
  const [questions, stats] = await Promise.all([
    getWrongQuestions(),
    getPracticeStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          錯題本
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          自動收集練習中答錯的題目，重複複習直到掌握
        </p>
      </div>

      {stats.total > 0 && (
        <div className="flex gap-2">
          <Badge variant="outline">總作答 {stats.total} 次</Badge>
          <Badge className="bg-green-600">答對 {stats.correct}</Badge>
          <Badge variant="destructive">答錯 {stats.wrong}</Badge>
          <Badge variant="secondary">
            正確率 {Math.round((stats.correct / stats.total) * 100)}%
          </Badge>
        </div>
      )}

      {questions.length > 0 ? (
        <div className="grid gap-4">
          {questions.map((q) =>
            q ? (
              <QuestionCard
                key={q.id}
                question={{
                  ...q,
                  options: q.options as Record<string, string>,
                  knowledgePoints: q.knowledgePoints.map((qk) => ({
                    knowledge: qk.knowledge,
                  })),
                }}
              />
            ) : null
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>還沒有錯題紀錄</p>
          <p className="text-xs mt-1">去練習模式做題後，答錯的題目會自動出現在這裡</p>
        </div>
      )}
    </div>
  );
}
