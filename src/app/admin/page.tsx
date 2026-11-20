
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { signOut } from "@/auth";
import { requireActiveAdmin } from "@/server/modules/auth/require-active-admin";

const adminSections = [
  {
    title: "Pedidos",
    description: "Consultar y gestionar los pedidos recibidos.",
    href: "/admin/pedidos",
    available: true,
  },
  {
    title: "Inventario",
    description: "Administrar existencias y disponibilidad.",
    href: "/admin/inventario",
    available: false,
  },
  {
    title: "Productos",
    description: "Gestionar el catálogo de BioVerde.",
    href: "/admin/productos",
    available: false,
  },
] as const;

async function logout() {
  "use server";

  await signOut({
    redirectTo: "/admin/login",
  });
}

async function AdminContent() {
  const administrator = await requireActiveAdmin();

  if (!administrator) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-green-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            BioVerde
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Panel de administración
          </h1>

          <p className="mt-2 text-gray-600">
            Bienvenido, {administrator.name}.
          </p>

          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <section className="rounded-2xl border border-green-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Acceso autorizado
          </h2>

          <p className="mt-3 text-gray-600">
            Has iniciado sesión como administrador de BioVerde.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Cuenta: {administrator.email}
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {adminSections.map((section) => (
            <article
              key={section.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900">
                {section.title}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                {section.description}
              </p>

              {section.available ? (
                <Link
                  href={section.href}
                  className="mt-5 inline-block text-sm font-semibold text-green-700 hover:underline"
                >
                  Administrar
                </Link>
              ) : (
                <span className="mt-5 inline-block text-xs font-medium text-amber-700">
                  Próximamente
                </span>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-green-50">
          <p role="status" className="text-sm font-medium text-green-800">
            Verificando acceso administrativo...
          </p>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
