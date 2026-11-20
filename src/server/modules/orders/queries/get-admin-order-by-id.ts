
import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getAdminOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          components: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export type AdminOrderDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminOrderById>>
>;
