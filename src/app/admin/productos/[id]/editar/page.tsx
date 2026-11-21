
import "server-only";

import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";

import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

import { PrismaAdminProductRepository } from "@/server/modules/products/infrastructure/prisma-admin-product.repository";

import EditProductForm from "./EditProductForm";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function EditProductContent({
  params,
}: EditProductPageProps) {
  // 1. Verificar la sesión administrativa.
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  // 2. Obtener el identificador del producto.
  const { id } = await params;

  // 3. Consultar el producto existente.
  const repository = new PrismaAdminProductRepository();
  const product = await repository.findById(id);

  if (!product) {
    notFound();
  }

  // 4. Permitir únicamente fertilizantes y accesorios.
  if (
    product.type !== "FERTILIZER" &&
    product.type !== "ACCESSORY"
  ) {
    notFound();
  }

  // 5. Consultar las categorías permitidas.
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

  // 6. Mostrar el formulario con datos existentes.
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Link
          href="/admin/productos"
          className="text-sm font-medium text-green-700 hover:underline"
        >
          ← Volver a productos
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Editar producto
        </h1>

        <p className="mt-2 text-gray-600">
          Actualiza la información del producto seleccionado.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 border-b border-gray-200 pb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {product.name}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Identificador: {product.id}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Categoría actual: {product.categoryName}
          </p>
        </div>

        <EditProductForm
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
            categoryId: product.categoryId,
            type: product.type,
          }}
          categories={categories}
        />
      </section>
    </main>
  );
}

export default function EditProductPage({
  params,
}: EditProductPageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-gray-600">
            Cargando formulario de edición...
          </p>
        </main>
      }
    >
      <EditProductContent params={params} />
    </Suspense>
  );
}
