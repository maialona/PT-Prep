export const dynamic = "force-dynamic";

import { getCategories } from "@/lib/actions";
import { ExportClient } from "./ExportClient";

export default async function ExportPage() {
  const categories = await getCategories();
  return <ExportClient categories={categories} />;
}
