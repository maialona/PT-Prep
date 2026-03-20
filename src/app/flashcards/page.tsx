export const dynamic = "force-dynamic";

import { getFlashcards, getCategories } from "@/lib/actions";
import { FlashcardsClient } from "./FlashcardsClient";

export default async function FlashcardsPage() {
  const [flashcards, categories] = await Promise.all([
    getFlashcards(),
    getCategories(),
  ]);

  return <FlashcardsClient flashcards={flashcards} categories={categories} />;
}
