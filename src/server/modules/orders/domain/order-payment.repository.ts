
import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Pedido cuyo pago fue registrado correctamente.
 */
export interface PaidOrder {
  id: string;
  status: OrderStatus;
  paidAt: Date;
}

/**
 * Errores de negocio al registrar un pago.
 */
export type OrderPaymentErrorCode =
  | "ORDER_NOT_FOUND"
  | "INVALID_ORDER_STATUS"
  | "INSUFFICIENT_STOCK"
  | "INVENTORY_ITEM_NOT_FOUND"
  | "INVALID_ORDER_DATA";

/**
 * Resultado de registrar un pago.
 */
export type OrderPaymentResult =
  | {
      success: true;
      order: PaidOrder;
    }
  | {
      success: false;
      code: OrderPaymentErrorCode;
      message: string;
    };

/**
 * Contrato del repositorio de pagos.
 *
 * Debe garantizar:
 *
 * 1. Procesar únicamente pedidos PENDING.
 * 2. Validar las existencias.
 * 3. Acumular correctamente la demanda.
 * 4. Descontar inventario sin valores negativos.
 * 5. Cambiar el pedido a PAID.
 * 6. Registrar paidAt.
 *
 * Todo debe ejecutarse de manera atómica.
 */
export interface OrderPaymentRepository {
  registerPayment(
    orderId: string
  ): Promise<OrderPaymentResult>;
}
