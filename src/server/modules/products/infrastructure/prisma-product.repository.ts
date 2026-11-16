
import { prisma } from "@/server/db/prisma";

import type {
  Product,
  ProductRepository,
  ProductVariant,
} from "../domain/product.repository";

import type { Prisma } from "@/generated/prisma/client";

// Producto básico utilizado en el catálogo.
type ProductRecord = Prisma.ProductGetPayload<{}>;

// Producto con variantes, recetas y componentes.
type ProductWithVariants = Prisma.ProductGetPayload<{
  include: {
    variants: {
      include: {
        recipeItems: {
          include: {
            component: true;
          };
        };
      };
    };
  };
}>;

// Convierte los datos de Prisma al modelo de dominio.
function toDomainProduct(
  product: ProductRecord,
  variants: ProductVariant[] = []
): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toNumber(),
    stock: product.stock,
    imageUrl: product.imageUrl,
    variants,
  };
}

// Convierte las variantes y sus componentes.
function toDomainVariants(
  product: ProductWithVariants
): ProductVariant[] {
  return product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    slug: variant.slug,
    description: variant.description,
    price: variant.price.toNumber(),
    stock: variant.stock,
    imageUrl: variant.imageUrl,

    components: variant.recipeItems.map((item) => ({
      id: item.component.id,
      name: item.component.name,
      description: item.component.description,
      type: item.component.type,
      quantity: item.quantity,
    })),
  }));
}

export class PrismaProductRepository
  implements ProductRepository
{
  // Obtiene productos activos para el catálogo.
  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return products.map((product) =>
      toDomainProduct(product)
    );
  }

  // Obtiene un producto con sus variantes y recetas.
  async findBySlug(
    slug: string
  ): Promise<Product | null> {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
          include: {
            recipeItems: {
              include: {
                component: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    const variants = toDomainVariants(product);

    return toDomainProduct(product, variants);
  }
}
