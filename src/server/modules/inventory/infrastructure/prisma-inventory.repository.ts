

import { prisma } from "@/server/db/prisma";

import type {
  AddInventoryInput,
  InventoryEntryResult,
  InventoryRepository,
} from "../domain/inventory.repository";

const MAX_STOCK = 2_147_483_647;

export class PrismaInventoryRepository
  implements InventoryRepository
{
  async addStock(
    input: AddInventoryInput
  ): Promise<InventoryEntryResult | null> {
    const { itemId, itemType, quantity } = input;

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > MAX_STOCK
    ) {
      throw new Error(
        "La cantidad debe ser un entero positivo válido."
      );
    }

    return prisma.$transaction(
      async (tx) => {
        let previousStock: number;

        switch (itemType) {
          case "PRODUCT": {
            const product = await tx.product.findFirst({
              where: {
                id: itemId,
                isActive: true,
                isArchived: false,
                type: {
                  not: "PREBUILT_KIT",
                },
                variants: {
                  none: {},
                },
              },
              select: {
                stock: true,
              },
            });

            if (!product) {
              return null;
            }

            previousStock = product.stock;

            const updated = await tx.product.updateMany({
              where: {
                id: itemId,
                isActive: true,
                isArchived: false,
                type: {
                  not: "PREBUILT_KIT",
                },
                variants: {
                  none: {},
                },
                stock: {
                  lte: MAX_STOCK - quantity,
                },
              },
              data: {
                stock: {
                  increment: quantity,
                },
              },
            });

            if (updated.count !== 1) {
              throw new Error(
                "No fue posible incrementar el inventario del producto."
              );
            }

            break;
          }

          case "VARIANT": {
            const variant =
              await tx.productVariant.findFirst({
                where: {
                  id: itemId,
                  isActive: true,
                  product: {
                    isActive: true,
                    isArchived: false,
                  },
                },
                select: {
                  stock: true,
                },
              });

            if (!variant) {
              return null;
            }

            previousStock = variant.stock;

            const updated =
              await tx.productVariant.updateMany({
                where: {
                  id: itemId,
                  isActive: true,
                  product: {
                    isActive: true,
                    isArchived: false,
                  },
                  stock: {
                    lte: MAX_STOCK - quantity,
                  },
                },
                data: {
                  stock: {
                    increment: quantity,
                  },
                },
              });

            if (updated.count !== 1) {
              throw new Error(
                "No fue posible incrementar el inventario de la variante."
              );
            }

            break;
          }

          case "COMPONENT": {
            const component =
              await tx.kitComponent.findFirst({
                where: {
                  id: itemId,
                  isActive: true,
                  productVariantId: null,
                },
                select: {
                  stock: true,
                },
              });

            if (!component) {
              return null;
            }

            previousStock = component.stock;

            const updated =
              await tx.kitComponent.updateMany({
                where: {
                  id: itemId,
                  isActive: true,
                  productVariantId: null,
                  stock: {
                    lte: MAX_STOCK - quantity,
                  },
                },
                data: {
                  stock: {
                    increment: quantity,
                  },
                },
              });

            if (updated.count !== 1) {
              throw new Error(
                "No fue posible incrementar el inventario del componente."
              );
            }

            break;
          }

          default:
            return null;
        }

       
let currentStock: number;

switch (itemType) {
  case "PRODUCT": {
    const product = await tx.product.findUnique({
      where: { id: itemId },
      select: { stock: true },
    });

    if (!product) {
      throw new Error(
        "No se pudo verificar el inventario del producto."
      );
    }

    currentStock = product.stock;
    break;
  }

  case "VARIANT": {
    const variant =
      await tx.productVariant.findUnique({
        where: { id: itemId },
        select: { stock: true },
      });

    if (!variant) {
      throw new Error(
        "No se pudo verificar el inventario de la variante."
      );
    }

    currentStock = variant.stock;
    break;
  }

  case "COMPONENT": {
    const component =
      await tx.kitComponent.findUnique({
        where: { id: itemId },
        select: { stock: true },
      });

    if (!component) {
      throw new Error(
        "No se pudo verificar el inventario del componente."
      );
    }

    currentStock = component.stock;
    break;
  }

  default:
    throw new Error(
      "Tipo de inventario no reconocido."
    );
}

if (currentStock !== previousStock + quantity) {
  throw new Error(
    "Las existencias resultantes no coinciden con la entrada registrada."
  );
}

return {
  itemId,
  itemType,
  previousStock,
  addedQuantity: quantity,
  currentStock,
};

      },
            {
        isolationLevel: "Serializable",
        }
    );
  }
}
