
import type {
  OrderItemInput,
  OrderValidationError,
} from "../domain/order.types";

type CartStructureResult =
  | { success: true }
  | {
      success: false;
      errors: OrderValidationError[];
    };

function cartError(message: string): CartStructureResult {
  return {
    success: false,
    errors: [
      {
        code: "INVALID_ORDER",
        message,
      },
    ],
  };
}

const VALID_ITEM_TYPES = new Set([
  "PRODUCT",
  "PREBUILT_KIT",
  "CUSTOM_KIT",
]);

export function validateCartStructure(
  items: unknown
): CartStructureResult {
  if (!Array.isArray(items)) {
    return cartError(
      "El carrito del pedido es inválido."
    );
  }

  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      return cartError(
        "El carrito contiene un artículo inválido."
      );
    }

    const candidate = item as Partial<
      Record<keyof OrderItemInput, unknown>
    >;

    if (
      !VALID_ITEM_TYPES.has(
        candidate.type as string
      ) ||
      !Number.isSafeInteger(candidate.quantity) ||
      (candidate.quantity as number) <= 0
    ) {
      return cartError(
        "El carrito contiene un tipo de artículo o una cantidad inválida."
      );
    }

    if (
      candidate.productId !== undefined &&
      (
        typeof candidate.productId !== "string" ||
        candidate.productId.trim().length === 0
      )
    ) {
      return cartError(
        "El identificador de un producto es inválido."
      );
    }

    if (
      candidate.variantId !== undefined &&
      (
        typeof candidate.variantId !== "string" ||
        candidate.variantId.trim().length === 0
      )
    ) {
      return cartError(
        "El identificador de una variante es inválido."
      );
    }

    if (
      candidate.components !== undefined &&
      !Array.isArray(candidate.components)
    ) {
      return cartError(
        "Los componentes del kit son inválidos."
      );
    }

    if (Array.isArray(candidate.components)) {
      for (const component of candidate.components) {
        if (
          !component ||
          typeof component !== "object" ||
          Array.isArray(component) ||
          typeof component.componentId !== "string" ||
          component.componentId.trim().length === 0 ||
          !Number.isSafeInteger(component.quantity) ||
          component.quantity <= 0
        ) {
          return cartError(
            "El kit contiene un componente inválido."
          );
        }
      }
    }
  }

  return { success: true };
}
