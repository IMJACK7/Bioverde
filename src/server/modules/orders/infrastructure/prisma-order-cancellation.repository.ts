
import "server-only";

import { prisma } from "@/server/db/prisma";

import type {
  OrderCancellationRepository,
  OrderCancellationResult,
} from "../domain/order-cancellation.repository";

export class PrismaOrderCancellationRepository
  implements OrderCancellationRepository
{
  async cancel(orderId: string): Promise<OrderCancellationResult> {
    // Solo permite cancelar pedidos pendientes.
    // updateMany aplica la condición y el cambio de forma atómica.
    const updated = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Si no se actualizó ningún pedido, identificamos el motivo.
    if (updated.count !== 1) {
      const existing = await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
        },
      });

      return {
        success: false,
        code: existing ? "INVALID_ORDER_STATUS" : "ORDER_NOT_FOUND",
        message: existing
          ? "Solo se pueden cancelar pedidos pendientes."
          : "El pedido no existe.",
      };
    }

    // Recuperar el pedido después de actualizarlo.
    const cancelled = await prisma.order.findUniqueOrThrow({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        cancelledAt: true,
      },
    });

    if (!cancelled.cancelledAt) {
      throw new Error(
        "El pedido se canceló sin registrar la fecha de cancelación.",
      );
    }

    return {
      success: true,
      order: {
        id: cancelled.id,
        status: cancelled.status,
        cancelledAt: cancelled.cancelledAt,
      },
    };
  }
}
