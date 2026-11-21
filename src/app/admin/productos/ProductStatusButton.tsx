
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductStatusButtonProps {
  productId: string;
  productName: string;
  isActive: boolean;
}

export default function ProductStatusButton({
  productId,
  productName,
  isActive,
}: ProductStatusButtonProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange() {
    if (isSubmitting) {
      return;
    }

    const nextStatus = !isActive;

    const action = nextStatus ? "activar" : "desactivar";

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas ${action} el producto "${productName}"?`
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      const result: {
        message?: string;
        error?: string;
      } = await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "No fue posible cambiar el estado del producto."
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Ocurrió un problema de conexión. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleStatusChange}
        disabled={isSubmitting}
        aria-label={`${
          isActive ? "Desactivar" : "Activar"
        } ${productName}`}
        className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? "border-red-300 text-red-700 hover:bg-red-50"
            : "border-green-700 text-green-800 hover:bg-green-50"
        }`}
      >
        {isSubmitting
          ? "Procesando..."
          : isActive
            ? "Desactivar"
            : "Activar"}
      </button>

      {error && (
        <p
          role="alert"
          className="max-w-48 text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
