
import type { Metadata } from "next";
import Link from "next/link";

import CartView from "@/features/cart/components/CartView";

export const metadata: Metadata = {
  title: "Carrito de compras",
  description:
    "Consulta los productos y kits seleccionados en tu carrito de BioVerde.",
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Ruta de navegación"
          className="mb-6 text-sm text-text-secondary"
        >
          <Link
            href="/"
            className="transition-colors hover:text-primary"
          >
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-primary">
            Carrito
          </span>
        </nav>

        <h1 className="text-3xl font-bold text-earth md:text-4xl">
          Tu carrito de compras
        </h1>

        <p className="mb-10 mt-3 text-text-secondary">
          Revisa los productos y kits que deseas adquirir.
        </p>

        <CartView />
      </div>
    </main>
  );
}
