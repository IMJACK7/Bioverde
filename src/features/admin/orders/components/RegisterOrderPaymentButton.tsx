
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterOrderPaymentButtonProps = {
  orderId: string;
};

type RegisterPaymentResponse = {
  success: boolean;
  data?: {
    id: string;
    status: string;
    paidAt: string | null;
  };
  errors?: {
    code: string;
    message: string;
  }[];
};

export default function RegisterOrderPaymentButton({
  orderId,
}: RegisterOrderPaymentButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegisterPayment() {
    if (loading || success) return;

    const accepted = window.confirm(
      "¿Verificaste que el dinero fue recibido? " +
        "Esta acción marcará el pedido como pagado " +
        "y descontará las existencias del inventario."
    );

    if (!accepted) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/payment`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result: RegisterPaymentResponse =
        await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.errors?.map((item) => item.message).join(" ") ||
          "No fue posible registrar el pago.";

        setError(message);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError(
        "Ocurrió un error de conexión. " +
          "Verifica el estado del pedido antes de intentarlo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Registro de pago
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        Registra el pago únicamente después de comprobar
        que el dinero fue recibido. Esta operación marcará
        el pedido como pagado y descontará las existencias
        correspondientes del inventario.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success ? (
        <p
          role="status"
          className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          Pago registrado correctamente. Actualizando información...
        </p>
      ) : (
        <button
          type="button"
          onClick={handleRegisterPayment}
          disabled={loading}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Registrando pago..." : "Confirmar pago"}
        </button>
      )}
    </div>
  );
}
