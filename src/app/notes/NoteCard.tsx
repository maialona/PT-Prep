"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteNote, updateNote } from "@/lib/actions";
import { ChevronDown, ChevronUp, Trash2, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NoteProps {
  note: {
    id: string;
    title: string;
    content: string;
    category: string;
    questionId: string | null;
    createdAt: Date;
  };
}

export function NoteCard({ note }: NoteProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteNote(note.id);
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  async function handleSave() {
    await updateNote(note.id, editContent);
    setEditing(false);
    router.refresh();
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
    setExpanded(true);
    setEditContent(note.content);
  }

  function handleCancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(false);
    setEditContent(note.content);
  }

  return (
    <>
      <Card className="group">
        <CardHeader
          className="pb-2 cursor-pointer"
          onClick={() => { if (!editing) setExpanded(!expanded); }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {expanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <CardTitle className="text-base leading-snug">{note.title}</CardTitle>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {note.category}
              </Badge>
              {!editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleEdit}
                  title="編輯筆記"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                disabled={deleting}
                title="刪除筆記"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            {new Date(note.createdAt).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardHeader>
        {expanded && (
          <CardContent>
            {editing ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  支援 Markdown 語法：**粗體**、*斜體*、# 標題、- 列表、`程式碼`
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSave(); }}>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    儲存
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        )}
      </Card>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="刪除筆記"
        description="確定要刪除此筆記嗎？此操作無法復原。"
        confirmLabel="刪除"
        variant="destructive"
        onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
