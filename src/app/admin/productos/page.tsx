
import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";
import { ListAdminProductsUseCase } from "@/server/modules/products/application/list-admin-products.use-case";
import { PrismaAdminProductRepository } from "@/server/modules/products/infrastructure/prisma-admin-product.repository";

import type { AdminProduct } from "@/server/modules/products/domain/admin-product.repository";

import ProductStatusButton from "./ProductStatusButton";

const productTypeLabels: Record<string, string> = {
  PREBUILT_KIT: "Kit prediseñado",
  FERTILIZER: "Fertilizante",
  CUSTOM_KIT: "Kit personalizado",
  ACCESSORY: "Accesorio",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);

interface ProductTableProps {
  title: string;
  description: string;
  products: AdminProduct[];
  emptyMessage: string;
}

function ProductTable({
  title,
  description,
  products,
  emptyMessage,
}: ProductTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="px-6 py-10 text-center text-gray-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Producto",
                  "Tipo",
                  "Categoría",
                  "Precio",
                  "Inventario",
                  "Estado",
                  "Acciones",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-5 py-4 font-semibold text-gray-700"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const manageableType =
                  product.type === "FERTILIZER" ||
                  product.type === "ACCESSORY";

                const canEdit =
                  manageableType &&
                  !product.isArchived &&
                  !product.hasVariants;

                const canChangeStatus =
                  manageableType &&
                  !product.isArchived;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {product.slug}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                      {productTypeLabels[product.type] ??
                        product.type}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {product.categoryName}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {product.hasVariants ? (
                        <span className="text-xs font-medium text-blue-700">
                          Por variantes
                        </span>
                      ) : (
                        product.stock
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          product.isArchived
                            ? "bg-amber-100 text-amber-800"
                            : product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isArchived
                          ? "Archivado"
                          : product.isActive
                            ? "Activo"
                            : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {product.isArchived ? (
                        <span className="text-xs text-gray-500">
                          Solo consulta
                        </span>
                      ) : canEdit || canChangeStatus ? (
                        <div className="flex flex-wrap items-start gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/productos/${product.id}/editar`}
                              aria-label={`Editar ${product.name}`}
                              className="inline-flex items-center justify-center rounded-lg border border-green-700 px-4 py-2 text-xs font-semibold text-green-800 transition hover:bg-green-50"
                            >
                              Editar
                            </Link>
                          )}

                          {canChangeStatus && (
                            <ProductStatusButton
                              productId={product.id}
                              productName={product.name}
                              isActive={product.isActive}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No disponible
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function AdminProductsContent() {
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  const repository = new PrismaAdminProductRepository();
  const useCase = new ListAdminProductsUseCase(repository);
  const products = await useCase.execute();

  const activeProducts = products.filter(
    (product) => product.isActive && !product.isArchived
  );

  const inactiveProducts = products.filter(
    (product) => !product.isActive && !product.isArchived
  );

  const archivedProducts = products.filter(
    (product) => product.isArchived
  );

  const indicators = [
    {
      label: "Total de productos",
      value: products.length,
    },
    {
      label: "Productos activos",
      value: activeProducts.length,
    },
    {
      label: "Productos inactivos",
      value: inactiveProducts.length,
    },
    {
      label: "Productos archivados",
      value: archivedProducts.length,
    },
  ];

  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-green-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <header className="mb-8 mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
              BioVerde · Administración
            </p>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Gestión de productos
            </h1>

            <p className="mt-2 text-gray-600">
              Administra el catálogo comercial y consulta
              los registros históricos de BioVerde.
            </p>
          </div>

          <Link
            href="/admin/productos/nuevo"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            + Nuevo producto
          </Link>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((indicator) => (
            <article
              key={indicator.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-600">
                {indicator.label}
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {indicator.value}
              </p>
            </article>
          ))}
        </section>

        <div className="space-y-8">
          <ProductTable
            title="Productos activos"
            description="Productos habilitados comercialmente."
            products={activeProducts}
            emptyMessage="No hay productos activos."
          />

          <ProductTable
            title="Productos inactivos"
            description="Productos desactivados temporalmente que pueden volver al catálogo."
            products={inactiveProducts}
            emptyMessage="No hay productos inactivos."
          />

          <ProductTable
            title="Productos archivados"
            description="Registros históricos retirados del catálogo. No pueden reactivarse desde esta administración."
            products={archivedProducts}
            emptyMessage="No hay productos archivados."
          />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Nota: los productos con variantes administran
          sus existencias por presentación. Los kits
          prediseñados mantienen inventario propio
          por variante, independiente de los componentes
          individuales.
        </p>
      </div>
    </main>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-green-50">
          <p
            role="status"
            className="text-sm font-medium text-green-800"
          >
            Cargando productos...
          </p>
        </main>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
