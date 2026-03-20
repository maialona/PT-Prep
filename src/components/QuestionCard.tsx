"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Check,
  MessageCircleQuestion,
  Tag,
  Plus,
  X,
} from "lucide-react";
import { toggleBookmark, deleteQuestion, updateCorrectAnswer, addTag, removeTag } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";


interface QuestionCardProps {
  question: {
    id: string;
    content: string;
    options: Record<string, string>;
    correctAnswer: string;
    explanation: string | null;
    isBookmarked: boolean;
    tags?: string[];
    category: { name: string };
  };
  defaultCollapsed?: boolean;
}

export function QuestionCard({ question, defaultCollapsed = false }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [bookmarked, setBookmarked] = useState(question.isBookmarked);
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(question.correctAnswer);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tags, setTags] = useState<string[]>(question.tags ?? []);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const router = useRouter();
  const { openChat } = useChat();

  const options = question.options as Record<string, string>;

  function handleAskAI() {
    openChat({
      questionId: question.id,
      content: question.content,
      options,
      correctAnswer: answer,
      explanation: question.explanation,
      category: question.category.name,
    });
  }

  async function handleBookmark() {
    setBookmarked(!bookmarked);
    await toggleBookmark(question.id);
  }

  async function handleDelete() {
    await deleteQuestion(question.id);
    router.refresh();
  }

  async function handleSaveAnswer(key: string) {
    setAnswer(key);
    setEditing(false);
    await updateCorrectAnswer(question.id, key);
    router.refresh();
  }

  async function handleAddTag() {
    const t = newTag.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setNewTag("");
    setShowTagInput(false);
    await addTag(question.id, t);
  }

  async function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
    await removeTag(question.id, tag);
  }

  const presetTags = ["必考", "易錯", "待確認", "重要", "已熟練"];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-relaxed">
            {question.content}
          </CardTitle>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAskAI}
              title="問 AI"
            >
              <MessageCircleQuestion className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditing(!editing)}
              title="修正答案"
            >
              {editing ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBookmark}>
              {bookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-yellow-500" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{question.category.name}</Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 text-xs">
              <Tag className="h-2.5 w-2.5" />
              {tag}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {showTagInput ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); if (e.key === "Escape") setShowTagInput(false); }}
                placeholder="標籤名稱"
                className="h-6 w-20 text-xs px-1.5"
                autoFocus
              />
              <div className="flex gap-0.5">
                {presetTags.filter((p) => !tags.includes(p)).slice(0, 3).map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-accent"
                    onClick={() => { setNewTag(""); setShowTagInput(false); setTags([...tags, p]); addTag(question.id, p); }}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="flex items-center gap-0.5 rounded-md border border-dashed px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent transition-colors"
            >
              <Plus className="h-2.5 w-2.5" />
              標籤
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing && (
          <p className="text-xs text-blue-600 font-medium">
            點擊正確的選項來修正答案
          </p>
        )}
        
        {expanded ? (
          <div className="space-y-3">
            <div className="grid gap-1.5">
              {Object.entries(options).map(([key, value]) => (
                <div
                  key={key}
                  onClick={editing ? () => handleSaveAnswer(key) : undefined}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    key === answer
                      ? "border-green-500/50 bg-green-50 dark:bg-green-950/30 font-medium text-green-800 dark:text-green-300"
                      : ""
                  } ${
                    editing
                      ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      : ""
                  }`}
                >
                  <span className="font-medium">{key}.</span> {value}
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
              {question.explanation && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">解析</p>
                  <p className="text-sm leading-relaxed">{question.explanation}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAskAI}
              >
                <MessageCircleQuestion className="mr-1.5 h-4 w-4" />
                問 AI 助教
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp className="mr-1 h-4 w-4" /> 收起詳情
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="mr-1 h-4 w-4" /> 查看詳情 (選項、答案、解析)
          </Button>
        )}
      </CardContent>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="刪除題目"
        description="確定要刪除這題嗎？此操作無法復原。"
        confirmLabel="刪除"
        variant="destructive"
        onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Card>
  );
}
