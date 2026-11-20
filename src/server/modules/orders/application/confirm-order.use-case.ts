
import type {
  OrderConfirmationRepository,
  OrderConfirmationResult,
} from "../domain/order-confirmation.repository";

/**
 * Caso de uso para confirmar pedidos.
 *
 * La confirmación y los descuentos de
 * inventario son responsabilidad del
 * repositorio transaccional.
 */
export class ConfirmOrderUseCase {
  constructor(
    private readonly repository: OrderConfirmationRepository
  ) {}

  async execute(
    orderId: string
  ): Promise<OrderConfirmationResult> {
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

    // Delegar la operación al repositorio.
    return this.repository.confirm(orderId);
  }
}
