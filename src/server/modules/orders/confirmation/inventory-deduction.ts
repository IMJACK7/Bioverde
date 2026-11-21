
import type { Prisma } from "@/generated/prisma/client";

import { OrderPaymentError } from
  "../domain/order-payment.errors";

import type { InventoryDemand } from
  "./inventory-demand";

type TransactionClient = Prisma.TransactionClient;

/**
 * Ordena identificadores para mantener
 * un orden consistente de actualización.
 */
function sortedEntries(
  demand: Map<string, number>
): [string, number][] {
  return [...demand.entries()].sort(
    ([a], [b]) => a.localeCompare(b)
  );
}

/**
 * Acumula demanda de forma segura.
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
    throw new OrderPaymentError(
      "INVENTORY_ITEM_NOT_FOUND",
      "El pedido contiene cantidades inválidas."
    );
  }

  const total = (demand.get(id) ?? 0) + quantity;

  if (!Number.isSafeInteger(total)) {
    throw new OrderPaymentError(
      "INVENTORY_ITEM_NOT_FOUND",
      "La cantidad solicitada supera el límite permitido."
    );
  }

  demand.set(id, total);
}

/**
 * Descuenta el inventario del pedido.
 *
 * Los componentes vinculados comparten
 * el stock de su variante comercial.
 *
 * Todo se ejecuta dentro de la
 * transacción recibida.
 */
export async function deductInventory(
  tx: TransactionClient,
  demand: InventoryDemand
): Promise<void> {
  // Copiamos los mapas para no modificar
  // el objeto original recibido.
  const variantDemand = new Map(demand.variants);
  const independentComponentDemand = new Map<
    string,
    number
  >();

  // -----------------------------------------
  // RESOLVER COMPONENTES COMPARTIDOS
  // -----------------------------------------

  for (const [componentId, quantity] of sortedEntries(
    demand.components
  )) {
    const component = await tx.kitComponent.findUnique({
      where: {
        id: componentId,
      },
      select: {
        id: true,
        isActive: true,
        productVariantId: true,
      },
    });

    if (!component || !component.isActive) {
      throw new OrderPaymentError(
        "INVENTORY_ITEM_NOT_FOUND",
        "Un componente del pedido ya no está disponible."
      );
    }

    if (component.productVariantId) {
      // El componente utiliza el inventario
      // de su variante comercial.
      addDemand(
        variantDemand,
        component.productVariantId,
        quantity
      );
    } else {
      // El componente mantiene su propio stock.
      addDemand(
        independentComponentDemand,
        component.id,
        quantity
      );
    }
  }

  // -----------------------------------------
  // PRODUCTOS SIN VARIANTES
  // -----------------------------------------

  for (const [id, quantity] of sortedEntries(
    demand.products
  )) {
    const result = await tx.product.updateMany({
      where: {
        id,
        isActive: true,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (result.count !== 1) {
      throw new OrderPaymentError(
        "INVENTORY_ITEM_NOT_FOUND",
        "Un producto no existe, está inactivo o no tiene suficientes existencias."
      );
    }
  }

  // -----------------------------------------
  // VARIANTES Y ABONOS COMPARTIDOS
  // -----------------------------------------

  for (const [id, quantity] of sortedEntries(
    variantDemand
  )) {
    const result = await tx.productVariant.updateMany({
      where: {
        id,
        isActive: true,
        product: {
          isActive: true,
        },
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (result.count !== 1) {
      throw new OrderPaymentError(
        "INVENTORY_ITEM_NOT_FOUND",
        "Una variante no existe, está inactiva o no tiene suficientes existencias."
      );
    }
  }

  // -----------------------------------------
  // COMPONENTES INDEPENDIENTES
  // -----------------------------------------

  for (const [id, quantity] of sortedEntries(
    independentComponentDemand
  )) {
    const result = await tx.kitComponent.updateMany({
      where: {
        id,
        isActive: true,
        productVariantId: null,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (result.count !== 1) {
      throw new OrderPaymentError(
        "INVENTORY_ITEM_NOT_FOUND",
        "Un componente no existe, está inactivo o no tiene suficientes existencias."
      );
    }
  }
}
