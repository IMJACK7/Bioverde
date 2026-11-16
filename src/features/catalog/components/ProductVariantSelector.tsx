
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type {
  Product,
} from "@/server/modules/products/domain/product.repository";

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

  // Identificador único por producto y variante.
  const cartItemId = selectedVariant
    ? `product:${product.id}:variant:${selectedVariant.id}`
    : `product:${product.id}`;

  const existingCartItem = items.find(
    (item) => item.id === cartItemId
  );

  const quantityInCart = existingCartItem?.quantity ?? 0;

  // Límite local según existencias conocidas.
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

    // Clasificación provisional del artículo.
    // Los productos con receta se tratan como kits.
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
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Imagen del producto */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white">
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
          <div className="flex h-full items-center justify-center text-7xl">
            🌱
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#52730E]">
          BioVerde
        </p>

        <h1 className="mt-4 text-4xl font-bold text-gray-900">
          {product.name}
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-gray-600">
          {product.description ??
            "Conoce este producto de BioVerde."}
        </p>

        {/* Selector de variantes */}
        {hasVariants && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
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
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "border-[#52730E] bg-[#52730E] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#52730E]"
                    }`}
                  >
                    {variant.name}
                  </button>
                );
              })}
            </div>

            {selectedVariant?.description && (
              <p className="mt-4 text-sm text-gray-600">
                {selectedVariant.description}
              </p>
            )}
          </div>
        )}

        {/* Precio */}
        <p className="mt-8 text-4xl font-bold text-[#52730E]">
          {formatPrice(currentPrice)}
        </p>

        {/* Disponibilidad */}
        <p className="mt-4 text-sm text-gray-600">
          {currentStock > 0
            ? `${currentStock} unidades registradas`
            : "Producto agotado"}
        </p>

        {currentStock > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Disponibles para agregar según tu carrito:{" "}
            {remainingStock}
          </p>
        )}

        {/* Componentes del kit */}
        {selectedVariant &&
          selectedVariant.components.length > 0 && (
            <section className="mt-8 rounded-2xl border border-green-100 bg-white p-6">
              <h2 className="text-xl font-bold text-gray-900">
                ¿Qué incluye este kit?
              </h2>

              <ul className="mt-4 space-y-3">
                {selectedVariant.components.map(
                  (component) => (
                    <li
                      key={component.id}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <span
                        aria-hidden="true"
                        className="font-bold text-[#52730E]"
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

        {/* Selector de cantidad */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Cantidad:
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuantity((previous) =>
                    Math.max(1, previous - 1)
                  );
                  setAddedToCart(false);
                }}
                disabled={
                  quantity <= 1 || remainingStock <= 0
                }
                aria-label="Reducir cantidad"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>

              <span className="w-8 text-center font-semibold text-gray-900">
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
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#52730E] text-lg text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Subtotal:{" "}
              <span className="font-semibold text-gray-900">
                {formatPrice(
                  currentPrice *
                    (remainingStock > 0 ? quantity : 0)
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="w-full rounded-full bg-[#52730E] px-8 py-4 font-semibold text-white transition-colors hover:bg-[#3d570a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {remainingStock <= 0
              ? "Sin existencias para agregar"
              : "Agregar al carrito"}
          </button>

          {addedToCart && (
            <div
              role="status"
              className="rounded-xl border border-green-100 bg-[#f7f9f4] p-4 text-center"
            >
              <p className="text-sm font-semibold text-[#52730E]">
                ¡Producto agregado al carrito!
              </p>

              <Link
                href="/cart"
                className="mt-2 inline-block text-sm font-semibold text-[#52730E] underline"
              >
                Ver mi carrito
              </Link>
            </div>
          )}

          <Link
            href="/products"
            className="block text-center text-sm font-semibold text-gray-600 hover:text-[#52730E]"
          >
            Volver al catálogo
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Los precios y las existencias son preliminares.
          La disponibilidad se verificará antes de
          confirmar el pedido.
        </p>
      </div>
    </div>
  );
}
