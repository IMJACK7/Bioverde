
import type {
  ValidatedOrder,
} from "./order.types";

/**
 * Datos del cliente previamente normalizados.
 */
export interface OrderCustomerData {
  name: string;
  phone: string;
  municipality: string;
  deliveryAddress: string;
  notes?: string;
}

/**
 * Información necesaria para registrar un pedido.
 *
 * Los artículos y precios provienen de la
 * validación realizada en el servidor.
 */
export interface OrderRegistrationData {
  customer: OrderCustomerData;
  order: ValidatedOrder;
}

/**
 * Resultado de un pedido registrado.
 */
export interface RegisteredOrder {
  id: string;
  status: "PENDING";
  subtotal: number;
  totalItems: number;
  createdAt: Date;
}

/**
 * Contrato para persistir pedidos.
 */
export interface OrderRegistrationRepository {
  create(
    data: OrderRegistrationData
  ): Promise<RegisteredOrder>;
}
