
import { NextResponse } from "next/server";

/**
 * Ruta antigua de confirmación.
 *
 * Se conserva temporalmente para evitar
 * reutilizar el flujo anterior.
 *
 * Los pagos deben registrarse mediante:
 * POST /api/admin/orders/[orderId]/payment
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      errors: [
        {
          code: "ENDPOINT_DEPRECATED",
          message:
            "La confirmación de pedidos fue reemplazada por el registro de pagos.",
        },
      ],
    },
    {
      status: 410,
    }
  );
}
