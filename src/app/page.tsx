
import { Suspense } from "react";

import HeroSection from "@/features/home/components/HeroSection";
import FeaturedProducts from "@/features/home/components/FeaturedProducts";

export default function HomePage() {
  return (
    <main id="main-content">
      <HeroSection />

      <Suspense
        fallback={
          <section className="bg-[#f7f9f4] px-6 py-20">
            <div className="mx-auto max-w-7xl">
              <p className="text-gray-600">
                Cargando productos destacados...
              </p>
            </div>
          </section>
        }
      >
        <FeaturedProducts />
      </Suspense>
    </main>
  );
}
