import { getProductsAction } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

export async function BestSellingSection() {
  // Fetch products - you can add a filter for featured or best-selling
  const result = await getProductsAction({
    limit: 8,
    offset: 0,
    type: "store",
    sortBy: "popular",
  });
  const products = result.success ? result.data : [];

  if (!products || products.length === 0) {
    return null;
  }
  // console.log("BestSellingSection products:", products);

  return (
    <section className="px-4 lg:px-16 py-4">
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="md:text-2xl font-semibold text-gray-900">
          our brand designs
        </h2>

        <Link href={"/products/store"} className="md:text-2xl text-red-500 underline">
          view collection
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
