
import type { OrderStatus } from "@/generated/prisma/enums";

export interface CancelledOrder {
  id: string;
  status: OrderStatus;
  cancelledAt: Date;
}

export type OrderCancellationErrorCode =
  | "ORDER_NOT_FOUND"
  | "INVALID_ORDER_STATUS";

export type OrderCancellationResult =
  | {
      success: true;
      order: CancelledOrder;
    }
  | {
      success: false;
      code: OrderCancellationErrorCode;
      message: string;
    };

export interface OrderCancellationRepository {
  cancel(orderId: string): Promise<OrderCancellationResult>;
}
