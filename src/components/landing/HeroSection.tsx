import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className=" py-0 md:py-4 px-2 md:px-4 lg:px-16">
      <div className="w-full md:rounded-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-90">
          <div className="relative border order-2 md:order-1 h-64 md:h-full max-h-[80vh]">
            <Image
              src="/hero.png"
              alt="Custom products hero"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="order-1 md:order-2 w-full px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 flex flex-col justify-center">
            <p className="flex items-center justify-center md:justify-start gap-1 text-base text-foreground/90 mb-3">
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </span>
              <span>
                Sold over <span className="font-semibold">500k+</span> products
              </span>
            </p>

            <h1 className="text-center md:text-left text-3xl md:text-4xl font-semibold leading-[0.95] tracking-tight text-foreground">
              custom products.
              <br />
              made easy.
            </h1>

            <p className="text-center md:text-left text-foreground/70 text-lg leading-[1.15] mt-4">
              choose from our ready-made designs or personalize any product in
              minutes
            </p>

            <div className="mt-6">
              <Button
                asChild
                className="w-full h-10 text-sm rounded"
              >
                <Link href="/products">Explore Products</Link>
              </Button>
            </div>

            <p className="mt-3 flex items-center justify-center  gap-2 text-base text-foreground/70">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Realistic previews, quality prints, and reliable delivery
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
