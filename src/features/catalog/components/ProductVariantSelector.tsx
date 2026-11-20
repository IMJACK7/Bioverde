
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/server/modules/products/domain/product.repository";
import { useCart } from "@/features/cart/context/CartContext";
import type {
  CartItem,
  CartItemType,
} from "@/features/cart/types/cart.types";

interface ProductVariantSelectorProps {
  product: Product;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductVariantSelector({
  product,
}: ProductVariantSelectorProps) {
  const { addItem, items } = useCart();

  const [selectedVariantId, setSelectedVariantId] =
    useState<string | null>(
      product.variants[0]?.id ?? null
    );

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const hasVariants = product.variants.length > 0;

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId
  );

  const currentPrice =
    selectedVariant?.price ?? product.price;

  const currentStock =
    selectedVariant?.stock ?? product.stock;

  const currentImage =
    selectedVariant?.imageUrl ?? product.imageUrl;

  const cartItemId = selectedVariant
    ? `product:${product.id}:variant:${selectedVariant.id}`
    : `product:${product.id}`;

  const existingCartItem = items.find(
    (item) => item.id === cartItemId
  );

  const quantityInCart =
    existingCartItem?.quantity ?? 0;

  const remainingStock = Math.max(
    0,
    currentStock - quantityInCart
  );

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setAddedToCart(false);
  };

  const handleAddToCart = () => {
    if (
      remainingStock <= 0 ||
      quantity < 1 ||
      quantity > remainingStock
    ) {
      return;
    }

    const itemType: CartItemType =
      selectedVariant &&
      selectedVariant.components.length > 0
        ? "PREBUILT_KIT"
        : "PRODUCT";

    const cartItem: CartItem = {
      id: cartItemId,
      type: itemType,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantName: selectedVariant?.name,
      imageUrl: currentImage,
      unitPrice: currentPrice,
      quantity,
      maxStock: currentStock,
    };

    addItem(cartItem);
    setQuantity(1);
    setAddedToCart(true);
  };

  const canAddToCart =
    remainingStock > 0 &&
    quantity >= 1 &&
    quantity <= remainingStock;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      {/* IMAGEN DEL PRODUCTO */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface-muted shadow-[0_8px_28px_rgba(48,44,37,0.08)]">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={
              selectedVariant
                ? `${product.name} - ${selectedVariant.name}`
                : product.name
            }
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary-light text-7xl">
            🌱
          </div>
        )}
      </div>

      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className="flex flex-col justify-center">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-1 w-10 rounded-full bg-terracotta" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth">
            BioVerde · Cultiva naturalmente
          </p>
        </div>

        <h1 className="text-3xl font-bold leading-tight text-earth sm:text-4xl">
          {product.name}
        </h1>

        <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
          {product.description ??
            "Conoce este producto de BioVerde."}
        </p>

        {/* SELECTOR DE VARIANTES */}
        {hasVariants && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-earth">
              Selecciona una opción:
            </h2>

            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                const isSelected =
                  variant.id === selectedVariantId;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() =>
                      handleVariantChange(variant.id)
                    }
                    aria-pressed={isSelected}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-surface text-earth hover:border-primary hover:bg-primary-light"
                    }`}
                  >
                    {variant.name}
                  </button>
                );
              })}
            </div>

            {selectedVariant?.description && (
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                {selectedVariant.description}
              </p>
            )}
          </div>
        )}

        {/* PRECIO */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Precio
          </p>

          <p className="mt-1 text-4xl font-bold tracking-tight text-primary">
            {formatPrice(currentPrice)}
          </p>
        </div>

        {/* DISPONIBILIDAD */}
        <div className="mt-4 flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              currentStock > 0
                ? "bg-primary"
                : "bg-red-800"
            }`}
          />

          <p
            className={`text-sm font-medium ${
              currentStock > 0
                ? "text-primary"
                : "text-red-800"
            }`}
          >
            {currentStock > 0
              ? `${currentStock} unidades registradas`
              : "Producto agotado"}
          </p>
        </div>

        {currentStock > 0 && (
          <p className="mt-2 text-xs text-text-secondary">
            Disponibles para agregar según tu carrito:{" "}
            <strong>{remainingStock}</strong>
          </p>
        )}

        {/* COMPONENTES DEL KIT */}
        {selectedVariant &&
          selectedVariant.components.length > 0 && (
            <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-4 h-1 w-10 rounded-full bg-terracotta" />

              <h2 className="text-xl font-bold text-earth">
                ¿Qué incluye este kit?
              </h2>

              <ul className="mt-5 space-y-3">
                {selectedVariant.components.map(
                  (component) => (
                    <li
                      key={component.id}
                      className="flex items-start gap-3 text-sm text-text-secondary"
                    >
                      <span
                        aria-hidden="true"
                        className="font-bold text-primary"
                      >
                        ✓
                      </span>

                      <span>
                        {component.quantity} ×{" "}
                        {component.name}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

        {/* CANTIDAD */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-earth">
            Cantidad:
          </h2>

          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3 rounded-full border border-border bg-surface p-1.5">
              <button
                type="button"
                onClick={() => {
                  setQuantity((previous) =>
                    Math.max(1, previous - 1)
                  );
                  setAddedToCart(false);
                }}
                disabled={
                  quantity <= 1 ||
                  remainingStock <= 0
                }
                aria-label="Reducir cantidad"
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold text-earth transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>

              <span className="w-8 text-center font-semibold text-earth">
                {remainingStock > 0 ? quantity : 0}
              </span>

              <button
                type="button"
                onClick={() => {
                  setQuantity((previous) =>
                    Math.min(
                      remainingStock,
                      previous + 1
                    )
                  );
                  setAddedToCart(false);
                }}
                disabled={
                  remainingStock <= 0 ||
                  quantity >= remainingStock
                }
                aria-label="Aumentar cantidad"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <p className="text-sm text-text-secondary">
              Subtotal:{" "}
              <span className="font-bold text-earth">
                {formatPrice(
                  currentPrice *
                    (remainingStock > 0 ? quantity : 0)
                )}
              </span>
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="w-full rounded-full bg-primary px-8 py-4 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            {remainingStock <= 0
              ? "Sin existencias para agregar"
              : "Agregar al carrito"}
          </button>

          {addedToCart && (
            <div
              role="status"
              className="rounded-xl border border-sage bg-primary-light p-4 text-center"
            >
              <p className="text-sm font-semibold text-primary">
                ¡Producto agregado al carrito!
              </p>

              <Link
                href="/cart"
                className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                Ver mi carrito
              </Link>
            </div>
          )}

          <Link
            href="/products"
            className="block text-center text-sm font-semibold text-earth transition-colors hover:text-primary"
          >
            Volver al catálogo
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-text-secondary">
          Los precios y las existencias son
          preliminares. La disponibilidad se
          verificará antes de confirmar el pedido.
        </p>
      </div>
    </div>
  );
}
