
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface EditableProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  type: "FERTILIZER" | "ACCESSORY";
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface EditProductFormProps {
  product: EditableProduct;
  categories: ProductCategory[];
}

export default function EditProductForm({
  product,
  categories,
}: EditProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(
    product.description ?? ""
  );
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [imageUrl, setImageUrl] = useState(
    product.imageUrl ?? ""
  );
  const [categoryId, setCategoryId] = useState(
    product.categoryId
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedCategorySlug =
    product.type === "FERTILIZER"
      ? "abonos-organicos"
      : "herramientas-accesorios";

  const allowedCategories = categories.filter(
    (category) => category.slug === allowedCategorySlug
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !price.trim() ||
      !stock.trim() ||
      !Number.isFinite(parsedPrice) ||
      !Number.isSafeInteger(parsedStock)
    ) {
      setError("Ingresa un precio y unas existencias válidas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: description || null,
            price: parsedPrice,
            stock: parsedStock,
            imageUrl: imageUrl || null,
            categoryId,
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
            "No fue posible actualizar el producto."
        );
        return;
      }

      router.push("/admin/productos");
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="edit-product-name"
          className="mb-2 block text-sm font-medium text-gray-800"
        >
          Nombre del producto
        </label>

        <input
          id="edit-product-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={3}
          maxLength={150}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
        />
      </div>

      <div>
        <label
          htmlFor="edit-product-description"
          className="mb-2 block text-sm font-medium text-gray-800"
        >
          Descripción
        </label>

        <textarea
          id="edit-product-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          maxLength={2000}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="edit-product-price"
            className="mb-2 block text-sm font-medium text-gray-800"
          >
            Precio (COP)
          </label>

          <input
            id="edit-product-price"
            type="number"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            value={price}
            onChange={(event) =>
              setPrice(event.target.value)
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="edit-product-stock"
            className="mb-2 block text-sm font-medium text-gray-800"
          >
            Existencias
          </label>

          <input
            id="edit-product-stock"
            type="number"
            min="0"
            max="2147483647"
            step="1"
            value={stock}
            onChange={(event) =>
              setStock(event.target.value)
            }
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="edit-product-category"
          className="mb-2 block text-sm font-medium text-gray-800"
        >
          Categoría
        </label>

        <select
          id="edit-product-category"
          value={categoryId}
          onChange={(event) =>
            setCategoryId(event.target.value)
          }
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
        >
          {allowedCategories.length === 0 && (
            <option value="">
              No hay categorías disponibles
            </option>
          )}

          {allowedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="edit-product-image"
          className="mb-2 block text-sm font-medium text-gray-800"
        >
          URL de imagen (opcional)
        </label>

        <input
          id="edit-product-image"
          type="url"
          value={imageUrl}
          onChange={(event) =>
            setImageUrl(event.target.value)
          }
          placeholder="https://ejemplo.com/imagen.jpg"
          maxLength={2048}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
        />
      </div>

      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <p>
          <strong>Slug:</strong> {product.slug}
        </p>
        <p className="mt-1">
          <strong>Tipo:</strong>{" "}
          {product.type === "FERTILIZER"
            ? "Abono o fertilizante"
            : "Herramienta o accesorio"}
        </p>
        <p className="mt-2 text-xs">
          El slug y el tipo de producto no se modifican
          desde este formulario.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            isSubmitting || allowedCategories.length === 0
          }
          className="rounded-lg bg-green-800 px-6 py-3 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Guardando cambios..."
            : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          disabled={isSubmitting}
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
