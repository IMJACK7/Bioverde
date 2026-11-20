
import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Información del pedido después de marcarlo
 * como entregado.
 */
export interface CompletedOrder {
  id: string;
  status: OrderStatus;
  completedAt: Date;
}

/**
 * Errores posibles al completar un pedido.
 */
export type OrderCompletionErrorCode =
  | "ORDER_NOT_FOUND"
  | "INVALID_ORDER_STATUS";

/**
 * Resultado de la operación.
 */
export type OrderCompletionResult =
  | {
      success: true;
      order: CompletedOrder;
    }
  | {
      success: false;
      code: OrderCompletionErrorCode;
      message: string;
    };

/**
 * Contrato para completar pedidos.
 */
export interface OrderCompletionRepository {
  complete(orderId: string): Promise<OrderCompletionResult>;
}
