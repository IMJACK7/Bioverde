
"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";
const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);

export default function CartView() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isReady,
  } = useCart();

  if (!isReady) {
    return (
      <p
        role="status"
        className="py-12 text-center text-gray-500"
      >
        Cargando tu carrito...
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
        <div
          className="mb-4 text-5xl"
          aria-hidden="true"
        >
          🛒
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          Tu carrito está vacío
        </h2>

        <p className="mx-auto mt-3 max-w-md text-gray-500">
          Explora nuestros productos o crea tu
          propio kit de cultivo personalizado.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-[#52730E] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#405a0b]"
          >
            Ver productos
          </Link>

          <Link
            href="/arma-tu-kit"
            className="rounded-full border border-[#52730E] px-6 py-3 font-semibold text-[#52730E] transition-colors hover:bg-green-50"
          >
            Arma tu Kit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Lista de artículos */}
      <section
        aria-labelledby="cart-items-title"
        className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="cart-items-title"
            className="text-xl font-bold text-gray-900"
          >
            Productos seleccionados
          </h2>

          <button
            type="button"
            onClick={clearCart}
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Vaciar carrito
          </button>
        </div>

        <ul className="mt-6 divide-y divide-gray-200">
          {items.map((item) => {
            const hasKnownStock =
              Number.isSafeInteger(item.maxStock) &&
              item.maxStock !== undefined &&
              item.maxStock >= 0;

            const maxStock = hasKnownStock
              ? item.maxStock!
              : null;

            const limitReached =
              maxStock !== null &&
              item.quantity >= maxStock;

            const isCustomKit =
              item.type === "CUSTOM_KIT";

            const components =
              isCustomKit
                ? item.components ?? []
                : [];

            return (
              <li
                key={item.id}
                className="space-y-5 py-6 first:pt-0 last:pb-0"
              >
                {/* Información principal */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#52730E]">
                      {isCustomKit
                        ? "Kit personalizado"
                        : item.type === "PREBUILT_KIT"
                          ? "Kit prediseñado"
                          : "Producto"}
                    </p>

                    <h3 className="text-lg font-bold text-gray-900">
                      {item.name}
                    </h3>

                    {item.variantName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Variante: {item.variantName}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-gray-600">
                      Precio por unidad:
                      <span className="ml-2 font-semibold text-[#52730E]">
                        {formatPrice(item.unitPrice)}
                      </span>
                    </p>

                    {maxStock !== null && (
                      <p className="mt-2 text-xs text-gray-500">
                        Existencias conocidas: {maxStock}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>

                {/* Componentes del kit personalizado */}
                {isCustomKit &&
                  components.length > 0 && (
                    <div className="rounded-xl border border-green-100 bg-[#f7f9f4] p-4">
                      <h4 className="text-sm font-bold text-gray-900">
                        Componentes de tu kit
                      </h4>

                      <p className="mt-1 text-xs text-gray-500">
                        Cantidades incluidas en cada kit
                        personalizado.
                      </p>

                      <ul className="mt-4 space-y-3">
                        {components.map((component) => (
                          <li
                            key={component.componentId}
                            className="flex flex-wrap items-start justify-between gap-2 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800">
                                {component.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {component.quantity} por kit
                              </p>
                            </div>

                            <span className="text-xs font-semibold text-gray-700">
                              {formatPrice(
                                component.unitPrice *
                                  component.quantity
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {item.quantity > 1 && (
                        <div className="mt-4 border-t border-green-200 pt-3">
                          <p className="text-xs font-semibold text-[#52730E]">
                            Total para {item.quantity} kits:
                          </p>

                          <ul className="mt-2 space-y-1 text-xs text-gray-600">
                            {components.map((component) => (
                              <li key={component.componentId}>
                                {component.quantity *
                                  item.quantity}{" "}
                                × {component.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                {/* Cantidades y subtotal */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      Cantidad
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        aria-label={`Reducir cantidad de ${item.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        −
                      </button>

                      <span className="w-8 text-center font-semibold text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        disabled={limitReached}
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#52730E] text-lg text-white transition-colors hover:bg-[#405a0b] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Subtotal
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#52730E]">
                      {formatPrice(
                        item.unitPrice * item.quantity
                      )}
                    </p>
                  </div>
                </div>

                {/* Mensajes de disponibilidad */}
                {limitReached && (
                  <p
                    role="status"
                    className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                  >
                    Has alcanzado el límite de existencias
                    conocido para este artículo.
                  </p>
                )}

                {isCustomKit && maxStock === null && (
                  <p className="text-xs leading-relaxed text-gray-500">
                    La disponibilidad de este kit depende
                    de las existencias de cada componente
                    y se verificará antes de confirmar
                    el pedido.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Resumen del carrito */}
      <aside className="rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-xl font-bold text-gray-900">
          Resumen del pedido
        </h2>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Artículos diferentes
            </span>

            <span className="font-semibold text-gray-900">
              {items.length}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Unidades totales
            </span>

            <span className="font-semibold text-gray-900">
              {totalItems}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <span className="font-semibold text-gray-900">
              Total estimado
            </span>

            <span className="text-xl font-bold text-[#52730E]">
              {formatPrice(totalPrice)}
            </span>
          </div>
          {items.length > 0 && (
                <Link
                    href="/checkout"
                    className="mt-5 flex w-full items-center justify-center rounded-xl bg-green-700 px-6 py-4 text-center font-semibold text-white transition hover:bg-green-800"
                >
                    Finalizar pedido
                </Link>
                )}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-gray-500">
          Este total es preliminar. Los precios,
          las existencias y los costos de envío
          deberán verificarse antes de confirmar
          el pedido.
        </p>

        <div className="mt-6 rounded-xl border border-green-100 bg-[#f7f9f4] p-4">
          <p className="text-sm font-semibold text-[#52730E]">
            🌱 Tu pedido BioVerde
          </p>

          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            Estamos preparando la siguiente etapa
            del proceso de compra. Próximamente
            podrás revisar y confirmar tu pedido.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/products"
            className="block rounded-full border border-[#52730E] px-5 py-3 text-center text-sm font-semibold text-[#52730E] transition-colors hover:bg-green-50"
          >
            Seguir comprando
          </Link>

          <Link
            href="/arma-tu-kit"
            className="block text-center text-sm font-semibold text-gray-600 transition-colors hover:text-[#52730E]"
          >
            Crear otro kit personalizado
          </Link>
        </div>
      </aside>
    </div>
  );
}
