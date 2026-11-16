
import { prisma } from "@/server/db/prisma";

import type {
  KitComponent,
  KitComponentRepository,
} from "../domain/kit-component.repository";

import type { Prisma } from "@/generated/prisma/client";

// Tipo del registro obtenido desde Prisma.
type KitComponentRecord =
  Prisma.KitComponentGetPayload<{}>;

// Convierte el registro de Prisma al modelo de dominio.
function toDomainKitComponent(
  component: KitComponentRecord
): KitComponent {
  return {
    id: component.id,
    name: component.name,
    slug: component.slug,
    description: component.description,
    type: component.type,
    price: component.price.toNumber(),
    stock: component.stock,
  };
}

export class PrismaKitComponentRepository
  implements KitComponentRepository
{
  async findAllAvailable(): Promise<KitComponent[]> {
    const components = await prisma.kitComponent.findMany({
      where: {
        isActive: true,
        stock: {
          gt: 0,
        },
      },
      orderBy: [
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return components.map(toDomainKitComponent);
  }
}
