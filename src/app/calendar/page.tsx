export const dynamic = "force-dynamic";

import { getLearningCalendar, getPracticeStats } from "@/lib/actions";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const [calendarData, stats] = await Promise.all([
    getLearningCalendar(),
    getPracticeStats(),
  ]);

  return <CalendarClient data={calendarData} stats={stats} />;
}
