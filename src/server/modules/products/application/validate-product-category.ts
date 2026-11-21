
import "server-only";

import { prisma } from "@/server/db/prisma";

import type {
  ManageableProductType,
} from "../domain/admin-product.repository";

export class InvalidProductCategoryError extends Error {
  constructor() {
    super(
      "La categoría seleccionada no existe o no corresponde al tipo de producto."
    );
    this.name = "InvalidProductCategoryError";
  }
}

const allowedCategorySlugs: Record<
  ManageableProductType,
  string
> = {
  FERTILIZER: "abonos-organicos",
  ACCESSORY: "herramientas-accesorios",
};

export async function validateProductCategory(
  type: ManageableProductType,
  categoryId: string
): Promise<void> {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    select: {
      slug: true,
    },
  });

  if (
    !category ||
    category.slug !== allowedCategorySlugs[type]
  ) {
    throw new InvalidProductCategoryError();
  }
}
