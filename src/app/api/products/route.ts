
import { NextResponse } from "next/server";

import { PrismaProductRepository } from
  "@/server/modules/products/infrastructure/prisma-product.repository";

import { ListProductsUseCase } from
  "@/server/modules/products/application/list-products.use-case";

export async function GET() {
  try {
    const repository = new PrismaProductRepository();

    const useCase = new ListProductsUseCase(
      repository
    );

    const products = await useCase.execute();

    return NextResponse.json(
      {
        success: true,
        data: products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al consultar productos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
