
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InventoryItemType =
  | "PRODUCT"
  | "VARIANT"
  | "COMPONENT";

interface AddInventoryButtonProps {
  itemId: string;
  itemType: InventoryItemType;
  itemName: string;
  currentStock: number;
}

export default function AddInventoryButton({
  itemId,
  itemType,
  itemName,
  currentStock,
}: AddInventoryButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  const parsedQuantity = Number(quantity);

  const isValidQuantity =
    /^\d+$/.test(quantity) &&
    Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= 2_147_483_647 - currentStock;

  const resultingStock = isValidQuantity
    ? currentStock + parsedQuantity
    : currentStock;

  function closeModal() {
    if (isSubmitting) return;

    setIsOpen(false);
    setQuantity("");
    setError(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!isValidQuantity || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/inventory/entries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId,
            itemType,
            quantity: parsedQuantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "No fue posible registrar la entrada."
        );
      }

      setIsOpen(false);
      setQuantity("");

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
      >
        Añadir existencias
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`inventory-title-${itemId}`}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id={`inventory-title-${itemId}`}
              className="text-xl font-bold text-gray-900"
            >
              Registrar entrada de inventario
            </h2>

            <p className="mt-3 text-sm font-medium text-gray-700">
              {itemName}
            </p>

            <div className="mt-5 rounded-xl bg-green-50 p-4">
              <p className="text-sm text-gray-600">
                Existencias actuales
              </p>

              <p className="mt-1 text-2xl font-bold text-green-800">
                {currentStock}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor={`quantity-${itemId}`}
                  className="block text-sm font-semibold text-gray-700"
                >
                  Cantidad que ingresará
                </label>

                <input
                  id={`quantity-${itemId}`}
                  type="number"
                  min="1"
                  max={2_147_483_647 - currentStock}
                  step="1"
                  required
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="Ejemplo: 10"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Existencias después de la entrada
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {resultingStock}
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    !isValidQuantity || isSubmitting
                  }
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Guardando..."
                    : "Confirmar entrada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
