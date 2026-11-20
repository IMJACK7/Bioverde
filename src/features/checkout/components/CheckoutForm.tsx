
"use client";

import { useRef, useState } from "react";
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
  status: string;
  subtotal: number;
  totalItems: number;
  createdAt: string;

  items: {
    name: string;
    variantName: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    components: {
      name: string;
      quantity: number;
    }[];
  }[];
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

type PendingAttempt = {
  fingerprint: string;
  idempotencyKey: string;
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

  /**
   * Conserva la clave durante los reintentos
   * de una misma solicitud.
   */
  const pendingAttemptRef =
    useRef<PendingAttempt | null>(null);

  /**
   * Evita que dos eventos de envío ejecuten
   * solicitudes simultáneas desde este formulario.
   */
  const submittingRef = useRef(false);

  function updateField(
    field: keyof CustomerForm,
    value: string
  ) {
    if (submittingRef.current) return;

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

        // Datos registrados por el servidor.
        items: registeredOrder.items,
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
      submittingRef.current ||
      registeredOrder ||
      !isReady ||
      items.length === 0
    ) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors([]);

    try {
      /**
       * Construir una instantánea de los datos
       * que se enviarán al servidor.
       */
      const orderData = {
        customer: { ...customer },
        items: items.map(toOrderItem),
      };

      /**
       * La huella local solo identifica cambios
       * en el formulario. No reemplaza el hash
       * SHA-256 calculado en el servidor.
       */
      const fingerprint = JSON.stringify(orderData);

      /**
       * Si los datos son idénticos, reutilizar
       * la clave anterior.
       *
       * Si cambiaron, generar una nueva.
       */
      if (
        !pendingAttemptRef.current ||
        pendingAttemptRef.current.fingerprint !==
          fingerprint
      ) {
        pendingAttemptRef.current = {
          fingerprint,
          idempotencyKey: crypto.randomUUID(),
        };
      }

      const idempotencyKey =
        pendingAttemptRef.current.idempotencyKey;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...orderData,
          idempotencyKey,
        }),
      });

      const result =
        (await response.json()) as OrderResponse;

      if (!result.success) {
        const messages =
          result.errors?.map(
            (error) => error.message
          ) ?? [];

        setErrors(
          messages.length > 0
            ? messages
            : ["No fue posible registrar el pedido."]
        );

        return;
      }

      /**
       * El servidor pudo crear el pedido
       * o recuperar uno registrado previamente.
       */
      setRegisteredOrder(result.data);
    } catch {
      /**
       * No sabemos si el servidor alcanzó a
       * registrar el pedido.
       *
       * Por eso NO eliminamos la clave:
       * el próximo intento debe reutilizarla.
       */
      setErrors([
        "No fue posible completar la solicitud. Inténtalo nuevamente sin modificar los datos para recuperar el mismo pedido si ya fue registrado.",
      ]);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <p className="text-sm text-text-secondary">
        Cargando información del carrito...
      </p>
    );
  }

  if (registeredOrder) {
    const isPending =
      registeredOrder.status === "PENDING";

    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-sage bg-primary-light p-6 text-earth"
      >
        <h2 className="text-2xl font-bold">
          Pedido registrado
        </h2>

        <p className="mt-3">
          {isPending
            ? "Tu solicitud fue registrada correctamente. Todavía está pendiente de confirmación."
            : "Hemos recuperado tu pedido registrado. Consulta su estado actual con BioVerde."}
        </p>

        <p className="mt-4 break-all text-sm">
          <strong>Número de pedido:</strong>{" "}
          {registeredOrder.id}
        </p>

        <p className="mt-2">
          <strong>Estado:</strong>{" "}
          {registeredOrder.status}
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
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 font-semibold text-white transition hover:bg-primary-hover"
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

        <p className="mt-4 text-xs text-text-secondary">
          WhatsApp abrirá una conversación con
          un mensaje preparado. Debes enviarlo
          manualmente para contactar a BioVerde.
          {isPending &&
            " El pedido todavía no está confirmado, pagado ni reservado."}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-earth">
        Finalizar pedido
      </h1>

      <p className="mt-2 text-text-secondary">
        Completa tus datos para registrar tu
        solicitud de compra en BioVerde.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
        aria-busy={isSubmitting}
      >
        <div>
          <label
            htmlFor="checkout-name"
            className="mb-2 block font-medium text-earth"
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
            disabled={isSubmitting}
            value={customer.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary transition-colors placeholder:text-text-secondary focus:border-primary focus-visible:outline-primary disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-phone"
            className="mb-2 block font-medium text-earth"
          >
            Teléfono
          </label>

          <input
            id="checkout-phone"
            type="tel"
            required
            maxLength={20}
            autoComplete="tel"
            disabled={isSubmitting}
            value={customer.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary transition-colors placeholder:text-text-secondary focus:border-primary focus-visible:outline-primary disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-municipality"
            className="mb-2 block font-medium text-earth"
          >
            Municipio
          </label>

          <input
            id="checkout-municipality"
            type="text"
            required
            minLength={2}
            maxLength={100}
            disabled={isSubmitting}
            value={customer.municipality}
            onChange={(event) =>
              updateField(
                "municipality",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary transition-colors placeholder:text-text-secondary focus:border-primary focus-visible:outline-primary disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-address"
            className="mb-2 block font-medium text-earth"
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
            disabled={isSubmitting}
            value={customer.deliveryAddress}
            onChange={(event) =>
              updateField(
                "deliveryAddress",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary transition-colors placeholder:text-text-secondary focus:border-primary focus-visible:outline-primary disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-notes"
            className="mb-2 block font-medium text-earth"
          >
            Observaciones (opcional)
          </label>

          <textarea
            id="checkout-notes"
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
            value={customer.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-primary transition-colors placeholder:text-text-secondary focus:border-primary focus-visible:outline-primary disabled:opacity-60"
          />
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-5">
          <p className="text-sm text-text-secondary">
            Total estimado del carrito
          </p>

          <p className="mt-1 text-2xl font-bold text-primary">
            {money(totalPrice)}
          </p>

          <p className="mt-2 text-xs text-text-secondary">
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
          className="w-full rounded-xl bg-primary px-6 py-4 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Registrando pedido..."
            : "Registrar pedido"}
        </button>
      </form>
    </section>
  );
}
