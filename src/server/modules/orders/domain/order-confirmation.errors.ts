
import type {
  OrderConfirmationErrorCode,
} from "./order-confirmation.repository";

/**
 * Error de negocio durante la confirmación.
 *
 * Permite identificar fallos controlados
 * y diferenciarlos de errores inesperados.
 */
export class OrderConfirmationError extends Error {
  constructor(
    public readonly code: OrderConfirmationErrorCode,
    message: string
  ) {
    super(message);

    this.name = "OrderConfirmationError";
  }
}

