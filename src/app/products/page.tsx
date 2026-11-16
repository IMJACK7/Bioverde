
import ProductCard from
  "@/features/catalog/components/ProductCard";

import { PrismaProductRepository } from
  "@/server/modules/products/infrastructure/prisma-product.repository";

import { ListProductsUseCase } from
  "@/server/modules/products/application/list-products.use-case";

export const instant = false;

export default async function ProductsPage() {
  const repository = new PrismaProductRepository();
  const useCase = new ListProductsUseCase(repository);

  const products = await useCase.execute();

  return (
    <main className="min-h-screen bg-[#f7f9f4] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#52730E]">
            Catálogo BioVerde
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Nuestros productos
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Descubre nuestros abonos orgánicos y kits
            de huerto para comenzar a cultivar en casa.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="text-gray-600">
            Todavía no hay productos disponibles.
          </p>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
