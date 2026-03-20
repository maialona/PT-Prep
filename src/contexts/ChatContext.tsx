"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface QuestionContext {
  questionId?: string;
  content: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string | null;
  category: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatContextValue {
  isOpen: boolean;
  questionContext: QuestionContext | null;
  messages: ChatMessage[];
  openChat: (context?: QuestionContext) => void;
  closeChat: () => void;
  clearMessages: () => void;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionContext, setQuestionContext] = useState<QuestionContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const openChat = useCallback((context?: QuestionContext) => {
    setQuestionContext(context ?? null);
    setMessages([]);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return [...prev.slice(0, -1), { ...last, content }];
      }
      return [...prev, { role: "assistant", content }];
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        questionContext,
        messages,
        openChat,
        closeChat,
        clearMessages,
        addMessage,
        updateLastAssistantMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
