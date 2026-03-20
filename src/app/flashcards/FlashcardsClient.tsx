"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
} from "lucide-react";

interface Flashcard {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  _count: { questions: number; knowledgePoints: number };
}

interface Props {
  flashcards: Flashcard[];
  categories: Category[];
}

export function FlashcardsClient({ flashcards, categories }: Props) {
  const [categoryId, setCategoryId] = useState("all");
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  const filtered = useMemo(() => {
    const list =
      categoryId === "all"
        ? flashcards
        : flashcards.filter((f) => f.category.id === categoryId);
    if (shuffled) return [...list].sort(() => Math.random() - 0.5);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, flashcards, shuffled]);

  function handlePrev() {
    setFlipped(false);
    setCurrent((prev) => (prev - 1 + filtered.length) % filtered.length);
  }

  function handleNext() {
    setFlipped(false);
    setCurrent((prev) => (prev + 1) % filtered.length);
  }

  function handleShuffle() {
    setShuffled((prev) => !prev);
    setCurrent(0);
    setFlipped(false);
  }

  function handleReset() {
    setCurrent(0);
    setFlipped(false);
  }

  if (flashcards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            知識點卡片
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            翻牌快速複習核心知識點
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>尚無知識點</p>
          <p className="text-xs mt-1">匯入題目後，知識點會自動產生</p>
        </div>
      </div>
    );
  }

  const card = filtered[current];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6" />
          知識點卡片
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          點擊卡片翻面，查看詳細說明
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setCurrent(0); setFlipped(false); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分類</SelectItem>
            {categories
              .filter((c) => c._count.knowledgePoints > 0)
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name} ({cat._count.knowledgePoints})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleShuffle} title="隨機排序">
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} title="回到第一張">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Badge variant="outline" className="ml-auto">
          {current + 1} / {filtered.length}
        </Badge>
      </div>

      {card ? (
        <>
          <div
            className="mx-auto w-full max-w-lg cursor-pointer [perspective:1000px]"
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* Front */}
              <div className="min-h-[200px] flex flex-col items-center justify-center rounded-xl border-2 bg-card p-8 shadow-lg text-center [backface-visibility:hidden]">
                <Badge variant="secondary" className="mb-4">
                  {card.category.name}
                </Badge>
                <p className="text-xl font-bold leading-relaxed">
                  {card.title}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  點擊翻面查看說明
                </p>
              </div>

              {/* Back */}
              <div className="absolute inset-x-0 top-0 min-h-[200px] rounded-xl border-2 border-primary/30 bg-card p-8 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Badge variant="secondary" className="mb-4">
                  {card.category.name}
                </Badge>
                <p className="text-sm font-medium mb-2">{card.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {card.description}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  點擊翻回正面
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handlePrev}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              上一張
            </Button>
            <Button onClick={handleNext}>
              下一張
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          此分類尚無知識點
        </div>
      )}
    </div>
  );
}
