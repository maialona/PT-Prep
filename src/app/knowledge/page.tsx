export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getCategories, getQuestionsByCategory, searchQuestions, getAllTags, getQuestionsByTag, getAllQuestions } from "@/lib/actions";
import { QuestionCard } from "@/components/QuestionCard";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, Tag } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>;
}

export default async function KnowledgePage({ searchParams }: Props) {
  const params = await searchParams;
  const [categories, allTags] = await Promise.all([
    getCategories(),
    getAllTags(),
  ]);

  const questions = params.q
    ? await searchQuestions(params.q)
    : params.tag
      ? await getQuestionsByTag(params.tag)
      : params.category
        ? await getQuestionsByCategory(params.category)
        : await getAllQuestions();

  const selectedCategory = categories.find((c) => c.id === params.category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          知識庫
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          按系統分類瀏覽題目與知識點
        </p>
      </div>

      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      <div className="flex flex-wrap gap-2">
        <Link href="/knowledge">
          <Badge
            variant={!params.category && !params.q && !params.tag ? "default" : "outline"}
            className="cursor-pointer"
          >
            全部
          </Badge>
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/knowledge?category=${cat.id}`}>
            <Badge
              variant={params.category === cat.id ? "default" : "outline"}
              className="cursor-pointer"
            >
              {cat.name} ({cat._count.questions})
            </Badge>
          </Link>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {allTags.map((tag) => (
            <Link key={tag} href={`/knowledge?tag=${encodeURIComponent(tag)}`}>
              <Badge
                variant={params.tag === tag ? "default" : "outline"}
                className="cursor-pointer text-xs"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {params.q && (
        <p className="text-sm text-muted-foreground">
          搜尋「{params.q}」找到 {questions.length} 筆結果
        </p>
      )}

      {params.tag && (
        <p className="text-sm text-muted-foreground">
          標籤「{params.tag}」共 {questions.length} 題
        </p>
      )}

      {selectedCategory && (
        <p className="text-sm text-muted-foreground">
          {selectedCategory.name}：共 {selectedCategory._count.questions} 題、
          {selectedCategory._count.knowledgePoints} 個知識點
        </p>
      )}

      {questions.length > 0 ? (
        <div className="grid gap-4">
          {questions.map((q) => (
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
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{params.q ? `搜尋「${params.q}」無結果` : "此分類尚無題目"}</p>
        </div>
      )}
    </div>
  );
}
