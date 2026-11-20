
import type {
  OrderValidationError,
} from "../domain/order.types";

type ErrorCode = OrderValidationError["code"];

export const MAX_ITEM_QUANTITY = 100;
export const MAX_COMPONENT_QUANTITY = 100;

/**
 * Construye errores de validación
 * utilizando los códigos del dominio.
 */
export function createOrderValidationError(
  code: ErrorCode,
  message: string
): OrderValidationError {
  return {
    code,
    message,
  };
}

/**
 * Comprueba que una cantidad sea
 * un entero positivo dentro del límite.
 */
export function isPositiveInteger(
  value: unknown,
  max: number = MAX_ITEM_QUANTITY
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= max
  );
}

/**
 * Comprueba que un identificador
 * sea una cadena no vacía.
 */
export function isValidId(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/**
 * Redondea valores monetarios
 * a dos posiciones decimales.
 */
export function roundMoney(
  value: number
): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}
