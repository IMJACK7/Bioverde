
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CompleteOrderButtonProps = {
  orderId: string;
};

export default function CompleteOrderButton({
  orderId,
}: CompleteOrderButtonProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompleteOrder() {
    if (isLoading) return;

    const confirmed = window.confirm(
      "¿Confirmas que este pedido ya fue entregado al cliente? " +
        "Esta acción marcará el pedido como completado."
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/complete`,
        {
          method: "POST",
          credentials: "same-origin",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.errors?.[0]?.message ??
          "No fue posible completar el pedido.";

        throw new Error(message);
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCompleteOrder}
        disabled={isLoading}
        className="
          rounded-lg
          bg-blue-600
          px-5
          py-3
          font-semibold
          text-white
          transition-colors
          hover:bg-blue-700
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {isLoading
          ? "Completando pedido..."
          : "Marcar como entregado"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
