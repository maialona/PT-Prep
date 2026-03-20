"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Upload, Loader2, ImageIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ImageItem {
  id: string;
  title: string;
  category: string;
  source: string;
  createdAt: string;
  thumbnailUrl?: string;
}

function ImageThumbnail({ id, onLoaded, onClick }: { id: string; onLoaded: (src: string) => void; onClick: () => void }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/images/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setSrc(d.data);
          onLoaded(d.data);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div
      className="aspect-square cursor-pointer bg-muted flex items-center justify-center overflow-hidden"
      onClick={onClick}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
      )}
    </div>
  );
}

const CATEGORY_FILTERS = [
  "全部",
  "皮膜系統", "骨骼系統", "肌肉系統", "神經系統",
  "內分泌系統", "循環系統", "免疫系統", "呼吸系統",
  "消化系統", "泌尿系統", "生殖系統", "其他",
];

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  async function fetchImages() {
    setIsLoading(true);
    try {
      const params = selectedCategory !== "全部" ? `?category=${encodeURIComponent(selectedCategory)}` : "";
      const res = await fetch(`/api/images${params}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const title = file.name.replace(/\.[^.]+$/, "");

      await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, data: dataUrl, source: "upload" }),
      });

      fetchImages();
    } catch {
      alert("上傳失敗，請稍後再試");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/images/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  const imageCache = useRef<Map<string, string>>(new Map());

  function handleViewImage(id: string) {
    const cached = imageCache.current.get(id);
    if (cached) {
      setLightboxUrl(cached);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">圖片庫</h1>
          <p className="text-sm text-muted-foreground">
            管理 AI 產生的解剖學圖片，自動依系統分類
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            上傳圖片
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_FILTERS.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ImageIcon className="mb-3 h-12 w-12" />
          <p>尚無圖片</p>
          <p className="text-xs mt-1">透過 AI 助教產圖或上傳圖片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <Card key={img.id} className="group relative overflow-hidden">
              <ImageThumbnail
                id={img.id}
                onLoaded={(src) => imageCache.current.set(img.id, src)}
                onClick={() => handleViewImage(img.id)}
              />
              <div className="p-2.5">
                <p className="text-sm font-medium truncate">{img.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">
                    {img.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteTarget(img.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">圖片預覽</DialogTitle>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="圖片預覽"
              className="w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="刪除圖片"
        description="確定要刪除這張圖片嗎？此操作無法復原。"
        confirmLabel="刪除"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
