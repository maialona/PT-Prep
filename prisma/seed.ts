import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  "1.物理治療基礎學 (含解剖學、生理學、肌動學與生物力學)",
  "2.物理治療學概論 (含物理治療史、倫理學、管理學)",
  "3.物理治療技術學 (含電療學、熱療學、操作治療學、輔具學)",
  "4.骨科疾病物理治療學",
  "5.神經疾病物理治療學",
  "6.心肺疾病與小兒疾病物理治療學",
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
