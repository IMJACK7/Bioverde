
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
        className="py-12 text-center text-text-secondary"
      >
        Cargando tu carrito...
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
        <div
          className="mb-4 text-5xl"
          aria-hidden="true"
        >
          🛒
        </div>

        <h2 className="text-2xl font-bold text-earth">
          Tu carrito está vacío
        </h2>

        <p className="mx-auto mt-3 max-w-md text-text-secondary">
          Explora nuestros productos o crea tu
          propio kit de cultivo personalizado.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Ver productos
          </Link>

          <Link
            href="/arma-tu-kit"
            className="rounded-full border border-primary px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary-light"
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
        className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="cart-items-title"
            className="text-xl font-bold text-earth"
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

        <ul className="mt-6 divide-y divide-border">
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
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      {isCustomKit
                        ? "Kit personalizado"
                        : item.type === "PREBUILT_KIT"
                          ? "Kit prediseñado"
                          : "Producto"}
                    </p>

                    <h3 className="text-lg font-bold text-earth">
                      {item.name}
                    </h3>

                    {item.variantName && (
                      <p className="mt-1 text-sm text-text-secondary">
                        Variante: {item.variantName}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-text-secondary">
                      Precio por unidad:
                      <span className="ml-2 font-semibold text-primary">
                        {formatPrice(item.unitPrice)}
                      </span>
                    </p>

                    {maxStock !== null && (
                      <p className="mt-2 text-xs text-text-secondary">
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
                    <div className="rounded-xl border border-sage bg-primary-light/40 p-4">
                      <h4 className="text-sm font-bold text-earth">
                        Componentes de tu kit
                      </h4>

                      <p className="mt-1 text-xs text-text-secondary">
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
                              <p className="font-medium text-earth">
                                {component.name}
                              </p>

                              <p className="mt-1 text-xs text-text-secondary">
                                {component.quantity} por kit
                              </p>
                            </div>

                            <span className="text-xs font-semibold text-text-secondary">
                              {formatPrice(
                                component.unitPrice *
                                  component.quantity
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {item.quantity > 1 && (
                        <div className="mt-4 border-t border-sage pt-3">
                          <p className="text-xs font-semibold text-primary">
                            Total para {item.quantity} kits:
                          </p>

                          <ul className="mt-2 space-y-1 text-xs text-text-secondary">
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
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-text-secondary">
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
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg text-earth transition-colors hover:bg-surface-muted"
                      >
                        −
                      </button>

                      <span className="w-8 text-center font-semibold text-earth">
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
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-text-secondary">
                      Subtotal
                    </p>

                    <p className="mt-1 text-lg font-bold text-primary">
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
                  <p                   className="text-xs leading-relaxed text-text-secondary">
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
      <aside className="rounded-2xl border border-border bg-surface p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-xl font-bold text-earth">
          Resumen del pedido
        </h2>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Artículos diferentes
            </span>

            <span className="font-semibold text-earth">
              {items.length}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Unidades totales
            </span>

            <span className="font-semibold text-earth">
              {totalItems}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-earth">
              Total estimado
            </span>

            <span className="text-xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
          {items.length > 0 && (
                <Link
                    href="/checkout"
                    className="mt-5 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-center font-semibold text-white transition hover:bg-primary-hover"
                >
                    Finalizar pedido
                </Link>
                )}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-text-secondary">
          Este total es preliminar. Los precios,
          las existencias y los costos de envío
          deberán verificarse antes de confirmar
          el pedido.
        </p>

        <div className="mt-6 rounded-xl border border-sage bg-primary-light/40 p-4">
          <p className="text-sm font-semibold text-primary">
            🌱 Tu pedido BioVerde
          </p>

          <p className="mt-2 text-xs leading-relaxed text-text-secondary">
            Estamos preparando la siguiente etapa
            del proceso de compra. Próximamente
            podrás revisar y confirmar tu pedido.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/products"
            className="block rounded-full border border-primary px-5 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
          >
            Seguir comprando
          </Link>

          <Link
            href="/arma-tu-kit"
            className="block text-center text-sm font-semibold text-text-secondary transition-colors hover:text-primary"
          >
            Crear otro kit personalizado
          </Link>
        </div>
      </aside>
    </div>
  );
}
