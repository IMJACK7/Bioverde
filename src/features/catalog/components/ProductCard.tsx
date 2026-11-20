
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

  // Los productos con variantes manejan
  // inventario independiente por presentación.
  const hasVariants = product.variants.length > 0;

  const availableVariants = hasVariants
    ? product.variants.filter(
        (variant) => variant.stock > 0
      )
    : [];

  const isAvailable = hasVariants
    ? availableVariants.length > 0
    : product.stock > 0;

  // Mostrar el menor precio disponible
  // entre las variantes activas.
  const displayPrice = hasVariants
    ? Math.min(
        ...product.variants.map(
          (variant) => variant.price
        )
      )
    : product.price;

  const availabilityText = hasVariants
    ? isAvailable
      ? `${availableVariants.length} ${
          availableVariants.length === 1
            ? "presentación disponible"
            : "presentaciones disponibles"
        }`
      : "Producto agotado"
    : isAvailable
      ? `${product.stock} unidades disponibles`
      : "Producto agotado";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_16px_rgba(48,44,37,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-sage hover:shadow-[0_14px_32px_rgba(48,44,37,0.12)]">
      {/* IMAGEN DEL PRODUCTO */}
      <Link
        href={productUrl}
        aria-label={`Ver detalles de ${product.name}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary-light">
              <span
                className="text-5xl"
                aria-hidden="true"
              >
                🌱
              </span>
            </div>
          )}

          {/* ETIQUETA DESTACADO */}
          {featured && (
            <span className="absolute left-4 top-4 rounded-full bg-earth px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
              Destacado
            </span>
          )}

          {/* ETIQUETA AGOTADO */}
          {!isAvailable && (
            <span className="absolute right-4 top-4 rounded-full bg-red-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
              Agotado
            </span>
          )}
        </div>
      </Link>

      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* DETALLE DECORATIVO */}
        <div className="mb-4 h-1 w-10 rounded-full bg-terracotta" />

        <h3 className="text-xl font-semibold leading-snug text-earth">
          <Link
            href={productUrl}
            className="transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-text-secondary">
          {product.description ??
            "Descubre este producto de BioVerde."}
        </p>

        {/* PRECIO Y DISPONIBILIDAD */}
        <div className="mt-auto pt-5">
          {hasVariants && (
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">
              Desde
            </p>
          )}

          <p className="text-2xl font-bold tracking-tight text-primary">
            {formatPrice(displayPrice)}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${
                isAvailable
                  ? "bg-primary"
                  : "bg-red-800"
              }`}
            />

            <p
              className={`text-sm font-medium ${
                isAvailable
                  ? "text-primary"
                  : "text-red-800"
              }`}
            >
              {availabilityText}
            </p>
          </div>
        </div>

        {/* BOTÓN */}
        <Link
          href={productUrl}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-primary-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Ver producto

          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
