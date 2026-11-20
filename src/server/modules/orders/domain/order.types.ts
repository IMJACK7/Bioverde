
/**
 * Tipos del módulo de pedidos de BioVerde.
 *
 * Los precios y existencias nunca se consideran
 * confiables cuando llegan desde el navegador.
 */

export type OrderItemType =
  | "PRODUCT"
  | "PREBUILT_KIT"
  | "CUSTOM_KIT";

/**
 * Componentes solicitados para un kit personalizado.
 *
 * El cliente solamente envía identificadores
 * y cantidades.
 */
export interface CustomKitComponentInput {
  componentId: string;
  quantity: number;
}

/**
 * Artículo recibido desde el carrito.
 *
 * No recibimos precios, nombres ni subtotales
 * como información confiable.
 */
export interface OrderItemInput {
  type: OrderItemType;

  productId?: string;
  variantId?: string;

  quantity: number;

  components?: CustomKitComponentInput[];
}

/**
 * Datos del cliente para coordinar el pedido
 * mediante WhatsApp.
 */
export interface OrderCustomerInput {
  name: string;
  phone: string;
  municipality: string;
  deliveryAddress: string;
  notes?: string;
}


/**
 * Solicitud de pedido recibida por el servidor.
 *
 * idempotencyKey identifica una operación de compra.
 * Los reintentos de esa misma operación deben
 * reutilizar exactamente la misma clave.
 */
export interface CreateOrderInput {
  idempotencyKey: string;
  customer: OrderCustomerInput;
  items: OrderItemInput[];
}


/**
 * Componente validado contra PostgreSQL.
 */
export interface ValidatedOrderComponent {
  componentId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Artículo validado por el servidor.
 */
export interface ValidatedOrderItem {
  type: OrderItemType;

  productId?: string;
  variantId?: string;

  name: string;
  variantName?: string;

  quantity: number;

  unitPrice: number;
  subtotal: number;

  components: ValidatedOrderComponent[];
}

/**
 * Resultado de la validación del carrito.
 */
export interface ValidatedOrder {
  items: ValidatedOrderItem[];

  subtotal: number;
  totalItems: number;
}

/**
 * Error de validación que podrá mostrarse
 * al cliente antes de confirmar el pedido.
 */
export interface OrderValidationError {
  code:
    | "EMPTY_CART"
    | "INVALID_QUANTITY"
    | "INVALID_PRODUCT"
    | "INVALID_VARIANT"
    | "INVALID_COMPONENT"
    | "INSUFFICIENT_STOCK"
    | "INVALID_CUSTOMER"
    | "INVALID_ORDER";

  message: string;
}

/**
 * Resultado de una operación de validación.
 */
export type OrderValidationResult =
  | {
      success: true;
      data: ValidatedOrder;
    }
  | {
      success: false;
      errors: OrderValidationError[];
    };
