
import Link from "next/link";

import KitBuilder from
  "@/features/kit-builder/components/KitBuilder";

import { PrismaKitComponentRepository } from
  "@/server/modules/kit-components/infrastructure/prisma-kit-component.repository";

import { ListKitComponentsUseCase } from
  "@/server/modules/kit-components/application/list-kit-components.use-case";

export const instant = false;

export default async function BuildYourKitPage() {
  const repository = new PrismaKitComponentRepository();

  const useCase = new ListKitComponentsUseCase(
    repository
  );

  const components = await useCase.execute();

  return (
    <main className="min-h-screen bg-[#f7f9f4] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Ruta de navegación */}
        <nav
          aria-label="Ruta de navegación"
          className="mb-8 text-sm text-gray-600"
        >
          <Link
            href="/"
            className="hover:text-[#52730E]"
          >
            Inicio
          </Link>

          {" / "}

          <Link
            href="/products"
            className="hover:text-[#52730E]"
          >
            Productos
          </Link>

          {" / "}

          <span className="text-gray-900">
            Arma tu Kit
          </span>
        </nav>

        {/* Encabezado */}
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#52730E]">
            Personaliza tu experiencia
          </p>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Arma tu Kit BioVerde
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
            Crea tu propio kit de cultivo seleccionando
            semillas, abonos orgánicos, sustratos,
            macetas y herramientas según tus necesidades.
          </p>
        </header>

        {/* Configurador */}
        {components.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-gray-600">
            Actualmente no hay componentes disponibles
            para personalizar tu kit.
          </div>
        ) : (
          <KitBuilder components={components} />
        )}
      </div>
    </main>
  );
}
