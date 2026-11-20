
import type {
  OrderValidationRepository,
} from "../domain/order-validation.repository";

import type {
  OrderItemInput,
  OrderValidationError,
  ValidatedOrderComponent,
  ValidatedOrderItem,
} from "../domain/order.types";

import {
  MAX_COMPONENT_QUANTITY,
  createOrderValidationError,
  isPositiveInteger,
  isValidId,
  roundMoney,
} from "../utils/order-validation.helpers";


type CustomKitInput = OrderItemInput & {
  type: "CUSTOM_KIT";
};


type CustomKitValidationResult =
  | {
      success: true;
      item: ValidatedOrderItem;
      componentDemand: Map<string, number>;
    }
  | {
      success: false;
      errors: OrderValidationError[];
    };

/**
 * Valida un kit personalizado consultando
 * los componentes reales del catálogo.
 *
 * No modifica inventario ni registra pedidos.
 */

export async function validateCustomKit(
  item: OrderItemInput,
  repository: OrderValidationRepository
): Promise<CustomKitValidationResult> {

  if (item.type !== "CUSTOM_KIT") {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_ORDER",
          "El artículo no es un kit personalizado."
        ),
      ],
    };
  }

  const errors: OrderValidationError[] = [];

  if (
    !Array.isArray(item.components) ||
    item.components.length === 0
  ) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_COMPONENT",
          "El kit personalizado debe incluir componentes."
        ),
      ],
    };
  }

  const validatedComponents: ValidatedOrderComponent[] = [];
  const seenComponents = new Set<string>();

  let kitPrice = 0;

  for (const requested of item.components) {
    if (
      !requested ||
      !isValidId(requested.componentId) ||
      !isPositiveInteger(
        requested.quantity,
        MAX_COMPONENT_QUANTITY
      ) ||
      seenComponents.has(requested.componentId)
    ) {
      errors.push(
        createOrderValidationError(
          "INVALID_COMPONENT",
          "El kit contiene componentes duplicados o inválidos."
        )
      );
      continue;
    }

    seenComponents.add(requested.componentId);

    const component =
      await repository.findComponentById(
        requested.componentId
      );

    if (!component || !component.isActive) {
      errors.push(
        createOrderValidationError(
          "INVALID_COMPONENT",
          "Uno de los componentes seleccionados ya no está disponible."
        )
      );
      continue;
    }

    const requiredQuantity =
      requested.quantity * item.quantity;

    if (!Number.isSafeInteger(requiredQuantity)) {
      errors.push(
        createOrderValidationError(
          "INVALID_QUANTITY",
          "La cantidad de componentes solicitada es inválida."
        )
      );
      continue;
    }

    kitPrice += component.price * requested.quantity;

    validatedComponents.push({
      componentId: component.id,
      name: component.name,
      quantity: requested.quantity,
      unitPrice: component.price,
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const componentDemand = new Map<string, number>();

  for (const component of validatedComponents) {
    componentDemand.set(
      component.componentId,
      component.quantity * item.quantity
    );
  }

  return {
    success: true,
    item: {
      type: "CUSTOM_KIT",
      name: "Kit personalizado BioVerde",
      quantity: item.quantity,
      unitPrice: roundMoney(kitPrice),
      subtotal: roundMoney(kitPrice * item.quantity),
      components: validatedComponents,
    },
    componentDemand,
  };
}
