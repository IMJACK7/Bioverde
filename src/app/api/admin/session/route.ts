
import "server-only";

import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

export async function GET() {
  try {
    const administrator = await requireActiveAdmin();

    return NextResponse.json(
      {
        authenticated: Boolean(administrator),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // Permitir que Next.js gestione sus errores internos,
    // especialmente los relacionados con renderizado dinámico.
    unstable_rethrow(error);

    console.error("[GET /api/admin/session]", error);

    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
