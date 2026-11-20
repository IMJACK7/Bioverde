
import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

import type {
  OrderPaymentRepository,
  OrderPaymentResult,
} from "../domain/order-payment.repository";

import { OrderConfirmationError } from
  "../domain/order-confirmation.errors";

import { calculateInventoryDemand } from
  "../confirmation/inventory-demand";

import { deductInventory } from
  "../confirmation/inventory-deduction";

const MAX_RETRIES = 3;

/**
 * Registra un pago verificado y descuenta
 * el inventario en una única transacción.
 */
export class PrismaOrderPaymentRepository
  implements OrderPaymentRepository
{
  async registerPayment(
    orderId: string
  ): Promise<OrderPaymentResult> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const order = await prisma.$transaction(
          async (tx) => {
            // Reclamar únicamente pedidos pendientes.
            const claimed = await tx.order.updateMany({
              where: {
                id: orderId,
                status: "PENDING",
              },
              data: {
                status: "PAID",
                paidAt: new Date(),
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
                  ? "Solo se puede registrar el pago de pedidos pendientes."
                  : "El pedido no existe."
              );
            }

            // Recuperar los artículos del pedido.
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

            // Verificar la relación producto-variante.
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

            // Calcular la demanda acumulada.
            const demand = calculateInventoryDemand(
              existingOrder.items
            );

            // Descontar inventario en la misma transacción.
            await deductInventory(tx, demand);

            // Recuperar el pedido pagado.
            const paid = await tx.order.findUniqueOrThrow({
              where: { id: orderId },
              select: {
                id: true,
                status: true,
                paidAt: true,
              },
            });

            if (!paid.paidAt) {
              throw new OrderConfirmationError(
                "INVALID_ORDER_DATA",
                "No se pudo registrar la fecha de pago."
              );
            }

            return {
              id: paid.id,
              status: paid.status,
              paidAt: paid.paidAt,
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

        // Reintentar conflictos de transacción.
        const isRetryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        if (isRetryable && attempt < MAX_RETRIES - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      "No fue posible completar el registro del pago."
    );
  }
}
