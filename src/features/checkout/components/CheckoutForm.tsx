
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { useCart } from "@/features/cart/context/CartContext";
import type { CartItem } from "@/features/cart/types/cart.types";

import { createOrderWhatsAppUrl } from "@/features/checkout/lib/whatsapp";

type CustomerForm = {
  name: string;
  phone: string;
  municipality: string;
  deliveryAddress: string;
  notes: string;
};

type RegisteredOrder = {
  id: string;
  status: "PENDING";
  subtotal: number;
  totalItems: number;
  createdAt: string;
};

type OrderResponse =
  | {
      success: true;
      data: RegisteredOrder;
    }
  | {
      success: false;
      errors: Array<{
        code: string;
        message: string;
      }>;
    };

const initialCustomer: CustomerForm = {
  name: "",
  phone: "",
  municipality: "",
  deliveryAddress: "",
  notes: "",
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

function toOrderItem(item: CartItem) {
  if (item.type === "CUSTOM_KIT") {
    return {
      type: "CUSTOM_KIT" as const,
      quantity: item.quantity,
      components: (item.components ?? []).map(
        (component) => ({
          componentId: component.componentId,
          quantity: component.quantity,
        })
      ),
    };
  }

  return {
    type: item.type,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  };
}

export default function CheckoutForm() {
  const { items, totalPrice, isReady } = useCart();

  const [customer, setCustomer] =
    useState<CustomerForm>(initialCustomer);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errors, setErrors] = useState<string[]>([]);

  const [registeredOrder, setRegisteredOrder] =
    useState<RegisteredOrder | null>(null);

  const [whatsAppError, setWhatsAppError] =
    useState<string | null>(null);

  function updateField(
    field: keyof CustomerForm,
    value: string
  ) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleWhatsApp() {
    if (!registeredOrder) return;

    try {
      setWhatsAppError(null);

      const url = createOrderWhatsAppUrl({
        orderId: registeredOrder.id,
        customerName: customer.name.trim(),
        municipality: customer.municipality.trim(),
        total: registeredOrder.subtotal,
      });

      window.location.assign(url);
    } catch {
      setWhatsAppError(
        "No fue posible abrir WhatsApp. Verifica la configuración del número de contacto."
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      isSubmitting ||
      registeredOrder ||
      !isReady ||
      items.length === 0
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          items: items.map(toOrderItem),
        }),
      });

      const result =
        (await response.json()) as OrderResponse;

      if (!result.success) {
        setErrors(
          result.errors?.map((error) => error.message) ??
            ["No fue posible registrar el pedido."]
        );
        return;
      }

      setRegisteredOrder(result.data);
    } catch {
      setErrors([
        "No fue posible conectar con el servidor. Inténtalo nuevamente.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <p className="text-sm text-neutral-500">
        Cargando información del carrito...
      </p>
    );
  }

  if (registeredOrder) {
    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-950"
      >
        <h2 className="text-2xl font-bold">
          Pedido registrado
        </h2>

        <p className="mt-3">
          Tu solicitud fue registrada correctamente.
          Todavía está pendiente de confirmación.
        </p>

        <p className="mt-4 break-all text-sm">
          <strong>Número de pedido:</strong>{" "}
          {registeredOrder.id}
        </p>

        <p className="mt-2">
          <strong>Total:</strong>{" "}
          {money(registeredOrder.subtotal)}
        </p>

        <p className="mt-4 text-sm">
          Para continuar, comunícate con BioVerde
          mediante WhatsApp e indica tu número de pedido.
        </p>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-green-700 px-6 py-4 font-semibold text-white transition hover:bg-green-800"
        >
          Continuar por WhatsApp
        </button>

        {whatsAppError && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-700"
          >
            {whatsAppError}
          </p>
        )}

        <p className="mt-4 text-xs text-green-900">
          WhatsApp abrirá una conversación con
          un mensaje preparado. Debes enviarlo
          manualmente para contactar a BioVerde.
          El pedido todavía no está confirmado,
          pagado ni reservado.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">
        Finalizar pedido
      </h1>

      <p className="mt-2 text-neutral-600">
        Completa tus datos para registrar tu
        solicitud de compra en BioVerde.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
      >
        <div>
          <label
            htmlFor="checkout-name"
            className="mb-2 block font-medium"
          >
            Nombre completo
          </label>

          <input
            id="checkout-name"
            type="text"
            required
            minLength={3}
            maxLength={120}
            autoComplete="name"
            value={customer.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-phone"
            className="mb-2 block font-medium"
          >
            Teléfono
          </label>

          <input
            id="checkout-phone"
            type="tel"
            required
            maxLength={20}
            autoComplete="tel"
            value={customer.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-municipality"
            className="mb-2 block font-medium"
          >
            Municipio
          </label>

          <input
            id="checkout-municipality"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={customer.municipality}
            onChange={(event) =>
              updateField(
                "municipality",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-address"
            className="mb-2 block font-medium"
          >
            Dirección de entrega
          </label>

          <input
            id="checkout-address"
            type="text"
            required
            minLength={5}
            maxLength={200}
            autoComplete="street-address"
            value={customer.deliveryAddress}
            onChange={(event) =>
              updateField(
                "deliveryAddress",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-notes"
            className="mb-2 block font-medium"
          >
            Observaciones (opcional)
          </label>

          <textarea
            id="checkout-notes"
            rows={4}
            maxLength={500}
            value={customer.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            className="w-full rounded-xl border border-neutral-300 px-4 py-3"
          />
        </div>

        <div className="rounded-xl bg-neutral-100 p-5">
          <p className="text-sm text-neutral-600">
            Total estimado del carrito
          </p>

          <p className="mt-1 text-2xl font-bold">
            {money(totalPrice)}
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            El servidor verificará los precios y
            las existencias antes de registrar
            el pedido.
          </p>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            <p className="font-semibold">
              No se pudo registrar el pedido:
            </p>

            <ul className="mt-2 list-disc pl-5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isSubmitting || items.length === 0
          }
          className="w-full rounded-xl bg-green-700 px-6 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Registrando pedido..."
            : "Registrar pedido"}
        </button>
      </form>
    </section>
  );
}
