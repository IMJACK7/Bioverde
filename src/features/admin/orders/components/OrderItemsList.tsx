
import type { AdminOrderDetail } from "@/server/modules/orders/queries/get-admin-order-by-id";

import { formatCurrency } from "../utils/order-formatters";

type OrderItemsListProps = {
  order: AdminOrderDetail;
};

const itemTypeLabels: Record<string, string> = {
  PRODUCT: "Producto individual",
  PREBUILT_KIT: "Kit prediseñado",
  CUSTOM_KIT: "Kit personalizado",
};

export default function OrderItemsList({
  order,
}: OrderItemsListProps) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Productos del pedido
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Detalle de los artículos y cantidades solicitadas.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {order.items.map((item) => (
          <article key={item.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900">
                  {item.name}
                </h3>

                {item.variantName && (
                  <p className="mt-1 text-sm text-gray-600">
                    Variante: {item.variantName}
                  </p>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  {itemTypeLabels[item.type] ?? item.type}
                </p>
              </div>

              <div className="text-right text-sm">
                <p className="text-gray-600">
                  {item.quantity} ×{" "}
                  {formatCurrency(Number(item.unitPrice))}
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatCurrency(Number(item.subtotal))}
                </p>
              </div>
            </div>

            {item.components.length > 0 && (
              <div className="mt-5 rounded-xl bg-green-50 p-4">
                <h4 className="text-sm font-semibold text-green-900">
                  Componentes del kit
                </h4>

                <ul className="mt-3 space-y-3">
                  {item.components.map((component) => (
                    <li
                      key={component.id}
                      className="flex flex-wrap items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {component.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                          Cantidad por kit: {component.quantity}
                        </p>
                      </div>

                      <span className="text-gray-700">
                        {formatCurrency(
                          Number(component.unitPrice)
                        )}{" "}
                        c/u
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-gray-700">
            Subtotal del pedido
          </span>

          <span className="text-xl font-bold text-green-800">
            {formatCurrency(Number(order.subtotal))}
          </span>
        </div>
      </div>
    </section>
  );
}
