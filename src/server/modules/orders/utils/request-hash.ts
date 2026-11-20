
import { createHash } from "node:crypto";

import type {
  OrderItemInput,
} from "../domain/order.types";

import type {
  OrderCustomerData,
} from "../domain/order-registration.types";

/**
 * Calcula una huella SHA-256 de la solicitud.
 *
 * Utiliza los datos normalizados del cliente
 * y los artículos recibidos en el carrito.
 *
 * No depende de los precios actuales
 * ni del inventario de PostgreSQL.
 */
export function calculateRequestHash(
  customer: OrderCustomerData,
  items: OrderItemInput[]
): string {
  const canonicalRequest = {
    customer: {
      name: customer.name,
      phone: customer.phone,
      municipality: customer.municipality,
      deliveryAddress: customer.deliveryAddress,
      notes: customer.notes ?? "",
    },

    items: items.map((item) => ({
      type: item.type,
      productId: item.productId ?? null,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      components: (item.components ?? []).map(
        (component) => ({
          componentId: component.componentId,
          quantity: component.quantity,
        })
      ),
    })),
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalRequest))
    .digest("hex");
}
