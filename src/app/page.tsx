import { getCategories } from "@/lib/actions";
import { HomeClient } from "./HomeClient";

export default async function Home() {
  const categories = await getCategories();

  return (
    <HomeClient
      categories={categories}
    />
  );
}
