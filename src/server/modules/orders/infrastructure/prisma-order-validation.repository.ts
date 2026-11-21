import "server-only";

import { prisma } from "@/server/db/prisma";

import type {
  OrderValidationRepository,
  OrderProductRecord,
  OrderVariantRecord,
  OrderComponentRecord,
} from "../domain/order-validation.repository";

/**
 * Implementación de consultas de validación
 * mediante Prisma y PostgreSQL.
 */
export class PrismaOrderValidationRepository
  implements OrderValidationRepository
{
  /**
   * Consultar un producto por su identificador.
   */
  async findProductById(
    productId: string
  ): Promise<OrderProductRecord | null> {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        variants: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      type: product.type,
      price: Number(product.price),
      stock: product.stock,
      isActive: product.isActive,
      hasVariants: product.variants.length > 0,
    };
  }

  /**
   * Consultar una variante y su receta.
   *
   * Los kits prediseñados conservan
   * su inventario independiente.
   */
  async findVariantById(
    variantId: string
  ): Promise<OrderVariantRecord | null> {
    const variant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },
      include: {
        recipeItems: true,
      },
    });

    if (!variant) {
      return null;
    }

    return {
      id: variant.id,
      productId: variant.productId,
      name: variant.name,
      price: Number(variant.price),
      stock: variant.stock,
      isActive: variant.isActive,
      recipeComponents: variant.recipeItems.map((item) => ({
        componentId: item.componentId,
        quantity: item.quantity,
      })),
    };
  }

  /**
   * Consultar un componente del inventario.
   *
   * Si está vinculado a una variante comercial,
   * utiliza el stock de esa variante.
   *
   * Si no está vinculado, utiliza su propio stock.
   */
  async findComponentById(
    componentId: string
  ): Promise<OrderComponentRecord | null> {
    const component = await prisma.kitComponent.findUnique({
      where: {
        id: componentId,
      },
      include: {
        productVariant: {
          include: {
            product: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!component) {
      return null;
    }

    const linkedVariant = component.productVariant;

    const effectiveStock = linkedVariant
      ? linkedVariant.stock
      : component.stock;

    const effectiveIsActive = linkedVariant
      ? component.isActive &&
        linkedVariant.isActive &&
        linkedVariant.product.isActive
      : component.isActive;

        return {
      id: component.id,
      name: component.name,
      price: Number(component.price),
      stock: effectiveStock,
      isActive: effectiveIsActive,
      productVariantId: component.productVariantId,
    };
  }
}