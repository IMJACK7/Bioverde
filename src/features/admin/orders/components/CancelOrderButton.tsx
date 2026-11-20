
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CancelOrderButtonProps = {
  orderId: string;
};

export default function CancelOrderButton({
  orderId,
}: CancelOrderButtonProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancelOrder() {
    if (isLoading) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas cancelar este pedido pendiente? Esta acción no se puede deshacer.",
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/cancel`,
        {
          method: "POST",
          credentials: "same-origin",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.errors?.[0]?.message ??
            "No fue posible cancelar el pedido.",
        );
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCancelOrder}
        disabled={isLoading}
        className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Cancelando pedido..." : "Cancelar pedido"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
