
import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Pedido confirmado correctamente.
 */
export interface ConfirmedOrder {
  id: string;
  status: OrderStatus;
  confirmedAt: Date;
}

/**
 * Motivos por los que puede fallar
 * una confirmación administrativa.
 */
export type OrderConfirmationErrorCode =
  | "ORDER_NOT_FOUND"
  | "INVALID_ORDER_STATUS"
  | "INSUFFICIENT_STOCK"
  | "INVENTORY_ITEM_NOT_FOUND"
  | "INVALID_ORDER_DATA";

/**
 * Resultado de confirmar un pedido.
 */
export type OrderConfirmationResult =
  | {
      success: true;
      order: ConfirmedOrder;
    }
  | {
      success: false;
      code: OrderConfirmationErrorCode;
      message: string;
    };

/**
 * Contrato del repositorio.
 *
 * La implementación debe garantizar:
 *
 * 1. Confirmar únicamente pedidos PENDING.
 * 2. Validar la existencia del inventario.
 * 3. Acumular correctamente las cantidades.
 * 4. Descontar existencias sin permitir
 *    inventarios negativos.
 * 5. Actualizar el pedido a CONFIRMED.
 * 6. Registrar confirmedAt.
 *
 * Los descuentos y la actualización del
 * estado deben ser una operación atómica.
 */
export interface OrderConfirmationRepository {
  confirm(
    orderId: string
  ): Promise<OrderConfirmationResult>;
}
