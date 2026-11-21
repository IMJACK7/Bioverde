
import type {
  OrderPaymentErrorCode,
} from "./order-payment.repository";

/**
 * Error de negocio durante el registro
 * de pagos y descuento de inventario.
 *
 * Permite diferenciar errores controlados
 * de fallos inesperados.
 */
export class OrderPaymentError extends Error {
  constructor(
    public readonly code: OrderPaymentErrorCode,
    message: string
  ) {
    super(message);

    this.name = "OrderPaymentError";
  }
}
