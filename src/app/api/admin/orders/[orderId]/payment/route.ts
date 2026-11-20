
import "server-only";

import { NextResponse } from "next/server";

import { requireActiveAdmin } from
  "@/server/modules/auth/require-active-admin";

import { RegisterOrderPaymentUseCase } from
  "@/server/modules/orders/application/register-order-payment.use-case";

import { PrismaOrderPaymentRepository } from
  "@/server/modules/orders/infrastructure/prisma-order-payment.repository";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

function getErrorStatus(code: string): number {
  switch (code) {
    case "INVALID_ORDER_DATA":
      return 400;

    case "ORDER_NOT_FOUND":
      return 404;

    case "INVALID_ORDER_STATUS":
    case "INSUFFICIENT_STOCK":
    case "INVENTORY_ITEM_NOT_FOUND":
      return 409;

    default:
      return 500;
  }
}

/**
 * POST /api/admin/orders/[orderId]/payment
 *
 * Registra un pago verificado y descuenta
 * el inventario en una única transacción.
 */
export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
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

    const useCase = new RegisterOrderPaymentUseCase(
      new PrismaOrderPaymentRepository()
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
        data: result.order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[POST /api/admin/orders/[orderId]/payment]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            code: "INTERNAL_SERVER_ERROR",
            message: "No fue posible registrar el pago.",
          },
        ],
      },
      { status: 500 }
    );
  }
}
