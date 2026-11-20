
import type {
  OrderCustomerInput,
  OrderValidationError,
} from "../domain/order.types";

import type {
  OrderCustomerData,
} from "../domain/order-registration.types";

function customerError(
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

export function validateCustomer(
  input: unknown
):
  | { success: true; data: OrderCustomerData }
  | {
      success: false;
      errors: OrderValidationError[];
    } {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return {
      success: false,
      errors: [
        customerError(
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
      customerError(
        "El nombre debe tener entre 3 y 120 caracteres."
      )
    );
  }

  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
    errors.push(
      customerError(
        "Ingresa un número de teléfono válido."
      )
    );
  }

  if (
    municipality.length < 2 ||
    municipality.length > 100
  ) {
    errors.push(
      customerError(
        "El municipio debe tener entre 2 y 100 caracteres."
      )
    );
  }

  if (
    deliveryAddress.length < 5 ||
    deliveryAddress.length > 200
  ) {
    errors.push(
      customerError(
        "La dirección debe tener entre 5 y 200 caracteres."
      )
    );
  }

  if (notes.length > 500) {
    errors.push(
      customerError(
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
