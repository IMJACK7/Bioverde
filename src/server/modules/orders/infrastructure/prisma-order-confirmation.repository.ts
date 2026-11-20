
import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

import type {
  OrderConfirmationRepository,
  OrderConfirmationResult,
} from "../domain/order-confirmation.repository";

import { OrderConfirmationError } from
  "../domain/order-confirmation.errors";

import { calculateInventoryDemand } from
  "../confirmation/inventory-demand";

import { deductInventory } from
  "../confirmation/inventory-deduction";

const MAX_RETRIES = 3;

/**
 * Confirma un pedido y descuenta su inventario
 * dentro de una única transacción.
 */
export class PrismaOrderConfirmationRepository
  implements OrderConfirmationRepository
{
  async confirm(
    orderId: string
  ): Promise<OrderConfirmationResult> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const order = await prisma.$transaction(
          async (tx) => {
            // Reclamar el pedido solo si está pendiente.
            const claimed = await tx.order.updateMany({
              where: {
                id: orderId,
                status: "PENDING",
              },
              data: {
                status: "CONFIRMED",
                confirmedAt: new Date(),
              },
            });

            if (claimed.count !== 1) {
              const existing = await tx.order.findUnique({
                where: { id: orderId },
                select: { id: true },
              });

              throw new OrderConfirmationError(
                existing
                  ? "INVALID_ORDER_STATUS"
                  : "ORDER_NOT_FOUND",
                existing
                  ? "Solo se pueden confirmar pedidos pendientes."
                  : "El pedido no existe."
              );
            }

            // Recuperar los artículos registrados.
            const existingOrder = await tx.order.findUnique({
              where: { id: orderId },
              include: {
                items: {
                  include: {
                    components: true,
                  },
                },
              },
            });

            if (!existingOrder) {
              throw new OrderConfirmationError(
                "ORDER_NOT_FOUND",
                "El pedido no existe."
              );
            }

            // Comprobar que cada variante corresponda
            // al producto original del pedido.
            for (const item of existingOrder.items) {
              if (!item.variantId) {
                continue;
              }

              if (!item.productId) {
                throw new OrderConfirmationError(
                  "INVALID_ORDER_DATA",
                  "Una variante no tiene un producto asociado."
                );
              }

              const variant = await tx.productVariant.findFirst({
                where: {
                  id: item.variantId,
                  productId: item.productId,
                },
                select: { id: true },
              });

              if (!variant) {
                throw new OrderConfirmationError(
                  "INVENTORY_ITEM_NOT_FOUND",
                  "Una variante ya no corresponde al producto registrado."
                );
              }
            }

            // Calcular demanda acumulada.
            const demand = calculateInventoryDemand(
              existingOrder.items
            );

            // Descontar inventario dentro
            // de esta misma transacción.
            await deductInventory(tx, demand);

            // Recuperar el estado confirmado.
            const confirmed = await tx.order.findUniqueOrThrow({
              where: { id: orderId },
              select: {
                id: true,
                status: true,
                confirmedAt: true,
              },
            });

            if (!confirmed.confirmedAt) {
              throw new OrderConfirmationError(
                "INVALID_ORDER_DATA",
                "No se pudo registrar la fecha de confirmación."
              );
            }

            return {
              id: confirmed.id,
              status: confirmed.status,
              confirmedAt: confirmed.confirmedAt,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
          }
        );

        return {
          success: true,
          order,
        };
      } catch (error) {
        // Errores de negocio: no reintentar.
        if (error instanceof OrderConfirmationError) {
          return {
            success: false,
            code: error.code,
            message: error.message,
          };
        }

        // P2034: conflicto de transacción o deadlock.
        const isRetryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        if (isRetryable && attempt < MAX_RETRIES - 1) {
          continue;
        }

        // Otros errores se propagan.
        throw error;
      }
    }

    throw new Error(
      "No fue posible completar la confirmación."
    );
  }
}
