
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";
import { getAdminOrderById } from "@/server/modules/orders/queries/get-admin-order-by-id";

import OrderDetailHeader from "@/features/admin/orders/components/OrderDetailHeader";
import OrderCustomerInfo from "@/features/admin/orders/components/OrderCustomerInfo";
import OrderAdditionalInfo from "@/features/admin/orders/components/OrderAdditionalInfo";
import OrderItemsList from "@/features/admin/orders/components/OrderItemsList";

import RegisterOrderPaymentButton from "@/features/admin/orders/components/RegisterOrderPaymentButton";
import CompleteOrderButton from "@/features/admin/orders/components/CompleteOrderButton";
import CancelOrderButton from "@/features/admin/orders/components/CancelOrderButton";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function OrderDetailContent({ params }: PageProps) {
  // 1. Verificar autorización administrativa.
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  // 2. Obtener el identificador del pedido.
  const { id } = await params;

  // 3. Consultar el pedido en PostgreSQL.
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  // 4. Presentar los componentes del detalle.
  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <OrderDetailHeader order={order} />

        <div className="grid gap-6 md:grid-cols-2">
          <OrderCustomerInfo order={order} />
          <OrderAdditionalInfo order={order} />
        </div>

        <OrderItemsList order={order} />

        {/* Acciones administrativas según el estado. */}
        {(order.status === "PENDING" ||
          order.status === "PAID") && (
          <section
            aria-label="Acciones administrativas del pedido"
            className="mt-6"
          >
            {order.status === "PENDING" && (
              <div className="flex flex-wrap items-start gap-4">
                <RegisterOrderPaymentButton
                  orderId={order.id}
                />

                <CancelOrderButton
                  orderId={order.id}
                />
              </div>
            )}

            {order.status === "PAID" && (
              <CompleteOrderButton
                orderId={order.id}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function AdminOrderDetailPage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-green-50">
          <p
            role="status"
            className="text-sm font-medium text-green-800"
          >
            Cargando detalle del pedido...
          </p>
        </main>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
