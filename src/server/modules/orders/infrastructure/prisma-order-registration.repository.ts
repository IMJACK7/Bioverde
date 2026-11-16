
import "server-only";

import { prisma } from "@/server/db/prisma";

import type {
  OrderRegistrationData,
  OrderRegistrationRepository,
  RegisteredOrder,
} from "../domain/order-registration.types";

/**
 * Registra pedidos en PostgreSQL mediante Prisma.
 *
 * El pedido, sus artículos y sus componentes
 * se guardan en una misma transacción.
 *
 * Los pedidos PENDING no reservan ni descuentan
 * existencias del inventario.
 */
export class PrismaOrderRegistrationRepository
  implements OrderRegistrationRepository
{
  async create(
    data: OrderRegistrationData
  ): Promise<RegisteredOrder> {
    const createdOrder = await prisma.$transaction(
      async (tx) => {
        return tx.order.create({
          data: {
            customerName: data.customer.name,
            customerPhone: data.customer.phone,
            municipality: data.customer.municipality,
            deliveryAddress: data.customer.deliveryAddress,
            notes: data.customer.notes ?? null,
            subtotal: data.order.subtotal,
            status: "PENDING",

            items: {
              create: data.order.items.map((item) => ({
                productId: item.productId ?? null,
                variantId: item.variantId ?? null,
                type: item.type,
                name: item.name,
                variantName: item.variantName ?? null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,

                components: {
                  create: item.components.map(
                    (component) => ({
                      componentId: component.componentId,
                      name: component.name,
                      quantity: component.quantity,
                      unitPrice: component.unitPrice,
                    })
                  ),
                },
              })),
            },
          },

          select: {
            id: true,
            status: true,
            subtotal: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
              },
            },
          },
        });
      }
    );

    return {
      id: createdOrder.id,
      status: "PENDING",
      subtotal: Number(createdOrder.subtotal),
      totalItems: createdOrder.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      createdAt: createdOrder.createdAt,
    };
  }
}
