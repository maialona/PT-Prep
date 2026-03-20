export const dynamic = "force-dynamic";

import { getCategories } from "@/lib/actions";
import { PracticeClient } from "./PracticeClient";

export default async function PracticePage() {
  const categories = await getCategories();
  return <PracticeClient categories={categories} />;
}
