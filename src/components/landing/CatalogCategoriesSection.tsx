import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const catalogCategories = [
  { name: "Apparel", featured: true },
  { name: "Bags & accessories", image: "/feature.png" },
  { name: "Home & lifestyle", image: "/feature.png" },
  { name: "Stationery", image: "/feature.png" },
  { name: "Phone & tech", image: "/feature.png" },
  { name: "Apparel", image: "/feature.png" },
];

export function CatalogCategoriesSection() {
  return (
    <section className="px-2 md:px-4 lg:px-16">
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-medium text-foreground">
          customize your own products
        </h2>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {catalogCategories.map((category, index) => (
            <Link
              key={`${category.name}-${index}`}
              href="/products"
              className="group relative aspect-square rounded-md overflow-hidden"
            >
              {category.featured ? (
                <div className="absolute inset-0 bg-foreground/70" />
              ) : (
                <>
                  <Image
                    src={category.image ?? "/feature.png"}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/55" />
                </>
              )}

              <div className="absolute inset-0 flex items-center justify-center px-2 text-center">
                <span className="text-background text-sm md:text-base leading-tight">
                  {category.name}
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
              <Link href="/category/catalog">See all Categories</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
