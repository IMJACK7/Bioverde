
import "server-only";

import { NextResponse } from "next/server";

import { requireActiveAdmin } from
  "@/server/modules/auth/require-active-admin";

import { CompleteOrderUseCase } from
  "@/server/modules/orders/application/complete-order.use-case";

import { PrismaOrderCompletionRepository } from
  "@/server/modules/orders/infrastructure/prisma-order-completion.repository";

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

/**
 * POST /api/admin/orders/[orderId]/complete
 *
 * Marca como entregado un pedido pagado.
 * No modifica las existencias del inventario.
 */
export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    // Validar sesión administrativa activa.
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
        { status: 401 }
      );
    }

    const { orderId } = await context.params;

    // Ejecutar el caso de uso.
    const useCase = new CompleteOrderUseCase(
      new PrismaOrderCompletionRepository()
    );

    const result = await useCase.execute(orderId);

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
        {
          status: getErrorStatus(result.code),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.order.id,
          status: result.order.status,
          completedAt:
            result.order.completedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[POST /api/admin/orders/[orderId]/complete]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            code: "INTERNAL_SERVER_ERROR",
            message: "No fue posible completar el pedido.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
