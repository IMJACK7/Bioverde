
import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/server/modules/products/domain/product.repository";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductCard({
  product,
  featured = false,
}: ProductCardProps) {
  const productUrl = `/products/${product.slug}`;
  const isAvailable = product.stock > 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Imagen del producto */}
      <Link
        href={productUrl}
        aria-label={`Ver detalles de ${product.name}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52730E]"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f1f3e9]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl" aria-hidden="true">
                🌱
              </span>
            </div>
          )}

          {featured && (
            <span className="absolute left-4 top-4 rounded-full bg-[#52730E] px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Destacado
            </span>
          )}
        </div>
      </Link>

      {/* Información del producto */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold text-gray-900">
          <Link
            href={productUrl}
            className="transition-colors hover:text-[#52730E]"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-gray-600">
          {product.description ??
            "Descubre este producto de BioVerde."}
        </p>

        {/* Precio y disponibilidad */}
        <div className="mt-auto pt-5">
          <p className="text-2xl font-bold text-[#52730E]">
            {formatPrice(product.price)}
          </p>

          <p
            className={`mt-2 text-sm font-medium ${
              isAvailable
                ? "text-green-700"
                : "text-red-600"
            }`}
          >
            {isAvailable
              ? `${product.stock} unidades disponibles`
              : "Producto agotado"}
          </p>
        </div>

        {/* Botón de navegación */}
        <Link
          href={productUrl}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#52730E] px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-[#3d570a] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52730E]"
        >
          Ver producto
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
