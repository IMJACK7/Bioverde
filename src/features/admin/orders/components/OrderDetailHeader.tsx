
import Link from "next/link";

import type { AdminOrderDetail } from "@/server/modules/orders/queries/get-admin-order-by-id";

import OrderStatusBadge from "./OrderStatusBadge";
import { formatDate } from "../utils/order-formatters";

type OrderDetailHeaderProps = {
  order: AdminOrderDetail;
};

export default function OrderDetailHeader({
  order,
}: OrderDetailHeaderProps) {
  return (
    <>
      <Link
        href="/admin/pedidos"
        className="text-sm font-medium text-green-700 transition hover:underline"
      >
        ← Volver a pedidos
      </Link>

      <header className="mb-8 mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Detalle del pedido
          </h1>

          <OrderStatusBadge status={order.status} />
        </div>

        <p className="mt-3 break-all font-mono text-xs text-gray-500">
          ID: {order.id}
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Registrado el {formatDate(order.createdAt)}
        </p>
      </header>
    </>
  );
}
