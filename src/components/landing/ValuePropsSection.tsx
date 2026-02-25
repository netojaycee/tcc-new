import { BadgePercent, Palette, Truck } from "lucide-react";

const valueProps = [
  {
    title: "Quality selection",
    description:
      "Apparel, accessories, home and living goods. Make custom designs, from superb embroidery to vivid prints.",
    Icon: Palette,
  },
  {
    title: "Good discounts",
    description: "Bulk savings of up to 55% start at 25 items.",
    Icon: BadgePercent,
  },
  {
    title: "Fast delivery",
    description:
      "Nationwide delivery and no order minimums. We ship everything in 2–5 business days.",
    Icon: Truck,
  },
];

export function ValuePropsSection() {
  return (
    <section className="px-2 md:px-4 lg:px-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {valueProps.map(({ title, description, Icon }) => (
          <article
            key={title}
            className="rounded-md bg-muted px-5 py-6 md:px-6 md:py-7 flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-background">
              <Icon className="h-6 w-6 text-amber-600" />
            </div>

            <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
              {title}
            </h3>

            <p className="mt-3 text-foreground/70 text-base md:text-lg leading-[1.35]">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
