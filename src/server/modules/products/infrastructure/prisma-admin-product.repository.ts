
import "server-only";

import { prisma } from "@/server/db/prisma";

import type {
  AdminProduct,
  AdminProductRepository,
  CreateAdminProductInput,
  UpdateAdminProductInput,
} from "../domain/admin-product.repository";

type ProductWithCategory = NonNullable<
  Awaited<ReturnType<typeof getProductWithCategory>>
>;

async function getProductWithCategory(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          variants: true,
        },
      },
    },
  });
}

function toAdminProduct(
  product: ProductWithCategory
): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toNumber(),
    stock: product.stock,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    isArchived: product.isArchived,
    hasVariants: product._count.variants > 0,
    type: product.type,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export class PrismaAdminProductRepository
  implements AdminProductRepository
{
  // Consultar todos los productos, incluidos los archivados.
  async findAll(): Promise<AdminProduct[]> {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return products.map(toAdminProduct);
  }

  // Consultar un producto por su slug.
  async findBySlug(
    slug: string
  ): Promise<AdminProduct | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    return product ? toAdminProduct(product) : null;
  }

  // Consultar un producto por su identificador.
  async findById(
    id: string
  ): Promise<AdminProduct | null> {
    const product = await getProductWithCategory(id);

    return product ? toAdminProduct(product) : null;
  }

  // Crear un fertilizante o accesorio independiente.
  async create(
    input: CreateAdminProductInput
  ): Promise<AdminProduct> {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        stock: input.stock,
        imageUrl: input.imageUrl,
        type: input.type,
        categoryId: input.categoryId,
        isActive: true,
        isArchived: false,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    return toAdminProduct(product);
  }

  // Editar únicamente productos independientes no archivados.
  async update(
    id: string,
    input: UpdateAdminProductInput
  ): Promise<AdminProduct | null> {
    const result = await prisma.product.updateMany({
      where: {
        id,
        type: {
          in: ["FERTILIZER", "ACCESSORY"],
        },
        isArchived: false,
        variants: {
          none: {},
        },
      },
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  // Cambiar el estado únicamente de productos no archivados.
  async setActiveStatus(
    id: string,
    isActive: boolean
  ): Promise<AdminProduct | null> {
    const result = await prisma.product.updateMany({
      where: {
        id,
        type: {
          in: ["FERTILIZER", "ACCESSORY"],
        },
        isArchived: false,
      },
      data: {
        isActive,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }
}
