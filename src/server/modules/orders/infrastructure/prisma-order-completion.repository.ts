
import "server-only";

import { prisma } from "@/server/db/prisma";

import type {
  OrderCompletionRepository,
  OrderCompletionResult,
} from "../domain/order-completion.repository";

/**
 * Completa un pedido pagado sin modificar
 * las existencias del inventario.
 */
export class PrismaOrderCompletionRepository
  implements OrderCompletionRepository
{
  async complete(
    orderId: string
  ): Promise<OrderCompletionResult> {
    // Actualización condicional y atómica.
    // Solo permite PAID -> COMPLETED.
    const updated = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "PAID",
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Si no se actualizó ningún registro,
    // determinar la causa.
    if (updated.count !== 1) {
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      });

      return {
        success: false,
        code: existing
          ? "INVALID_ORDER_STATUS"
          : "ORDER_NOT_FOUND",
        message: existing
          ? "Solo se pueden completar pedidos pagados."
          : "El pedido no existe.",
      };
    }

    // Recuperar el pedido actualizado.
    const completed = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        completedAt: true,
      },
    });

    if (!completed.completedAt) {
      throw new Error(
        "El pedido se actualizó sin fecha de finalización."
      );
    }

    return {
      success: true,
      order: {
        id: completed.id,
        status: completed.status,
        completedAt: completed.completedAt,
      },
    };
  }
}
