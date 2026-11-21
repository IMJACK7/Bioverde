
import "server-only";

import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

import {
  AdminProductSlugConflictError,
  AdminProductValidationError,
  CreateAdminProductUseCase,
} from "@/server/modules/products/application/create-admin-product.use-case";

import { InvalidProductCategoryError } from "@/server/modules/products/application/validate-product-category";

import { PrismaAdminProductRepository } from "@/server/modules/products/infrastructure/prisma-admin-product.repository";

export async function POST(request: Request) {
  try {
    // 1. Verificar autorización administrativa.
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

    // 2. Leer y comprobar la estructura del JSON.
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

    // 3. Validar los tipos de datos recibidos.
    if (
      typeof data.name !== "string" ||
      typeof data.slug !== "string" ||
      typeof data.categoryId !== "string" ||
      typeof data.type !== "string" ||
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

    // 4. Ejecutar las reglas de negocio.
    const repository = new PrismaAdminProductRepository();

    const useCase = new CreateAdminProductUseCase(
      repository
    );

    const product = await useCase.execute({
      name: data.name,
      slug: data.slug,
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
      type: data.type as "FERTILIZER" | "ACCESSORY",
      categoryId: data.categoryId,
    });

    // 5. Responder con el producto creado.
    return NextResponse.json(
      {
        message: "Producto creado correctamente.",
        product,
      },
      { status: 201 }
    );

  } catch (error) {
    // 6. Categoría inexistente o incompatible.
    if (error instanceof InvalidProductCategoryError) {
      return NextResponse.json(
        {
          error: "INVALID_CATEGORY",
          message: error.message,
        },
        { status: 400 }
      );
    }

    // 7. Errores de validación del producto.
    if (error instanceof AdminProductValidationError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: error.message,
        },
        { status: 400 }
      );
    }

    // 8. Slug registrado previamente.
    if (error instanceof AdminProductSlugConflictError) {
      return NextResponse.json(
        {
          error: "SLUG_ALREADY_EXISTS",
          message: error.message,
        },
        { status: 409 }
      );
    }

    // 9. Restricción de unicidad en PostgreSQL.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "SLUG_ALREADY_EXISTS",
          message: "Ya existe un producto con ese identificador.",
        },
        { status: 409 }
      );
    }

    // 10. Restricción de clave foránea en PostgreSQL.
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

    // 11. Error interno no previsto.
    console.error("[POST /api/admin/products]", error);

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "No fue posible crear el producto.",
      },
      { status: 500 }
    );
  }
}
