
import "server-only";

import { NextResponse } from "next/server";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

import { CancelOrderUseCase } from "@/server/modules/orders/application/cancel-order.use-case";

import { PrismaOrderCancellationRepository } from "@/server/modules/orders/infrastructure/prisma-order-cancellation.repository";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

function getErrorStatus(code: string): number {
  switch (code) {
    case "ORDER_NOT_FOUND":
      return 404;

    case "INVALID_ORDER_STATUS":
      return 409;

    default:
      return 500;
  }
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    // Verificar que exista un administrador activo.
    const administrator = await requireActiveAdmin();

    if (!administrator) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "No autorizado.",
            },
          ],
        },
        { status: 401 },
      );
    }

    // Obtener el identificador del pedido.
    const { orderId } = await context.params;

    // Ejecutar el caso de uso.
    const useCase = new CancelOrderUseCase(
      new PrismaOrderCancellationRepository(),
    );

    const result = await useCase.execute(orderId);

    // Gestionar errores de negocio.
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: result.code,
              message: result.message,
            },
          ],
        },
        { status: getErrorStatus(result.code) },
      );
    }

    // Devolver el pedido cancelado.
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.order.id,
          status: result.order.status,
          cancelledAt: result.order.cancelledAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "[POST /api/admin/orders/[orderId]/cancel]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            code: "INTERNAL_SERVER_ERROR",
            message: "No fue posible cancelar el pedido.",
          },
        ],
      },
      { status: 500 },
    );
  }
}
