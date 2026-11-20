
import type {
  OrderPaymentRepository,
  OrderPaymentResult,
} from "../domain/order-payment.repository";

/**
 * Caso de uso para registrar el pago
 * verificado de un pedido.
 *
 * El cambio de estado a PAID y los
 * descuentos de inventario son responsabilidad
 * del repositorio transaccional.
 */
export class RegisterOrderPaymentUseCase {
  constructor(
    private readonly repository: OrderPaymentRepository
  ) {}

  async execute(
    orderId: string
  ): Promise<OrderPaymentResult> {
    // Validar que el identificador sea un UUID.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      typeof orderId !== "string" ||
      !uuidRegex.test(orderId)
    ) {
      return {
        success: false,
        code: "INVALID_ORDER_DATA",
        message: "El identificador del pedido no es válido.",
      };
    }

    // Delegar el registro del pago al repositorio.
    return this.repository.registerPayment(orderId);
  }
}
