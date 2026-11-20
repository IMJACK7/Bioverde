
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
 * Comprueba las existencias necesarias
 * para todos los artículos del carrito.
 *
 * No descuenta inventario.
 * No registra pedidos.
 */
export async function validateStock(
  input: StockValidationInput,
  repository: OrderValidationRepository
): Promise<StockValidationResult> {
  const errors: OrderValidationError[] = [];

  // Verificar productos y variantes.
  for (const [key, required] of input.productDemand) {
    const available = input.productStocks.get(key) ?? 0;

    if (required > available) {
      errors.push(
        createOrderValidationError(
          "INSUFFICIENT_STOCK",
          `Las existencias del artículo ${key} no son suficientes.`
        )
      );
    }
  }

  // Verificar componentes de kits personalizados.
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

    if (required > component.stock) {
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
