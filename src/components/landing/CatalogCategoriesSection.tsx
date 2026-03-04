import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCategoriesAction } from "@/lib/actions/category.actions";

export async function CatalogCategoriesSection() {
  // Fetch categories dynamically (will be cached in Redis)
  const result = await getCategoriesAction({
    limit: 12, // Fetch extra to allow slicing
    offset: 0,
  });

  // Get categories from result, default to empty array if failed
  const allCategories = result.success ? result.data : [];

  // Slice to show categories 5-11 (6 items)
  const displayCategories = allCategories && allCategories.slice(5, 11) || [];

  return (
    <section className="px-2 md:px-4 lg:px-16">
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-medium text-foreground">
          customize your own products
        </h2>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {displayCategories.map((category, index) => (
            <Link
              key={`${category.id}-${index}`}
              href={`/products?category=${category.slug}`}
              className="group relative aspect-square rounded-md overflow-hidden"
            >
              {/* Overlay with dark background */}
              <div className="absolute inset-0 bg-black/60" />

              {/* Background image if available */}
              {category.imageUrl && (
                <Image
                  src={category.imageUrl}
                  alt={category.title}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105 blur-[1px]"
                />
              )}

              {/* Text overlay */}
              <div className=" absolute inset-0 flex items-center justify-center px-2 text-center">
                <span className="bg-black text-background text-sm md:text-base leading-tight font-medium">
                  {category.title}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-md bg-foreground px-4 py-4 md:px-5 md:py-5">
          <h3 className="text-background text-xl font-medium">
            what you design is what you get.
          </h3>
          <p className="mt-2 text-background/80 text-sm md:text-base leading-relaxed">
            our realistic previews show exactly how your product will look
            before printing, so there are no surprises after delivery.
          </p>

          <div className="mt-4">
            <Button
              asChild
              className="md:w-1/3 w-full h-11 md:h-12 text-base md:text-lg"
            >
              <Link href="/products">See all Categories</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
