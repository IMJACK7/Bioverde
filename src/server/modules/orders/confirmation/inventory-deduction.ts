
import type { Prisma } from "@/generated/prisma/client";

import { OrderConfirmationError } from
  "../domain/order-confirmation.errors";

import type { InventoryDemand } from
  "./inventory-demand";

/**
 * Cliente de Prisma asociado a una
 * transacción interactiva.
 */
type TransactionClient = Prisma.TransactionClient;

/**
 * Ordena los identificadores para mantener
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
 * Descuenta las existencias necesarias
 * para confirmar un pedido.
 *
 * Todas las operaciones utilizan la misma
 * transacción recibida como argumento.
 */
export async function deductInventory(
  tx: TransactionClient,
  demand: InventoryDemand
): Promise<void> {
  // Productos sin variantes.
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
      throw new OrderConfirmationError(
        "INSUFFICIENT_STOCK",
        "Un producto no existe, está inactivo o no tiene suficientes existencias."
      );
    }
  }

  // Variantes y kits prearmados.
  for (const [id, quantity] of sortedEntries(
    demand.variants
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
      throw new OrderConfirmationError(
        "INSUFFICIENT_STOCK",
        "Una variante no existe, está inactiva o no tiene suficientes existencias."
      );
    }
  }

  // Componentes de kits personalizados.
  for (const [id, quantity] of sortedEntries(
    demand.components
  )) {
    const result = await tx.kitComponent.updateMany({
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
      throw new OrderConfirmationError(
        "INSUFFICIENT_STOCK",
        "Un componente no existe, está inactivo o no tiene suficientes existencias."
      );
    }
  }
}
