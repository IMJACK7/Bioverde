
import { NextResponse } from "next/server";

import { PrismaKitComponentRepository } from
  "@/server/modules/kit-components/infrastructure/prisma-kit-component.repository";

import { ListKitComponentsUseCase } from
  "@/server/modules/kit-components/application/list-kit-components.use-case";

export async function GET() {
  try {
    const repository = new PrismaKitComponentRepository();

    const useCase = new ListKitComponentsUseCase(
      repository
    );

    const components = await useCase.execute();

    return NextResponse.json({
      success: true,
      data: components,
    });
  } catch (error) {
    console.error(
      "Error al consultar los componentes de BioVerde:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "No fue posible consultar los componentes.",
      },
      {
        status: 500,
      }
    );
  }
}
