
import Link from "next/link";

import ProductCard from
  "@/features/catalog/components/ProductCard";

import { PrismaProductRepository } from
  "@/server/modules/products/infrastructure/prisma-product.repository";

import { ListProductsUseCase } from
  "@/server/modules/products/application/list-products.use-case";

export default async function FeaturedProducts() {
  const repository = new PrismaProductRepository();
  const useCase = new ListProductsUseCase(repository);

  const products = await useCase.execute();

  const featuredProducts = products.slice(0, 3);

  return (
    <section
      aria-labelledby="featured-products-title"
      className="bg-[#f7f9f4] px-6 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#52730E]">
              Nuestra selección
            </p>

            <h2
              id="featured-products-title"
              className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl"
            >
              Descubre nuestros productos
            </h2>

            <p className="mt-3 max-w-2xl text-gray-600">
              Cultiva, cuida y nutre tus plantas con
              productos de BioVerde.
            </p>
          </div>

          <Link
            href="/products"
            className="rounded-full border border-[#52730E] px-6 py-3 text-sm font-semibold text-[#52730E] transition-colors hover:bg-[#52730E] hover:text-white"
          >
            Ver catálogo completo
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <p className="text-gray-600">
            Próximamente encontrarás nuestros productos.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                featured
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
