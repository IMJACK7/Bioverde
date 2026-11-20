
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConfirmOrderButtonProps = {
  orderId: string;
};

type ConfirmOrderResponse = {
  success: boolean;
  data?: {
    id: string;
    status: string;
    confirmedAt: string | null;
  };
  errors?: {
    code: string;
    message: string;
  }[];
};

export default function ConfirmOrderButton({
  orderId,
}: ConfirmOrderButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    if (loading || success) return;

    const accepted = window.confirm(
      "¿Confirmas que este pedido fue acordado con el cliente y deseas descontar sus existencias del inventario?"
    );

    if (!accepted) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/confirm`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result: ConfirmOrderResponse =
        await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.errors?.map((item) => item.message).join(" ") ||
          "No fue posible confirmar el pedido.";

        setError(message);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError(
        "Ocurrió un error de conexión. Verifica el estado del pedido antes de intentarlo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Confirmación del pedido
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        Confirma este pedido únicamente después de verificar
        sus detalles y acordar la compra con el cliente.
        Esta operación descontará las existencias
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
          Pedido confirmado correctamente. Actualizando información...
        </p>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Confirmando pedido..." : "Confirmar pedido"}
        </button>
      )}
    </div>
  );
}
