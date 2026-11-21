
import { NextResponse } from "next/server";

import { requireActiveAdmin } from
  "@/server/modules/auth/require-active-admin";

import {
  AddInventoryUseCase,
  InvalidInventoryEntryError,
  InventoryItemNotFoundError,
  InventoryEntryConflictError,
} from "@/server/modules/inventory/application/add-inventory.use-case";

import { PrismaInventoryRepository } from
  "@/server/modules/inventory/infrastructure/prisma-inventory.repository";

export async function POST(request: Request) {
  try {
    // Solo administradores activos.
    const administrator = await requireActiveAdmin();

    if (!administrator) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    // Validar que el cuerpo sea JSON.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud debe ser JSON válido." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Los datos enviados no son válidos." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    if (
      typeof data.itemId !== "string" ||
      typeof data.itemType !== "string" ||
      typeof data.quantity !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Debes proporcionar un producto, su tipo y una cantidad numérica.",
        },
        { status: 400 }
      );
    }

    const useCase = new AddInventoryUseCase(
      new PrismaInventoryRepository()
    );

    const result = await useCase.execute({
      itemId: data.itemId,
      itemType: data.itemType as
        "PRODUCT" | "VARIANT" | "COMPONENT",
      quantity: data.quantity,
    });

    return NextResponse.json(
      {
        message: "Entrada de inventario registrada correctamente.",
        inventory: result,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof InvalidInventoryEntryError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof InventoryItemNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof InventoryEntryConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error(
      "Error al registrar entrada de inventario:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error interno al registrar las existencias.",
      },
      { status: 500 }
    );
  }
}
