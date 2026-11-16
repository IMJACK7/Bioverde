
import { NextResponse } from "next/server";

import { ValidateOrderUseCase } from "@/server/modules/orders/application/validate-order.use-case";

import { PrismaOrderValidationRepository } from "@/server/modules/orders/infrastructure/prisma-order-validation.repository";


const MAX_REQUEST_BYTES = 64 * 1024;

/**
 * POST /api/orders/validate
 *
 * Valida el carrito utilizando los datos actuales
 * de PostgreSQL.
 *
 * No registra pedidos ni modifica inventario.
 */
export async function POST(request: Request) {
  try {
    // Limitar el tamaño de la solicitud.
    const contentLength = request.headers.get(
      "content-length"
    );

    if (
      contentLength !== null &&
      Number(contentLength) > MAX_REQUEST_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "INVALID_ORDER",
              message: "La solicitud es demasiado grande.",
            },
          ],
        },
        { status: 413 }
      );
    }

    const rawBody = await request.text();

    if (
      new TextEncoder().encode(rawBody).length >
      MAX_REQUEST_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "INVALID_ORDER",
              message: "La solicitud es demasiado grande.",
            },
          ],
        },
        { status: 413 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "INVALID_ORDER",
              message: "El cuerpo de la solicitud no es JSON válido.",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      !("items" in body) ||
      !Array.isArray(body.items)
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "INVALID_ORDER",
              message: "Debes enviar una lista de artículos.",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Comprobaciones estructurales preliminares.
    // El caso de uso aplica las reglas de negocio.
    if (body.items.length > 50) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "INVALID_ORDER",
              message:
                "El carrito supera el máximo de 50 artículos diferentes.",
            },
          ],
        },
        { status: 400 }
      );
    }

    const hasInvalidStructure = body.items.some(
      (item: unknown) => {
        if (
          typeof item !== "object" ||
          item === null ||
          Array.isArray(item)
        ) {
          return true;
        }

        if (
          !("type" in item) ||
          !("quantity" in item) ||
          typeof item.type !== "string" ||
          typeof item.quantity !== "number"
        ) {
          return true;
        }

        if (
          item.type === "CUSTOM_KIT" &&
          (!("components" in item) ||
            !Array.isArray(item.components) ||
            item.components.length > 50)
        ) {
          return true;
        }

        return false;
      }
    );

    if (hasInvalidStructure) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "INVALID_ORDER",
              message:
                "Uno o varios artículos tienen un formato inválido.",
            },
          ],
        },
        { status: 400 }
      );
    }

    const repository =
      new PrismaOrderValidationRepository();

    const useCase = new ValidateOrderUseCase(
      repository
    );

    const result = await useCase.execute(body.items);

    if (!result.success) {
      return NextResponse.json(result, {
        status: 422,
      });
    }

    return NextResponse.json(result, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "Error al validar el pedido:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            code: "INVALID_ORDER",
            message:
              "No fue posible validar el pedido. Inténtalo nuevamente.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
