import { getExams } from "@/lib/actions";
import { ExamsClient } from "./ExamsClient";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const exams = await getExams();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">歷屆試題</h1>
        <p className="text-muted-foreground">
          上傳考選部歷屆試題 PDF，AI 自動解析題目並按年度分類管理
        </p>
      </header>
      <ExamsClient initialExams={exams} />
    </div>
  );
}
