
import "server-only";

import { prisma } from "@/server/db/prisma";

const ADMIN_ORDERS_LIMIT = 50;

export async function getAdminOrders() {
  return prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: ADMIN_ORDERS_LIMIT,
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      municipality: true,
      subtotal: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}

export type AdminOrderListItem = Awaited<
  ReturnType<typeof getAdminOrders>
>[number];
