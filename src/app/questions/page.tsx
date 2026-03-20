import { getAllQuestions } from "@/lib/actions";
import { QuestionsClient } from "./QuestionsClient";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const questions = await getAllQuestions();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">所有題庫</h1>
        <p className="text-muted-foreground">檢視與管理所有匯入過的題目</p>
      </header>
      <QuestionsClient initialQuestions={questions} />
    </div>
  );
}
