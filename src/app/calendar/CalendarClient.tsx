"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Flame } from "lucide-react";

interface DayData {
  count: number;
  correct: number;
}

interface Props {
  data: Record<string, DayData>;
  stats: { total: number; correct: number; wrong: number };
}

export function CalendarClient({ data, stats }: Props) {
  const { weeks, months, streak, totalDays } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 182); // ~26 weeks
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks: { date: string; count: number; correct: number }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let currentWeek: { date: string; count: number; correct: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    const todayStr = today.toISOString().slice(0, 10);

    while (cursor <= today || currentWeek.length > 0) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (dateStr > todayStr && currentWeek.length === 0) break;

      const month = cursor.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: cursor.toLocaleDateString("zh-TW", { month: "short" }),
          col: weeks.length,
        });
        lastMonth = month;
      }

      const entry = data[dateStr] || { count: 0, correct: 0 };
      currentWeek.push({ date: dateStr, count: entry.count, correct: entry.correct });

      if (cursor.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
      if (dateStr > todayStr) break;
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Calculate streak
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const key = check.toISOString().slice(0, 10);
      if (data[key] && data[key].count > 0) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    const totalDays = Object.keys(data).length;

    return { weeks, months: monthLabels, streak, totalDays };
  }, [data]);

  function getColor(count: number) {
    if (count === 0) return "bg-muted";
    if (count <= 5) return "bg-green-200 dark:bg-green-900";
    if (count <= 15) return "bg-green-400 dark:bg-green-700";
    if (count <= 30) return "bg-green-500 dark:bg-green-600";
    return "bg-green-700 dark:bg-green-500";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          學習日曆
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          追蹤每日學習進度，維持學習節奏
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {streak > 0 && (
          <Badge className="bg-orange-500 text-white flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" />
            連續 {streak} 天
          </Badge>
        )}
        <Badge variant="outline">學習天數 {totalDays} 天</Badge>
        <Badge variant="outline">總作答 {stats.total} 次</Badge>
        {stats.total > 0 && (
          <Badge variant="secondary">
            正確率 {Math.round((stats.correct / stats.total) * 100)}%
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">過去 6 個月</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex mb-1 ml-8 text-[10px] text-muted-foreground">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{ marginLeft: `${m.col * 14 + 32}px` }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            <div className="flex gap-[2px] mt-5 relative">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] text-[10px] text-muted-foreground pr-1 shrink-0">
                <div className="h-[12px]"></div>
                <div className="h-[12px] leading-[12px]">一</div>
                <div className="h-[12px]"></div>
                <div className="h-[12px] leading-[12px]">三</div>
                <div className="h-[12px]"></div>
                <div className="h-[12px] leading-[12px]">五</div>
                <div className="h-[12px]"></div>
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`h-[12px] w-[12px] rounded-sm ${getColor(day.count)}`}
                      title={`${day.date}：${day.count} 題（${day.correct} 對）`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground justify-end">
              <span>少</span>
              <div className="h-[10px] w-[10px] rounded-sm bg-muted" />
              <div className="h-[10px] w-[10px] rounded-sm bg-green-200 dark:bg-green-900" />
              <div className="h-[10px] w-[10px] rounded-sm bg-green-400 dark:bg-green-700" />
              <div className="h-[10px] w-[10px] rounded-sm bg-green-500 dark:bg-green-600" />
              <div className="h-[10px] w-[10px] rounded-sm bg-green-700 dark:bg-green-500" />
              <span>多</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
