
"use client";

import { useMemo, useState } from "react";

import type {
  KitComponent,
  KitComponentType,
} from "@/server/modules/kit-components/domain/kit-component.repository";

import {
  getKitRecommendations,
} from "../lib/kit-recommendations";

import { useCart } from "@/features/cart/context/CartContext";
import type { CartItem } from "@/features/cart/types/cart.types";
interface KitBuilderProps {
  components: KitComponent[];
}

const categories: {
  type: KitComponentType;
  title: string;
}[] = [
  { type: "SEED", title: "Semillas" },
  { type: "FERTILIZER", title: "Abonos orgánicos" },
  { type: "SUBSTRATE", title: "Sustratos" },
  { type: "POT", title: "Macetas" },
  { type: "TOOL", title: "Herramientas" },
  { type: "GUIDE", title: "Guías de cultivo" },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);

export default function KitBuilder({
  components,
}: KitBuilderProps) {
  const [quantities, setQuantities] = useState<
    Record<string, number>
    
  >({});
  const { addItem } = useCart();

  const [addedToCart, setAddedToCart] = useState(false);

  // Actualizar cantidades respetando existencias.
  const updateQuantity = (
    component: KitComponent,
    quantity: number
  ) => {
    setAddedToCart(false);

    const safeQuantity = Math.max(
      0,
      Math.min(component.stock, quantity)
    );

    setQuantities((previous) => ({
      ...previous,
      [component.id]: safeQuantity,
    }));
  };

  // Agregar una unidad desde una recomendación.
  const addRecommendedComponent = (
    component: KitComponent
  ) => {
    setAddedToCart(false);

    setQuantities((previous) => {
      const currentQuantity =
        previous[component.id] ?? 0;

      if (currentQuantity >= component.stock) {
        return previous;
      }

      return {
        ...previous,
        [component.id]: currentQuantity + 1,
      };
    });
  };

  // Componentes seleccionados.
  const selectedComponents = useMemo(
    () =>
      components.filter(
        (component) =>
          (quantities[component.id] ?? 0) > 0
      ),
    [components, quantities]
  );

  // Precio total estimado.
  const total = useMemo(
    () =>
      selectedComponents.reduce(
        (sum, component) =>
          sum +
          component.price *
            (quantities[component.id] ?? 0),
        0
      ),
    [selectedComponents, quantities]
  );

  // Cantidad total de unidades.
  const totalUnits = selectedComponents.reduce(
    (sum, component) =>
      sum + (quantities[component.id] ?? 0),
    0
  );

  // Recomendaciones dinámicas.
  const recommendations = useMemo(
    () =>
      getKitRecommendations(
        components,
        quantities
      ),
    [components, quantities]
  );

  const handleAddToCart = () => {
    if (selectedComponents.length === 0) {
      return;
    }

    const kitComponents = selectedComponents.map(
      (component) => ({
        componentId: component.id,
        name: component.name,
        quantity: quantities[component.id] ?? 0,
        unitPrice: component.price,
      })
    );

    // Identificador estable para esta configuración.
    const configurationKey = [...kitComponents]
      .sort((a, b) =>
        a.componentId.localeCompare(b.componentId)
      )
      .map(
        (component) =>
          `${component.componentId}:${component.quantity}`
      )
      .join("|");

    const cartItem: CartItem = {
      id: `custom-kit:${configurationKey}`,
      type: "CUSTOM_KIT",
      name: "Kit personalizado BioVerde",
      unitPrice: total,
      quantity: 1,
      components: kitComponents,
    };

    addItem(cartItem);
    setAddedToCart(true);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Catálogo de componentes */}
      <div className="space-y-8">
        {categories.map((category) => {
          const items = components.filter(
            (component) =>
              component.type === category.type
          );

          if (items.length === 0) {
            return null;
          }

          return (
            <section
              key={category.type}
              id={`kit-category-${category.type.toLowerCase()}`}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <h2 className="mb-5 text-2xl font-bold text-gray-900">
                {category.title}
              </h2>

              <div className="space-y-4">
                {items.map((component) => {
                  const quantity =
                    quantities[component.id] ?? 0;

                  return (
                    <div
                      key={component.id}
                      className="flex flex-col gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {component.name}
                        </h3>

                        {component.description && (
                          <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            {component.description}
                          </p>
                        )}

                        <p className="mt-2 text-sm font-medium text-[#52730E]">
                          {formatPrice(component.price)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Disponibles: {component.stock}
                        </p>
                      </div>

                      {/* Control de cantidad */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              component,
                              quantity - 1
                            )
                          }
                          disabled={quantity === 0}
                          aria-label={`Quitar una unidad de ${component.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>

                        <span className="w-8 text-center font-semibold text-gray-900">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              component,
                              quantity + 1
                            )
                          }
                          disabled={
                            quantity >= component.stock
                          }
                          aria-label={`Agregar una unidad de ${component.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#52730E] text-lg text-white transition-colors hover:bg-[#405a0b] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Resumen del kit */}
      <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Tu kit personalizado
          </h2>

          {selectedComponents.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuantities({});
                setAddedToCart(false);
              }}
              className="shrink-0 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Limpiar kit
            </button>
          )}
        </div>

        {/* Componentes seleccionados */}
        {selectedComponents.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            Selecciona los componentes que deseas
            incluir en tu kit.
          </p>
        ) : (
          <ul className="mt-5 space-y-4">
            {selectedComponents.map((component) => {
              const quantity =
                quantities[component.id] ?? 0;

              return (
                <li
                  key={component.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-gray-700">
                    {quantity} × {component.name}
                  </span>

                  <span className="shrink-0 font-semibold text-gray-900">
                    {formatPrice(
                      component.price * quantity
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Totales */}
        <div className="mt-6 border-t border-gray-200 pt-5">
          <p className="text-sm text-gray-500">
            Componentes seleccionados: {totalUnits}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-gray-900">
              Total estimado
            </span>

            <span className="text-2xl font-bold text-[#52730E]">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-gray-500">
          Este es un cálculo preliminar. Los precios
          y existencias se verificarán al confirmar
          el pedido.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={selectedComponents.length === 0}
            className="w-full rounded-full bg-[#52730E] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#405a0b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Agregar kit al carrito
          </button>

          {addedToCart && (
            <p
              role="status"
              className="text-center text-sm font-medium text-[#52730E]"
            >
              ¡Kit agregado al carrito correctamente!
            </p>
          )}
        </div>

        {/* Recomendaciones interactivas */}
        {recommendations.length > 0 && (
          <section
            aria-labelledby="kit-recommendations-title"
            className="mt-6 border-t border-gray-200 pt-5"
          >
            <h3
              id="kit-recommendations-title"
              className="text-lg font-bold text-gray-900"
            >
              🌱 Recomendaciones para tu kit
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Estas sugerencias son opcionales.
              Puedes personalizar tu kit como prefieras.
            </p>

            <div className="mt-4 space-y-4">
              {recommendations.map(
                (recommendation) => {
                  const suggestedComponents =
                    recommendation.suggestedType
                      ? components.filter(
                          (component) =>
                            component.type ===
                              recommendation.suggestedType &&
                            component.stock > 0
                        )
                      : [];

                  return (
                    <div
                      key={recommendation.id}
                      className="rounded-xl border border-green-100 bg-[#f7f9f4] p-4"
                    >
                      <h4 className="text-sm font-semibold text-[#52730E]">
                        {recommendation.title}
                      </h4>

                      <p className="mt-2 text-xs leading-relaxed text-gray-600">
                        {recommendation.message}
                      </p>

                      {/* Opciones disponibles */}
                      {suggestedComponents.length > 0 && (
                        <div className="mt-4 space-y-3 border-t border-green-100 pt-3">
                          {suggestedComponents.map(
                            (component) => {
                              const quantity =
                                quantities[component.id] ??
                                0;

                              const stockReached =
                                quantity >=
                                component.stock;

                              return (
                                <div
                                  key={component.id}
                                  className="space-y-2"
                                >
                                  <p className="text-xs font-semibold text-gray-800">
                                    {component.name}
                                  </p>

                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs text-gray-600">
                                      {formatPrice(
                                        component.price
                                      )}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        addRecommendedComponent(
                                          component
                                        )
                                      }
                                      disabled={
                                        stockReached
                                      }
                                      aria-label={`Agregar ${component.name} al kit`}
                                      className="rounded-full bg-[#52730E] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#405a0b] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {stockReached
                                        ? "Límite alcanzado"
                                        : "Agregar +"}
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
