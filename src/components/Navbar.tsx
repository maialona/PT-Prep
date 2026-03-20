"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookOpen, MessageCircle, Notebook,
  Sun, Moon, Dumbbell, CalendarDays,
  Menu, X, Home, AlertTriangle, FileDown,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";

const navLinks = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/practice", label: "開始練習", icon: Dumbbell },
  { href: "/exams", label: "歷屆試題", icon: CalendarDays },
  { href: "/questions", label: "題庫", icon: BookOpen },
  { href: "/notes", label: "筆記", icon: Notebook },
];

const moreLinks = [
  { href: "/wrong", label: "錯題本", icon: AlertTriangle },
  { href: "/", label: "匯入題目", icon: Upload, hash: "#import" },
  { href: "/export", label: "匯出", icon: FileDown },
];

const mobileTabLinks = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/practice", label: "練習", icon: Dumbbell },
  { href: "/wrong", label: "錯題", icon: AlertTriangle },
];

export function Navbar() {
  const pathname = usePathname();
  const { openChat } = useChat();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/" className="mr-6 flex items-center gap-2 font-bold shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/PWA192x192.png" alt="Logo" className="h-6 w-6 rounded-md" />
            <span className="hidden sm:inline">PT-Prep 物理治療國考</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                  pathname === href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="切換深色/淺色模式"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => openChat()}
              title="問 AI 助教"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 pb-3 pt-1">
            <nav className="grid grid-cols-3 gap-1">
              {[...navLinks, ...moreLinks].map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md py-2.5 text-xs font-medium transition-colors hover:bg-accent",
                    pathname === href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom tab */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-around h-14">
          {mobileTabLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                pathname === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            更多
          </button>
        </div>
      </nav>
    </>
  );
}
