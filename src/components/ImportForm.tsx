"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractQuestions } from "@/lib/actions";
import { Loader2, Sparkles, CheckCircle, Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImportForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError(null);
    setResult(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreview(dataUrl);

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await res.json();
      if (data.text) {
        setText(data.text);
      } else {
        setError(data.error || "圖片辨識失敗");
      }
    } catch {
      setError("圖片辨識失敗，請稍後再試");
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearPreview() {
    setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const questions = await extractQuestions(text);
      setResult({ count: questions.length });
      setText("");
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "匯入失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  const isBusy = loading || ocrLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI 題目解析
        </CardTitle>
        <CardDescription>
          貼上考題文字或拍照上傳，AI 會自動解析題目、分類系統，並提取核心知識點
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {preview && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="上傳預覽"
                className="max-h-48 rounded-md border"
              />
              <button
                type="button"
                onClick={clearPreview}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <Textarea
            placeholder={`請貼上題目，例如：\n\n1. 下列何者為人體最大的器官？\n(A) 肝臟 (B) 皮膚 (C) 小腸 (D) 肺臟\n答案：B\n\n支援一次貼上多題...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            disabled={isBusy}
          />

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => fileRef.current?.click()}
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  辨識中...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  拍照/上傳圖片
                </>
              )}
            </Button>
            <Button type="submit" disabled={isBusy || !text.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI 解析中...
                </>
              ) : (
                "開始解析"
              )}
            </Button>
            {result && (
              <p className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                成功匯入 {result.count} 題
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
