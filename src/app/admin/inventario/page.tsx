
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { requireActiveAdmin } from
  "@/server/modules/auth/require-active-admin";

import { prisma } from "@/server/db/prisma";

import AddInventoryButton from "./AddInventoryButton";

type InventoryItemType =
  | "PRODUCT"
  | "VARIANT"
  | "COMPONENT";

interface InventoryItem {
  id: string;
  itemType: InventoryItemType;
  type: string;
  name: string;
  stock: number;
}

async function InventoryContent() {
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  const [products, variants, components] =
    await Promise.all([
      // Productos activos sin variantes.
      prisma.product.findMany({
        where: {
          isActive: true,
          isArchived: false,
          variants: {
            none: {},
          },
          type: {
            not: "PREBUILT_KIT",
          },
        },
        select: {
          id: true,
          name: true,
          stock: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      // Variantes activas de productos y kits.
      prisma.productVariant.findMany({
        where: {
          isActive: true,
          product: {
            isActive: true,
            isArchived: false,
          },
        },
        select: {
          id: true,
          name: true,
          stock: true,
          product: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),

      // Componentes independientes.
      // Los vinculados comparten stock con
      // la variante comercial correspondiente.
      prisma.kitComponent.findMany({
        where: {
          isActive: true,
          productVariantId: null,
        },
        select: {
          id: true,
          name: true,
          stock: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  const inventory: InventoryItem[] = [
    ...products.map((product) => ({
      id: product.id,
      itemType: "PRODUCT" as const,
      type: "Producto",
      name: product.name,
      stock: product.stock,
    })),

    ...variants.map((variant) => ({
      id: variant.id,
      itemType: "VARIANT" as const,
      type:
        variant.product.type === "PREBUILT_KIT"
          ? "Kit prediseñado"
          : "Variante",
      name: `${variant.product.name} - ${variant.name}`,
      stock: variant.stock,
    })),

    ...components.map((component) => ({
      id: component.id,
      itemType: "COMPONENT" as const,
      type: "Componente",
      name: component.name,
      stock: component.stock,
    })),
  ].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );

  const lowStockThreshold = 10;

  const lowStockCount = inventory.filter(
    (item) =>
      item.stock > 0 &&
      item.stock <= lowStockThreshold
  ).length;

  const outOfStockCount = inventory.filter(
    (item) => item.stock === 0
  ).length;

  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-green-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Inventario de BioVerde
          </h1>

          <p className="mt-2 text-gray-600">
            Consulta las existencias y registra nuevas
            unidades de productos, presentaciones,
            kits prediseñados y componentes independientes.
          </p>
        </header>

        {/* RESUMEN */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">
              Registros de inventario
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {inventory.length}
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">
              Existencias bajas
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-700">
              {lowStockCount}
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">
              Sin existencias
            </p>

            <p className="mt-2 text-3xl font-bold text-red-700">
              {outOfStockCount}
            </p>
          </div>
        </section>

        {/* TABLA DE INVENTARIO */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Existencias disponibles
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Se muestra un registro por inventario.
              Los componentes vinculados comparten
              existencias con su variante comercial.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Stock bajo: entre 1 y {lowStockThreshold} unidades.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Nombre
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Tipo
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Existencias
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Estado
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {inventory.map((item) => {
                  const stockLabel =
                    item.stock === 0
                      ? "Agotado"
                      : item.stock <= lowStockThreshold
                        ? "Stock bajo"
                        : "Disponible";

                  return (
                    <tr
                      key={`${item.itemType}-${item.id}`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.type}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {item.stock}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            item.stock === 0
                              ? "font-semibold text-red-700"
                              : item.stock <= lowStockThreshold
                                ? "font-semibold text-amber-700"
                                : "font-semibold text-green-700"
                          }
                        >
                          {stockLabel}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <AddInventoryButton
                          itemId={item.id}
                          itemType={item.itemType}
                          itemName={item.name}
                          currentStock={item.stock}
                        />
                      </td>
                    </tr>
                  );
                })}

                {inventory.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No hay registros activos de inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-green-50">
          <p
            role="status"
            className="text-sm font-medium text-green-800"
          >
            Cargando inventario...
          </p>
        </main>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
