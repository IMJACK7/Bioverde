import type {
  OrderValidationRepository,
} from "../domain/order-validation.repository";

import type {
  OrderValidationError,
} from "../domain/order.types";

import {
  createOrderValidationError,
} from "../utils/order-validation.helpers";

export interface StockValidationInput {
  productDemand: Map<string, number>;
  productStocks: Map<string, number>;
  componentDemand: Map<string, number>;
}

export type StockValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      errors: OrderValidationError[];
    };

/**
 * Valida las existencias acumuladas del pedido.
 *
 * Los componentes vinculados a una variante
 * comercial comparten su inventario.
 *
 * Los componentes independientes utilizan
 * sus propias existencias.
 *
 * No modifica inventario.
 */
export async function validateStock(
  input: StockValidationInput,
  repository: OrderValidationRepository
): Promise<StockValidationResult> {
  const errors: OrderValidationError[] = [];

  // Copiar las demandas y existencias del catálogo.
  const combinedDemand = new Map(input.productDemand);
  const combinedStocks = new Map(input.productStocks);

  // Demanda de componentes con inventario independiente.
  const independentComponents = new Map<
    string,
    {
      name: string;
      required: number;
      stock: number;
    }
  >();

  // Procesar los componentes de kits personalizados.
  for (const [componentId, required] of input.componentDemand) {
    const component = await repository.findComponentById(
      componentId
    );

    if (!component || !component.isActive) {
      errors.push(
        createOrderValidationError(
          "INVALID_COMPONENT",
          "Uno de los componentes ya no está disponible."
        )
      );

      continue;
    }

    // Componente vinculado a una variante comercial.
    if (component.productVariantId) {
      const inventoryKey =
        `variant:${component.productVariantId}`;

      const previousDemand =
        combinedDemand.get(inventoryKey) ?? 0;

      const totalDemand = previousDemand + required;

      if (!Number.isSafeInteger(totalDemand)) {
        errors.push(
          createOrderValidationError(
            "INVALID_QUANTITY",
            "La cantidad solicitada supera el límite permitido."
          )
        );

        continue;
      }

      combinedDemand.set(inventoryKey, totalDemand);

      // La variante puede no haberse comprado
      // individualmente en este pedido.
      if (!combinedStocks.has(inventoryKey)) {
        combinedStocks.set(inventoryKey, component.stock);
      }

      continue;
    }

    // Componente con inventario independiente.
    independentComponents.set(componentId, {
      name: component.name,
      required,
      stock: component.stock,
    });
  }

  // Validar la demanda total de productos y variantes.
  for (const [inventoryKey, required] of combinedDemand) {
    const available = combinedStocks.get(inventoryKey) ?? 0;

    if (required > available) {
      errors.push(
        createOrderValidationError(
          "INSUFFICIENT_STOCK",
          `No hay suficientes existencias para el artículo ${inventoryKey}.`
        )
      );
    }
  }

  // Validar los componentes independientes.
  for (const component of independentComponents.values()) {
    if (component.required > component.stock) {
      errors.push(
        createOrderValidationError(
          "INSUFFICIENT_STOCK",
          `No hay suficientes existencias del componente "${component.name}".`
        )
      );
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
  };
}