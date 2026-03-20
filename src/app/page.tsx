export const dynamic = "force-dynamic";

import { getLearningCalendar, getCategories } from "@/lib/actions";
import { HomeClient } from "./HomeClient";

export default async function Home() {
  const [calendarData, categories] = await Promise.all([
    getLearningCalendar(),
    getCategories(),
  ]);

  return (
    <HomeClient
      calendarData={calendarData}
      categories={categories}
    />
  );
}
