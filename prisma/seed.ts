import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  "皮膜系統",
  "骨骼系統",
  "肌肉系統",
  "神經系統",
  "內分泌系統",
  "循環系統",
  "免疫系統",
  "呼吸系統",
  "消化系統",
  "泌尿系統",
  "生殖系統",
];

async function main() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded categories:", CATEGORIES.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
