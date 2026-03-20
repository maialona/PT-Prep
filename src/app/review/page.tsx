export const dynamic = "force-dynamic";

import { getReviewQuestions, getReviewStats } from "@/lib/actions";
import { ReviewClient } from "./ReviewClient";

export default async function ReviewPage() {
  const [questions, stats] = await Promise.all([
    getReviewQuestions(),
    getReviewStats(),
  ]);

  return <ReviewClient questions={questions} stats={stats} />;
}
