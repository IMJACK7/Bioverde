
import "server-only";

import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

import {
  AdminProductNotEditableError,
  AdminProductNotFoundError,
  AdminProductUpdateValidationError,
  UpdateAdminProductUseCase,
} from "@/server/modules/products/application/update-admin-product.use-case";

import { InvalidProductCategoryError } from "@/server/modules/products/application/validate-product-category";

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

    // 3. Leer el JSON recibido.
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

    // 4. Verificar que sea un objeto JSON.
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

    // 5. Validar los tipos de datos.
    if (
      typeof data.name !== "string" ||
      typeof data.categoryId !== "string" ||
      typeof data.price !== "number" ||
      typeof data.stock !== "number" ||
      (
        data.description !== undefined &&
        data.description !== null &&
        typeof data.description !== "string"
      ) ||
      (
        data.imageUrl !== undefined &&
        data.imageUrl !== null &&
        typeof data.imageUrl !== "string"
      )
    ) {
      return NextResponse.json(
        {
          error: "INVALID_BODY",
          message: "Los campos del producto tienen tipos inválidos.",
        },
        { status: 400 }
      );
    }

    // 6. Ejecutar las reglas de negocio.
    const repository = new PrismaAdminProductRepository();

    const useCase = new UpdateAdminProductUseCase(
      repository
    );

    const product = await useCase.execute(id, {
      name: data.name,
      description:
        typeof data.description === "string"
          ? data.description
          : null,
      price: data.price,
      stock: data.stock,
      imageUrl:
        typeof data.imageUrl === "string"
          ? data.imageUrl
          : null,
      categoryId: data.categoryId,
    });

    // 7. Responder con el producto actualizado.
    return NextResponse.json(
      {
        message: "Producto actualizado correctamente.",
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    // Datos inválidos.
    if (
      error instanceof AdminProductUpdateValidationError
    ) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message,
        },
        { status: 400 }
      );
    }

    // Categoría inexistente o incompatible.
    if (error instanceof InvalidProductCategoryError) {
      return NextResponse.json(
        {
          error: "INVALID_CATEGORY",
          message: error.message,
        },
        { status: 400 }
      );
    }

    // Producto inexistente.
    if (error instanceof AdminProductNotFoundError) {
      return NextResponse.json(
        {
          error: "PRODUCT_NOT_FOUND",
          message: error.message,
        },
        { status: 404 }
      );
    }

    // Producto fuera del alcance del módulo.
    if (error instanceof AdminProductNotEditableError) {
      return NextResponse.json(
        {
          error: "PRODUCT_NOT_EDITABLE",
          message: error.message,
        },
        { status: 403 }
      );
    }

    // Categoría eliminada durante la actualización.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error: "INVALID_CATEGORY",
          message: "La categoría seleccionada no existe.",
        },
        { status: 400 }
      );
    }

    // Error interno.
    console.error("[PATCH /api/admin/products/[id]]", error);

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "No fue posible actualizar el producto.",
      },
      { status: 500 }
    );
  }
}
