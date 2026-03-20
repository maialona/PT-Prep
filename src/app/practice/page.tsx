export const dynamic = "force-dynamic";

import { getCategories, getExamYears } from "@/lib/actions";
import { PracticeClient } from "./PracticeClient";

export default async function PracticePage() {
  const [categories, years] = await Promise.all([
    getCategories(),
    getExamYears(),
  ]);

  return <PracticeClient categories={categories} years={years} />;
}

