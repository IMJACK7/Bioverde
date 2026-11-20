
import type { AdminOrderDetail } from "@/server/modules/orders/queries/get-admin-order-by-id";

import OrderStatusBadge from "./OrderStatusBadge";
import { formatDate } from "../utils/order-formatters";

type OrderAdditionalInfoProps = {
  order: AdminOrderDetail;
};

export default function OrderAdditionalInfo({
  order,
}: OrderAdditionalInfoProps) {
  return (
    <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Información adicional
      </h2>

      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-gray-500">
            Estado del pedido
          </dt>

          <dd className="mt-2">
            <OrderStatusBadge status={order.status} />
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">
            Última actualización
          </dt>

          <dd className="mt-1 text-gray-900">
            {formatDate(order.updatedAt)}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">
            Observaciones
          </dt>

          <dd className="mt-1 whitespace-pre-wrap break-words text-gray-900">
            {order.notes || "Sin observaciones."}
          </dd>
        </div>
      </dl>
    </section>
  );
}
