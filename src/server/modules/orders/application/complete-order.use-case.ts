
import type {
  OrderCompletionRepository,
  OrderCompletionResult,
} from "../domain/order-completion.repository";

/**
 * Valida y ejecuta la finalización de un pedido.
 */
export class CompleteOrderUseCase {
  constructor(
    private readonly repository: OrderCompletionRepository
  ) {}

  async execute(
    orderId: string
  ): Promise<OrderCompletionResult> {
    // Validar que el identificador sea un UUID.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(orderId)) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "El identificador del pedido no es válido.",
      };
    }

    // Delegar la operación al repositorio.
    return this.repository.complete(orderId);
  }
}
    