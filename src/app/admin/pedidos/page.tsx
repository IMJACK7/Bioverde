
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";
import { getAdminOrders } from "@/server/modules/orders/queries/get-admin-orders";

import OrdersTable from "@/features/admin/orders/components/OrdersTable";
import OrdersEmptyState from "@/features/admin/orders/components/OrdersEmptyState";

async function OrdersContent() {
  // Verificar autorización administrativa
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  // Consultar los pedidos más recientes
  const orders = await getAdminOrders();

  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-medium text-green-700 hover:underline"
          >
            ← Volver al panel
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Gestión de pedidos
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta los 50 pedidos más recientes de BioVerde.
          </p>
        </header>

        <section
          aria-label="Listado de pedidos"
          className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"
        >
          {orders.length === 0 ? (
            <OrdersEmptyState />
          ) : (
            <OrdersTable orders={orders} />
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-green-50">
          <p
            role="status"
            className="text-sm font-medium text-green-800"
          >
            Cargando pedidos...
          </p>
        </main>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
