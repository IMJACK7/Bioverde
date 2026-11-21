
import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

import CreateProductForm from "./CreateProductForm";

async function NewProductContent() {
  // Verificar que el usuario sea un administrador activo.
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  // Obtener las categorías permitidas desde PostgreSQL.
  const categories = await prisma.category.findMany({
    where: {
      slug: {
        in: [
          "abonos-organicos",
          "herramientas-accesorios",
        ],
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/productos"
          className="text-sm font-semibold text-green-700 hover:underline"
        >
          ← Volver a productos
        </Link>

        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            BioVerde · Administración
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Crear nuevo producto
          </h1>

          <p className="mt-2 text-gray-600">
            Registra fertilizantes y accesorios para el
            catálogo de BioVerde.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Información del producto
          </h2>

          <CreateProductForm categories={categories} />
        </section>

        <p className="mt-5 text-sm text-gray-500">
          Los productos nuevos se registran inicialmente
          como activos. Podrás gestionar su disponibilidad
          desde el panel administrativo.
        </p>
      </div>
    </main>
  );
}

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-green-50">
          <p
            role="status"
            className="text-sm font-medium text-green-800"
          >
            Cargando formulario...
          </p>
        </main>
      }
    >
      <NewProductContent />
    </Suspense>
  );
}
