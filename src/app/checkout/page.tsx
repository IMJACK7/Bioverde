
import type { Metadata } from "next";

import Link from "next/link";

import CheckoutForm from "@/features/checkout/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Finalizar pedido | BioVerde",
  description:
    "Completa tus datos para registrar tu solicitud de compra en BioVerde.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Navegación */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-700 transition hover:text-green-900"
          >
            <span aria-hidden="true">←</span>
            Volver al carrito
          </Link>
        </div>

        {/* Formulario de compra */}
        <CheckoutForm />

        {/* Información adicional */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            Información importante
          </h2>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Al registrar tu pedido, BioVerde guardará
            tu solicitud para su posterior revisión.
            El registro no representa una compra
            confirmada ni un pago realizado.
          </p>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            La disponibilidad de los productos y las
            condiciones de entrega deberán confirmarse
            antes de completar la compra.
          </p>
        </div>
      </div>
    </main>
  );
}
