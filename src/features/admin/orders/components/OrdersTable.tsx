
import Link from "next/link";

import type { AdminOrderListItem } from "@/server/modules/orders/queries/get-admin-orders";

import OrderStatusBadge from "./OrderStatusBadge";

import {
  formatCurrency,
  formatDate,
} from "../utils/order-formatters";

type OrdersTableProps = {
  orders: AdminOrderListItem[];
};

export default function OrdersTable({
  orders,
}: OrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th scope="col" className="px-5 py-4 font-semibold">
              Pedido
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Cliente
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Municipio
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Artículos
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Subtotal
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Estado
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Fecha
            </th>

            <th scope="col" className="px-5 py-4 font-semibold">
              Acción
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="transition hover:bg-green-50/50"
            >
              <td className="px-5 py-4 font-mono text-xs">
                <span className="font-semibold text-gray-900">
                  {order.id.slice(0, 8)}
                </span>
              </td>

              <td className="px-5 py-4">
                <p className="font-medium text-gray-900">
                  {order.customerName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {order.customerPhone}
                </p>
              </td>

              <td className="px-5 py-4 text-gray-700">
                {order.municipality}
              </td>

              <td className="px-5 py-4 text-gray-700">
                {order._count.items}
              </td>

              <td className="px-5 py-4 font-semibold text-gray-900">
                {formatCurrency(Number(order.subtotal))}
              </td>

              <td className="px-5 py-4">
                <OrderStatusBadge status={order.status} />
              </td>

              <td className="px-5 py-4 text-gray-600">
                {formatDate(order.createdAt)}
              </td>

              <td className="px-5 py-4">
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="inline-flex rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 hover:text-green-900"
                  aria-label={`Ver detalle del pedido ${order.id.slice(0, 8)}`}
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
