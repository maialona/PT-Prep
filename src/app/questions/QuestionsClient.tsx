"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";

interface Question {
  id: string;
  content: string;
  options: any;
  correctAnswer: string;
  explanation: string | null;
  categoryId: string;
  category: { name: string };
  isBookmarked: boolean;
  tags: string[];
}

interface Props {
  initialQuestions: any[];
}

export function QuestionsClient({ initialQuestions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const names = new Set(initialQuestions.map((q) => q.category.name));
    return Array.from(names).sort();
  }, [initialQuestions]);

  const filteredQuestions = useMemo(() => {
    return initialQuestions.filter((q) => {
      const matchSearch = q.content.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || q.category.name === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [initialQuestions, search, selectedCategory]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-14 z-40 bg-background/95 backdrop-blur py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋題目內容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">所有分類</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => (
            <QuestionCard key={q.id} question={q} defaultCollapsed={true} />
          ))
        ) : (
          <div className="text-center py-20 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">找不到符合條件的題目</p>
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground text-center py-4">
        共 {filteredQuestions.length} 題
      </div>
    </div>
  );
}
