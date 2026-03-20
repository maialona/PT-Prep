"use client";

import { useMemo, Fragment } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImportForm } from "@/components/ImportForm";
import {
  Dumbbell, Clock, AlertTriangle, Layers, Wand2, BookOpen,
  FileDown, ImageIcon, Notebook, Flame,
} from "lucide-react";

interface DayData { count: number; correct: number }

interface Props {
  calendarData: Record<string, DayData>;
  categories: { id: string; name: string; _count: { questions: number; knowledgePoints: number } }[];
}

const shortcuts = [
  { href: "/practice", label: "開始練習", icon: Dumbbell, color: "text-blue-500" },
  { href: "/review", label: "間隔複習", icon: Clock, color: "text-orange-500" },
  { href: "/wrong", label: "錯題本", icon: AlertTriangle, color: "text-red-500" },
  { href: "/flashcards", label: "知識卡片", icon: Layers, color: "text-purple-500" },
  { href: "/generate", label: "AI 出題", icon: Wand2, color: "text-green-500" },
  { href: "/notes", label: "AI 筆記", icon: Notebook, color: "text-cyan-500" },
  { href: "/gallery", label: "圖片庫", icon: ImageIcon, color: "text-pink-500" },
  { href: "/export", label: "匯出 PDF", icon: FileDown, color: "text-amber-500" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = [
  { index: 1, label: "Mon" },
  { index: 3, label: "Wed" },
  { index: 5, label: "Fri" },
];

export function HomeClient({ calendarData, categories }: Props) {
  const { streak, totalQuestions, weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const key = check.toISOString().slice(0, 10);
      if (calendarData[key] && calendarData[key].count > 0) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }

    // Total questions answered
    let totalQuestions = 0;
    for (const d of Object.values(calendarData)) totalQuestions += d.count;

    // Build GitHub-style calendar (last ~1 year, 53 weeks)
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday

    const weeks: { date: string; count: number; day: number }[][] = [];
    let currentWeek: { date: string; count: number; day: number }[] = [];
    const cursor = new Date(startDate);
    const todayStr = today.toISOString().slice(0, 10);

    while (cursor.toISOString().slice(0, 10) <= todayStr) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const entry = calendarData[dateStr];
      currentWeek.push({ date: dateStr, count: entry?.count ?? 0, day: cursor.getDay() });
      if (cursor.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Calculate month label positions
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], col: wi });
        lastMonth = month;
      }
    });

    return { streak, totalQuestions, weeks, monthLabels };
  }, [calendarData]);

  function getColor(count: number) {
    if (count === 0) return "bg-muted";
    if (count <= 5) return "bg-green-200 dark:bg-green-900";
    if (count <= 15) return "bg-green-400 dark:bg-green-700";
    if (count <= 30) return "bg-green-500 dark:bg-green-600";
    return "bg-green-700 dark:bg-green-500";
  }

  return (
    <div className="space-y-6">
      {/* Import form */}
      <div id="import">
        <ImportForm />
      </div>

      {/* GitHub-style learning heatmap */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center mb-3">
            <p className="text-sm font-medium">
              過去一年共練習 <span className="font-bold">{totalQuestions}</span> 題
              {streak > 0 && (
                <span className="ml-2 text-muted-foreground">
                  <Flame className="inline h-3.5 w-3.5 text-orange-500 -mt-0.5" /> 連續 {streak} 天
                </span>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-grid" style={{ gridTemplateColumns: `32px repeat(${weeks.length}, 14px)` }}>
              {/* Month labels row */}
              <div />
              {weeks.map((_, wi) => {
                const ml = monthLabels.find((m) => m.col === wi);
                return (
                  <div key={`m${wi}`} className="text-[11px] text-muted-foreground leading-none h-5 flex items-end">
                    {ml?.label ?? ""}
                  </div>
                );
              })}

              {/* Day rows (0=Sun .. 6=Sat) */}
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <Fragment key={dayIndex}>
                  <div className="text-[10px] text-muted-foreground leading-none flex items-center h-[14px]">
                    {DAY_LABELS.find((d) => d.index === dayIndex)?.label ?? ""}
                  </div>
                  {weeks.map((week, wi) => {
                    const cell = week.find((d) => d.day === dayIndex);
                    return (
                      <div
                        key={`c${wi}-${dayIndex}`}
                        className={`h-[12px] w-[12px] rounded-sm ${cell ? getColor(cell.count) : ""}`}
                        title={cell ? `${cell.date}：${cell.count} 題` : ""}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] text-muted-foreground mr-0.5">Less</span>
            <div className="h-[12px] w-[12px] rounded-sm bg-muted" />
            <div className="h-[12px] w-[12px] rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="h-[12px] w-[12px] rounded-sm bg-green-400 dark:bg-green-700" />
            <div className="h-[12px] w-[12px] rounded-sm bg-green-500 dark:bg-green-600" />
            <div className="h-[12px] w-[12px] rounded-sm bg-green-700 dark:bg-green-500" />
            <span className="text-[10px] text-muted-foreground ml-0.5">More</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">快速入口</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {shortcuts.map(({ href, label, icon: Icon, color }) => (
            <Link key={label} href={href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center gap-1.5 py-3 px-1">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Category overview */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">各系統題數</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/knowledge?category=${cat.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {cat.name} ({cat._count.questions})
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
