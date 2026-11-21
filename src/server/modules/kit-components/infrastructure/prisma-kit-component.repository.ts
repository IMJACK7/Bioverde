import { prisma } from "@/server/db/prisma";
import type {
  KitComponent,
  KitComponentRepository,
} from "../domain/kit-component.repository";

import type { Prisma } from "@/generated/prisma/client";

type KitComponentRecord = Prisma.KitComponentGetPayload<{
  include: {
    productVariant: {
      include: {
        product: true;
      };
    };
  };
}>;

function toDomainKitComponent(
  component: KitComponentRecord
): KitComponent {
  const linkedVariant = component.productVariant;

  const effectiveStock = linkedVariant
    ? linkedVariant.stock
    : component.stock;

  return {
    id: component.id,
    name: component.name,
    slug: component.slug,
    description: component.description,
    type: component.type,
    price: component.price.toNumber(),
    stock: effectiveStock,
  };
}

export class PrismaKitComponentRepository
  implements KitComponentRepository
{
  async findAllAvailable(): Promise<KitComponent[]> {
    const components = await prisma.kitComponent.findMany({
      where: {
        isActive: true,
        OR: [
          {
            productVariantId: null,
            stock: {
              gt: 0,
            },
          },
          {
            productVariant: {
              is: {
                isActive: true,
                stock: {
                  gt: 0,
                },
                product: {
                  is: {
                    isActive: true,
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
    });

    return components.map(toDomainKitComponent);
  }
}