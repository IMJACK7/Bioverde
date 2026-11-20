
import type {
  OrderCancellationRepository,
  OrderCancellationResult,
} from "../domain/order-cancellation.repository";

export class CancelOrderUseCase {
  constructor(
    private readonly repository: OrderCancellationRepository,
  ) {}

  async execute(orderId: string): Promise<OrderCancellationResult> {
    // Validar que el identificador tenga formato UUID.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(orderId)) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        message: "El identificador del pedido no es válido.",
      };
    }

    // Delegar la cancelación al repositorio.
    return this.repository.cancel(orderId);
  }
}
