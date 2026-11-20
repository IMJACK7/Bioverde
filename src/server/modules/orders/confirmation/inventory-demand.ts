
import type { OrderItemType } from "@/generated/prisma/enums";

import { OrderConfirmationError } from
  "../domain/order-confirmation.errors";

/**
 * Información necesaria de un componente
 * registrado en un pedido.
 */
export interface InventoryOrderComponent {
  componentId: string | null;
  quantity: number;
}

/**
 * Información necesaria de un artículo
 * registrado en un pedido.
 */
export interface InventoryOrderItem {
  type: OrderItemType;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  components: InventoryOrderComponent[];
}

/**
 * Demanda total agrupada por tipo
 * de inventario.
 */
export interface InventoryDemand {
  products: Map<string, number>;
  variants: Map<string, number>;
  components: Map<string, number>;
}

/**
 * Acumula cantidades y evita
 * valores inválidos o desbordamientos.
 */
function addDemand(
  demand: Map<string, number>,
  id: string,
  quantity: number
): void {
  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    throw new OrderConfirmationError(
      "INVALID_ORDER_DATA",
      "El pedido contiene cantidades inválidas."
    );
  }

  const total = (demand.get(id) ?? 0) + quantity;

  if (!Number.isSafeInteger(total)) {
    throw new OrderConfirmationError(
      "INVALID_ORDER_DATA",
      "La cantidad solicitada supera el límite permitido."
    );
  }

  demand.set(id, total);
}

/**
 * Calcula la demanda total de inventario
 * de los artículos de un pedido.
 *
 * No consulta ni modifica la base de datos.
 */
export function calculateInventoryDemand(
  items: InventoryOrderItem[]
): InventoryDemand {
  if (items.length === 0) {
    throw new OrderConfirmationError(
      "INVALID_ORDER_DATA",
      "El pedido no contiene artículos."
    );
  }

  const demand: InventoryDemand = {
    products: new Map(),
    variants: new Map(),
    components: new Map(),
  };

  for (const item of items) {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new OrderConfirmationError(
        "INVALID_ORDER_DATA",
        "El pedido contiene cantidades inválidas."
      );
    }

    if (item.type === "CUSTOM_KIT") {
      if (item.components.length === 0) {
        throw new OrderConfirmationError(
          "INVALID_ORDER_DATA",
          "Un kit personalizado no tiene componentes."
        );
      }

      for (const component of item.components) {
        if (!component.componentId) {
          throw new OrderConfirmationError(
            "INVENTORY_ITEM_NOT_FOUND",
            "Un componente del pedido ya no está disponible."
          );
        }

        const quantity =
          component.quantity * item.quantity;

        addDemand(
          demand.components,
          component.componentId,
          quantity
        );
      }

      continue;
    }

    if (!item.productId) {
      throw new OrderConfirmationError(
        "INVENTORY_ITEM_NOT_FOUND",
        "Un producto del pedido ya no está disponible."
      );
    }

    if (item.variantId) {
      addDemand(
        demand.variants,
        item.variantId,
        item.quantity
      );

      continue;
    }

    if (item.type === "PRODUCT") {
      addDemand(
        demand.products,
        item.productId,
        item.quantity
      );

      continue;
    }

    throw new OrderConfirmationError(
      "INVALID_ORDER_DATA",
      "Un kit prearmado no tiene una variante válida."
    );
  }

  return demand;
}
