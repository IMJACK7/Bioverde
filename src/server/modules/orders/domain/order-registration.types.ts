
import type { OrderStatus } from "@/generated/prisma/enums";

import type { ValidatedOrder } from "./order.types";

export interface OrderCustomerData {
  name: string;
  phone: string;
  municipality: string;
  deliveryAddress: string;
  notes?: string;
}

export interface OrderRegistrationData {
  customer: OrderCustomerData;
  order: ValidatedOrder;
  idempotencyKey: string;
  requestHash: string;
}

export interface RegisteredOrderItemComponent {
  name: string;
  quantity: number;
}

export interface RegisteredOrderItem {
  name: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  components: RegisteredOrderItemComponent[];
}

export interface RegisteredOrder {
  id: string;
  status: OrderStatus;
  subtotal: number;
  totalItems: number;
  createdAt: Date;
  items: RegisteredOrderItem[];
}

/**
 * Pedido previamente registrado con
 * una clave de idempotencia.
 */
export interface ExistingOrder {
  requestHash: string | null;
  order: RegisteredOrder;
}

/**
 * Resultado de una operación de registro.
 *
 * reused = false:
 *   Prisma creó un pedido nuevo.
 *
 * reused = true:
 *   Prisma recuperó un pedido existente.
 */
export interface OrderRegistrationResult {
  order: RegisteredOrder;
  reused: boolean;
}

/**
 * Contrato del repositorio de pedidos.
 */
export interface OrderRegistrationRepository {
  findByIdempotencyKey(
    key: string
  ): Promise<ExistingOrder | null>;

  create(
    data: OrderRegistrationData
  ): Promise<OrderRegistrationResult>;
}

/**
 * Conflicto al reutilizar una clave
 * con información diferente.
 */
export class OrderIdempotencyConflictError extends Error {
  constructor() {
    super(
      "Esta clave ya fue utilizada para un pedido diferente."
    );

    this.name = "OrderIdempotencyConflictError";
  }
}
