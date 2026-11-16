
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductVariantSelector from
  "@/features/catalog/components/ProductVariantSelector";

import { PrismaProductRepository } from
  "@/server/modules/products/infrastructure/prisma-product.repository";

import { GetProductBySlugUseCase } from
  "@/server/modules/products/application/get-product-by-slug.use-case";

export const instant = false;

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  const repository = new PrismaProductRepository();
  const useCase = new GetProductBySlugUseCase(repository);

  const product = await useCase.execute(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f9f4] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Ruta de navegación */}
        <nav
          aria-label="Ruta de navegación"
          className="mb-8 text-sm text-gray-600"
        >
          <Link
            href="/"
            className="hover:text-[#52730E]"
          >
            Inicio
          </Link>

          {" / "}

          <Link
            href="/products"
            className="hover:text-[#52730E]"
          >
            Productos
          </Link>

          {" / "}

          <span className="text-gray-900">
            {product.name}
          </span>
        </nav>

        {/* Detalle interactivo del producto */}
        <ProductVariantSelector product={product} />
      </div>
    </main>
  );
}
