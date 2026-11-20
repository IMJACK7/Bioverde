
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
    <main className="min-h-screen bg-background px-5 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Ruta de navegación */}
        <nav
          aria-label="Ruta de navegación"
          className="mb-8 text-sm text-text-secondary"
        >
          <Link
            href="/"
            className="transition-colors hover:text-primary"
          >
            Inicio
          </Link>

          {" / "}

          <Link
            href="/products"
            className="transition-colors hover:text-primary"
          >
            Productos
          </Link>

          {" / "}

          <span className="text-earth">
            Arma tu Kit
          </span>
        </nav>

        {/* Encabezado */}
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Personaliza tu experiencia
          </p>

          <h1 className="mt-3 text-4xl font-bold text-earth">
            Arma tu Kit BioVerde
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-secondary">
            Crea tu propio kit de cultivo seleccionando
            semillas, abonos orgánicos, sustratos,
            macetas y herramientas según tus necesidades.
          </p>
        </header>

        {/* Configurador */}
        {components.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-text-secondary shadow-sm">
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

fetch("http://localhost:3000/api/orders", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.5",
    "content-type": "application/json"
  },
  "referrer": "http://localhost:3000/checkout",
  "body": "{\"customer\":{\"name\":\"Alexander\",\"phone\":\"3146201723\",\"municipality\":\"Anserma \",\"deliveryAddress\":\"Sector la bohemia \",\"notes\":\"\"},\"items\":[{\"type\":\"PREBUILT_KIT\",\"productId\":\"da7c3a90-09e9-4938-a804-099cdc7d02bb\",\"variantId\":\"fa852bb8-1ea4-45d1-a69b-e5c38af0925f\",\"quantity\":4},{\"type\":\"PREBUILT_KIT\",\"productId\":\"34fc56f5-6ae7-48ff-afac-e88a499b0201\",\"variantId\":\"9081bc38-a75c-4977-8da1-1d19e5133966\",\"quantity\":3},{\"type\":\"CUSTOM_KIT\",\"quantity\":1,\"components\":[{\"componentId\":\"efa6e9cb-ea3c-42f4-b040-0853c71146d1\",\"quantity\":1},{\"componentId\":\"2b4b6860-b21c-41e0-bc2d-e3421fb19868\",\"quantity\":1},{\"componentId\":\"fb37fd46-6525-4466-b467-3f3b8904baad\",\"quantity\":1},{\"componentId\":\"96f65629-464f-4e13-b359-789bb2bcca47\",\"quantity\":1}]}],\"idempotencyKey\":\"61675b9d-582f-4ad0-8d4d-efd3196de2f8\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "omit"
});