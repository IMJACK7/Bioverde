
import { NextRequest, NextResponse } from "next/server";

import { ValidateOrderUseCase } from "@/server/modules/orders/application/validate-order.use-case";
import { CreateOrderUseCase } from "@/server/modules/orders/application/create-order.use-case";

import { PrismaOrderValidationRepository } from "@/server/modules/orders/infrastructure/prisma-order-validation.repository";
import { PrismaOrderRegistrationRepository } from "@/server/modules/orders/infrastructure/prisma-order-registration.repository";

import type {
  CreateOrderInput,
} from "@/server/modules/orders/domain/order.types";

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_CART_ITEMS = 50;
const MAX_COMPONENTS_PER_KIT = 50;

function errorResponse(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      errors: [
        {
          code: "INVALID_ORDER",
          message,
        },
      ],
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (
      new TextEncoder().encode(rawBody).byteLength >
      MAX_REQUEST_BYTES
    ) {
      return errorResponse(
        "La solicitud supera el tamaño permitido.",
        413
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse(
        "El cuerpo de la solicitud no contiene un JSON válido.",
        400
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Los datos del pedido son inválidos.",
        400
      );
    }

    const payload = body as Record<string, unknown>;

    if (
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return errorResponse(
        "Debes agregar al menos un artículo al pedido.",
        400
      );
    }

    if (payload.items.length > MAX_CART_ITEMS) {
      return errorResponse(
        "El pedido supera el número máximo de artículos.",
        400
      );
    }

    for (const item of payload.items) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        return errorResponse(
          "El pedido contiene un artículo inválido.",
          400
        );
      }

      const entry = item as Record<string, unknown>;

      if (
        entry.components !== undefined &&
        (
          !Array.isArray(entry.components) ||
          entry.components.length >
            MAX_COMPONENTS_PER_KIT
        )
      ) {
        return errorResponse(
          "La configuración de un kit es inválida.",
          400
        );
      }
    }

    const validator = new ValidateOrderUseCase(
      new PrismaOrderValidationRepository()
    );

    const registrationRepository =
      new PrismaOrderRegistrationRepository();

    const createOrder = new CreateOrderUseCase(
      validator,
      registrationRepository
    );

    const result = await createOrder.execute(
      payload as unknown as CreateOrderInput
    );

    if (!result.success) {
      return NextResponse.json(result, {
        status: 422,
      });
    }

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "[POST /api/orders] Error al registrar pedido:",
      error
    );

    return errorResponse(
      "No fue posible registrar el pedido. Inténtalo nuevamente.",
      500
    );
  }
}
