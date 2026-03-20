"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { SendHorizontal, Loader2, Eraser, ImageIcon, Download, FolderDown, BookmarkPlus, Check } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

export function ChatBox() {
  const {
    isOpen,
    questionContext,
    messages,
    closeChat,
    clearMessages,
    addMessage,
    updateLastAssistantMessage,
  } = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isBusy = isLoading || isGeneratingImage;

  async function handleGenerateImage() {
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");
    addMessage({ role: "user", content: `[產生圖片] ${text}` });
    setIsGeneratingImage(true);

    try {
      const res = await fetch("/api/chat/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          questionContext: questionContext ?? undefined,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        addMessage({ role: "assistant", content: text, imageUrl: data.imageUrl });
      } else {
        addMessage({ role: "assistant", content: `圖片產生失敗：${data.error ?? "未知錯誤"}` });
      }
    } catch {
      addMessage({ role: "assistant", content: "圖片產生失敗，請稍後再試。" });
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");
    addMessage({ role: "user", content: text });
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
          questionContext: questionContext ?? undefined,
        }),
      });

      if (!res.ok || !res.body) {
        addMessage({ role: "assistant", content: "抱歉，發生錯誤，請稍後再試。" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        updateLastAssistantMessage(accumulated);
      }
    } catch {
      addMessage({ role: "assistant", content: "抱歉，發生網路錯誤，請稍後再試。" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="shrink-0">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>AI 助教</SheetTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearMessages} title="清除對話">
                <Eraser className="h-4 w-4" />
              </Button>
            )}
          </div>
          <SheetDescription>
            {questionContext ? "針對題目提問" : "通用解剖生理學提問"}
          </SheetDescription>
        </SheetHeader>

        {questionContext && (
          <div className="mx-4 rounded-lg border bg-muted/50 p-3">
            <p className="line-clamp-2 text-xs leading-relaxed">{questionContext.content}</p>
            <div className="mt-1.5 flex gap-1.5">
              <Badge variant="secondary" className="text-[10px]">{questionContext.category}</Badge>
              <Badge variant="outline" className="text-[10px]">答：{questionContext.correctAnswer}</Badge>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden px-4">
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="space-y-3 py-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {questionContext
                    ? "針對這道題目有什麼不懂的嗎？問我吧！"
                    : "有任何解剖生理學的問題嗎？問我吧！"}
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.imageUrl ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt={msg.content}
                          className="rounded-md w-full cursor-zoom-in"
                          onClick={() => setLightboxUrl(msg.imageUrl!)}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{msg.content}</p>
                          <div className="flex shrink-0 gap-0.5">
                            <button
                              onClick={async () => {
                                const res = await fetch("/api/images", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    title: msg.content,
                                    data: msg.imageUrl,
                                    source: "chat",
                                  }),
                                });
                                if (res.ok) setSavedIds((prev) => new Set(prev).add(i));
                              }}
                              disabled={savedIds.has(i)}
                              className="rounded-md p-1 hover:bg-background/50 transition-colors disabled:opacity-50"
                              title={savedIds.has(i) ? "已存到圖庫" : "存到圖庫"}
                            >
                              <FolderDown className={`h-3.5 w-3.5 ${savedIds.has(i) ? "text-green-500" : "text-muted-foreground"}`} />
                            </button>
                            <a
                              href={msg.imageUrl}
                              download={`${msg.content.replace(/\s+/g, "_")}.png`}
                              className="rounded-md p-1 hover:bg-background/50 transition-colors"
                              title="下載圖片"
                            >
                              <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                    {!msg.imageUrl && msg.role === "assistant" && msg.content && !isLoading && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/chat/save", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                content: msg.content,
                                questionContext: questionContext ?? undefined,
                              }),
                            });
                            if (res.ok || res.status === 409) {
                              setSavedIds((prev) => new Set(prev).add(i));
                            }
                          } catch {
                            // silently fail
                          }
                        }}
                        disabled={savedIds.has(i)}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title={savedIds.has(i) ? "已收錄至筆記" : "收錄至筆記"}
                      >
                        {savedIds.has(i) ? (
                          <><Check className="h-3 w-3 text-green-500" /> 已收錄</>
                        ) : (
                          <><BookmarkPlus className="h-3 w-3" /> 收錄至筆記</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isGeneratingImage && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    圖片產生中...
                  </div>
                </div>
              )}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入你的問題..."
              disabled={isBusy}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={isBusy || !input.trim()}
              onClick={handleGenerateImage}
              title="產生圖片"
            >
              {isGeneratingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
            <Button type="submit" size="icon" disabled={isBusy || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </SheetContent>

      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">圖片預覽</DialogTitle>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="放大圖片"
              className="w-full rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
