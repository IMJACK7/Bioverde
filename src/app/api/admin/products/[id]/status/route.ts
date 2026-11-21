
import "server-only";

import { NextResponse } from "next/server";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

import {
  AdminProductStatusNotAllowedError,
  AdminProductStatusNotFoundError,
  AdminProductStatusValidationError,
  SetAdminProductStatusUseCase,
} from "@/server/modules/products/application/set-admin-product-status.use-case";

import { PrismaAdminProductRepository } from "@/server/modules/products/infrastructure/prisma-admin-product.repository";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // 1. Verificar la sesión administrativa.
    const administrator = await requireActiveAdmin();

    if (!administrator) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Debes iniciar sesión como administrador.",
        },
        { status: 401 }
      );
    }

    // 2. Obtener el identificador del producto.
    const { id } = await context.params;

    // 3. Leer el cuerpo de la solicitud.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "INVALID_JSON",
          message: "El cuerpo de la solicitud debe ser JSON válido.",
        },
        { status: 400 }
      );
    }

    // 4. Verificar que se recibió un objeto.
    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          error: "INVALID_BODY",
          message: "Debes enviar un objeto JSON válido.",
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    // 5. Validar el estado solicitado.
    if (typeof data.isActive !== "boolean") {
      return NextResponse.json(
        {
          error: "INVALID_BODY",
          message:
            "El campo isActive debe ser verdadero o falso.",
        },
        { status: 400 }
      );
    }

    // 6. Ejecutar las reglas de negocio.
    const repository = new PrismaAdminProductRepository();

    const useCase = new SetAdminProductStatusUseCase(
      repository
    );

    const product = await useCase.execute(
      id,
      data.isActive
    );

    // 7. Responder con el estado actualizado.
    return NextResponse.json(
      {
        message: product.isActive
          ? "Producto activado correctamente."
          : "Producto desactivado correctamente.",
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    // Identificador o estado inválido.
    if (
      error instanceof AdminProductStatusValidationError
    ) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message,
        },
        { status: 400 }
      );
    }

    // Producto inexistente.
    if (error instanceof AdminProductStatusNotFoundError) {
      return NextResponse.json(
        {
          error: "PRODUCT_NOT_FOUND",
          message: error.message,
        },
        { status: 404 }
      );
    }

    // Operación no permitida para kits.
    if (
      error instanceof AdminProductStatusNotAllowedError
    ) {
      return NextResponse.json(
        {
          error: "PRODUCT_STATUS_NOT_ALLOWED",
          message: error.message,
        },
        { status: 403 }
      );
    }

    // Error interno no previsto.
    console.error(
      "[PATCH /api/admin/products/[id]/status]",
      error
    );

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          "No fue posible cambiar el estado del producto.",
      },
      { status: 500 }
    );
  }
}
