import { PrismaPg } from '@prisma/adapter-pg';
import { generateSlug } from '../src/lib/utils';
import { PrismaClient } from './generated';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const categories = await prisma.category.findMany();
  for (const category of categories) {
    if (!category.slug || category.slug === "") {
      const slug = generateSlug(category.title);
      await prisma.category.update({
        where: { id: category.id },
        data: { slug },
      });
      console.log(`Updated category ${category.title} with slug: ${slug}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
