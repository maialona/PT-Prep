"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateQuestions, saveGeneratedQuestions } from "@/lib/actions";
import type { GeneratedQuestion } from "@/lib/actions";
import { Loader2, Wand2, CheckCircle, Square, CheckSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GeneratePage() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<GeneratedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setPreview([]);
    setSelected(new Set());

    try {
      const questions = await generateQuestions(topic.trim(), parseInt(count));
      setPreview(questions);
      setSelected(new Set(questions.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === preview.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(preview.map((_, i) => i)));
    }
  }

  async function handleSave() {
    const toSave = preview.filter((_, i) => selected.has(i));
    if (toSave.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      const saved = await saveGeneratedQuestions(toSave);
      setResult({ count: saved.length });
      setPreview([]);
      setSelected(new Set());
      setTopic("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  const suggestions = [
    "心臟傳導系統", "腎臟過濾機制", "內分泌負回饋",
    "腦神經功能", "呼吸氣體交換", "骨骼肌收縮機制",
    "消化酵素作用", "免疫細胞分類", "血液凝固機制",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6" />
          AI 出題
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          輸入主題，讓 AI 自動產生練習題目
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>設定主題</CardTitle>
          <CardDescription>
            輸入想練習的解剖生理學主題，AI 會產生對應的選擇題
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">主題</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：心臟傳導系統"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">題數</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["3", "5", "10"].map((n) => (
                    <SelectItem key={n} value={n}>{n} 題</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">推薦主題</label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setTopic(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading || !topic.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI 出題中...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  開始產生
                </>
              )}
            </Button>

            {result && (
              <p className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                成功收錄 {result.count} 題至知識庫
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Preview generated questions */}
      {preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              AI 產生了 {preview.length} 題，請勾選要收錄的題目
            </h2>
            <button
              onClick={toggleAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {selected.size === preview.length ? "取消全選" : "全選"}
            </button>
          </div>

          {preview.map((q, i) => (
            <Card
              key={i}
              className={`transition-colors cursor-pointer ${
                selected.has(i) ? "ring-1 ring-primary/30" : "opacity-60"
              }`}
              onClick={() => toggleSelect(i)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex gap-3">
                  <div className="pt-0.5 shrink-0">
                    {selected.has(i) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium">{q.content}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {Object.entries(q.options).map(([key, val]) => (
                        <span
                          key={key}
                          className={`text-xs px-2 py-1 rounded ${
                            key === q.correctAnswer
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 font-medium"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {key}. {val}
                        </span>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground">
                        {q.explanation}
                      </p>
                    )}
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  收錄 {selected.size} 題至知識庫
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setPreview([]); setSelected(new Set()); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              捨棄全部
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
