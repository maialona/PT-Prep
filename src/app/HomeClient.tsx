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

interface Props {
  categories: { id: string; name: string; _count: { questions: number } }[];
}

const shortcuts = [
  { href: "/practice", label: "開始練習", icon: Dumbbell, color: "text-blue-500" },
  { href: "/exams", label: "歷屆試題", icon: Clock, color: "text-purple-500" },
  { href: "/wrong", label: "錯題本", icon: AlertTriangle, color: "text-red-500" },
  { href: "/notes", label: "AI 筆記", icon: Notebook, color: "text-cyan-500" },
  { href: "/export", label: "匯出 PDF", icon: FileDown, color: "text-amber-500" },
];

export function HomeClient({ categories }: Props) {
  return (
    <div className="space-y-6">
      {/* Import form */}
      <div id="import">
        <ImportForm />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">快速入口</h2>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
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
          <h2 className="text-sm font-medium text-muted-foreground mb-3">各考科題數</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/practice?category=${cat.id}`}>
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
