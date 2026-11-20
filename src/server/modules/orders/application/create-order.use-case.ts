
import type {
  CreateOrderInput,
  OrderValidationError,
} from "../domain/order.types";

import type {
  OrderRegistrationRepository,
  RegisteredOrder,
} from "../domain/order-registration.types";

import { OrderIdempotencyConflictError } from "../domain/order-registration.types";

import { ValidateOrderUseCase } from "./validate-order.use-case";

import { validateCustomer } from "../validation/customer.validation";
import { validateCartStructure } from "../validation/cart-structure.validation";
import { isValidIdempotencyKey } from "../validation/idempotency-key.validation";

import { calculateRequestHash } from "../utils/request-hash";



export type CreateOrderResult =
  | {
      success: true;
      data: RegisteredOrder;
      /**
       * Indica si el pedido ya existía.
       * false: pedido recién creado.
       * true: pedido recuperado.
       */
      reused: boolean;
    }
  | {
      success: false;
      errors: OrderValidationError[];
      statusCode?: 409;
    };

function orderError(
  message: string
): OrderValidationError {
  return {
    code: "INVALID_ORDER",
    message,
  };
}

/**
 * Coordina la creación y recuperación de pedidos.
 *
 * Los pedidos nuevos se registran como PENDING.
 * No se reserva ni descuenta inventario.
 */
export class CreateOrderUseCase {
  constructor(
    private readonly validator: ValidateOrderUseCase,
    private readonly registrationRepository: OrderRegistrationRepository
  ) {}

  async execute(
    input: CreateOrderInput
  ): Promise<CreateOrderResult> {
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return {
        success: false,
        errors: [
          orderError(
            "Los datos del pedido son inválidos."
          ),
        ],
      };
    }

    // 1. Validar la clave de idempotencia.
    if (
      !isValidIdempotencyKey(
        input.idempotencyKey
      )
    ) {
      return {
        success: false,
        errors: [
          orderError(
            "La clave de identificación del pedido es inválida."
          ),
        ],
      };
    }

    // 2. Validar los datos del cliente.
    const customerResult = validateCustomer(
      input.customer
    );

    if (!customerResult.success) {
      return customerResult;
    }
    
    // 3. Comprobar la estructura del carrito.
    const cartStructureResult = validateCartStructure(
      input.items
    );

    if (!cartStructureResult.success) {
      return cartStructureResult;
    }


    // 4. Calcular la huella de la solicitud.
    const requestHash = calculateRequestHash(
      customerResult.data,
      input.items
    );

    // 5. Buscar un pedido con la misma clave.
    const existingOrder =
      await this.registrationRepository.findByIdempotencyKey(
        input.idempotencyKey
      );

    if (existingOrder) {
      if (
        existingOrder.requestHash === requestHash
      ) {
        return {
          success: true,
          data: existingOrder.order,
          reused: true,
        };
      }

      return {
        success: false,
        statusCode: 409,
        errors: [
          orderError(
            "Esta clave ya fue utilizada para un pedido diferente."
          ),
        ],
      };
    }

    // 6. Validar los artículos del carrito.
    const orderResult =
      await this.validator.execute(input.items);

    if (!orderResult.success) {
      return orderResult;
    }

    // 7. Registrar el pedido pendiente.
    try {
     
        const registrationResult =
          await this.registrationRepository.create({
            idempotencyKey: input.idempotencyKey,
            requestHash,
            customer: customerResult.data,
            order: orderResult.data,
          });

        return {
          success: true,
          data: registrationResult.order,
          reused: registrationResult.reused,
        };

    } catch (error) {
      // Misma clave con contenido diferente
      // durante una solicitud simultánea.
      if (
        error instanceof OrderIdempotencyConflictError
      ) {
        return {
          success: false,
          statusCode: 409,
          errors: [
            orderError(error.message),
          ],
        };
      }

      // No ocultar errores inesperados.
      throw error;
    }
  }
}
