
import type { AdminOrderDetail } from "@/server/modules/orders/queries/get-admin-order-by-id";

type OrderCustomerInfoProps = {
  order: AdminOrderDetail;
};

export default function OrderCustomerInfo({
  order,
}: OrderCustomerInfoProps) {
  return (
    <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Información del cliente
      </h2>

      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-gray-500">Nombre</dt>
          <dd className="mt-1 font-medium text-gray-900">
            {order.customerName}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Teléfono</dt>
          <dd className="mt-1 font-medium text-gray-900">
            {order.customerPhone}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">Municipio</dt>
          <dd className="mt-1 font-medium text-gray-900">
            {order.municipality}
          </dd>
        </div>

        <div>
          <dt className="text-gray-500">
            Dirección de entrega
          </dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-gray-900">
            {order.deliveryAddress}
          </dd>
        </div>
      </dl>
    </section>
  );
}
