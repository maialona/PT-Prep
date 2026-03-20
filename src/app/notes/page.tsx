export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getNotes, searchNotes } from "@/lib/actions";
import { CATEGORIES } from "@/lib/openai";
import { Badge } from "@/components/ui/badge";
import { Notebook } from "lucide-react";
import Link from "next/link";
import { NoteCard } from "./NoteCard";
import { NoteSearch } from "./NoteSearch";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function NotesPage({ searchParams }: Props) {
  const params = await searchParams;

  const notes = params.q
    ? await searchNotes(params.q)
    : await getNotes(params.category);

  const categorySet = new Set(notes.map((n) => n.category));
  const allCategories = params.category || params.q
    ? CATEGORIES.filter(() => true)
    : CATEGORIES.filter((c) => categorySet.has(c));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Notebook className="h-6 w-6" />
          AI 筆記
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          收錄 AI 助教的解釋與補充說明
        </p>
      </div>

      <Suspense fallback={null}>
        <NoteSearch />
      </Suspense>

      <div className="flex flex-wrap gap-2">
        <Link href="/notes">
          <Badge
            variant={!params.category && !params.q ? "default" : "outline"}
            className="cursor-pointer"
          >
            全部 ({notes.length})
          </Badge>
        </Link>
        {allCategories.map((cat) => (
          <Link key={cat} href={`/notes?category=${encodeURIComponent(cat)}`}>
            <Badge
              variant={params.category === cat ? "default" : "outline"}
              className="cursor-pointer"
            >
              {cat}
            </Badge>
          </Link>
        ))}
      </div>

      {params.q && (
        <p className="text-sm text-muted-foreground">
          搜尋「{params.q}」找到 {notes.length} 筆筆記
        </p>
      )}

      {notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>
            {params.q || params.category
              ? "沒有找到符合的筆記"
              : "尚未收錄任何 AI 筆記，在對話中點擊「收錄至知識庫」即可新增"}
          </p>
        </div>
      )}
    </div>
  );
}
