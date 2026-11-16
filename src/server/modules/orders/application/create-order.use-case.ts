
import type {
  CreateOrderInput,
  OrderCustomerInput,
  OrderValidationError,
} from "../domain/order.types";

import type {
  OrderCustomerData,
  OrderRegistrationRepository,
  RegisteredOrder,
} from "../domain/order-registration.types";

import { ValidateOrderUseCase } from "./validate-order.use-case";

export type CreateOrderResult =
  | {
      success: true;
      data: RegisteredOrder;
    }
  | {
      success: false;
      errors: OrderValidationError[];
    };

function validationError(
  message: string
): OrderValidationError {
  return {
    code: "INVALID_CUSTOMER",
    message,
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ")
    : "";
}

/**
 * Comprueba los datos necesarios para
 * coordinar un pedido de BioVerde.
 */
function validateCustomer(
  input: unknown
):
  | { success: true; data: OrderCustomerData }
  | { success: false; errors: OrderValidationError[] } {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return {
      success: false,
      errors: [
        validationError(
          "Debes proporcionar los datos del cliente."
        ),
      ],
    };
  }

  const customer = input as Partial<
    Record<keyof OrderCustomerInput, unknown>
  >;

  const name = normalizeText(customer.name);
  const phone = normalizeText(customer.phone);
  const municipality = normalizeText(
    customer.municipality
  );
  const deliveryAddress = normalizeText(
    customer.deliveryAddress
  );

  const notes = normalizeText(customer.notes);

  const errors: OrderValidationError[] = [];

  if (name.length < 3 || name.length > 120) {
    errors.push(
      validationError(
        "El nombre debe tener entre 3 y 120 caracteres."
      )
    );
  }

  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
    errors.push(
      validationError(
        "Ingresa un número de teléfono válido."
      )
    );
  }

  if (
    municipality.length < 2 ||
    municipality.length > 100
  ) {
    errors.push(
      validationError(
        "El municipio debe tener entre 2 y 100 caracteres."
      )
    );
  }

  if (
    deliveryAddress.length < 5 ||
    deliveryAddress.length > 200
  ) {
    errors.push(
      validationError(
        "La dirección debe tener entre 5 y 200 caracteres."
      )
    );
  }

  if (notes.length > 500) {
    errors.push(
      validationError(
        "Las observaciones no pueden superar 500 caracteres."
      )
    );
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      name,
      phone,
      municipality,
      deliveryAddress,
      ...(notes ? { notes } : {}),
    },
  };
}

/**
 * Coordina la creación de pedidos.
 *
 * El pedido se registra como PENDING.
 * No se descuenta ni reserva inventario.
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
          {
            code: "INVALID_ORDER",
            message: "Los datos del pedido son inválidos.",
          },
        ],
      };
    }

    // 1. Validar los datos del cliente.
    const customerResult = validateCustomer(
      input.customer
    );

    if (!customerResult.success) {
      return customerResult;
    }

    // 2. Validar el carrito desde PostgreSQL.
    const orderResult = await this.validator.execute(
      input.items
    );

    if (!orderResult.success) {
      return orderResult;
    }

    // 3. Registrar el pedido pendiente.
    const registeredOrder =
      await this.registrationRepository.create({
        customer: customerResult.data,
        order: orderResult.data,
      });

    return {
      success: true,
      data: registeredOrder,
    };
  }
}
