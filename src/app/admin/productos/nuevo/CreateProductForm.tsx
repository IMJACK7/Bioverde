
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductType = "FERTILIZER" | "ACCESSORY";

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface CreateProductFormProps {
  categories: ProductCategory[];
}

function generateSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateProductForm({
  categories,
}: CreateProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>("FERTILIZER");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = categories.filter((category) =>
    type === "FERTILIZER"
      ? category.slug === "abonos-organicos"
      : category.slug === "herramientas-accesorios"
  );

  function handleNameChange(value: string) {
    setName(value);
    setSlug(generateSlug(value));
  }

  function handleTypeChange(value: ProductType) {
    setType(value);
    setCategoryId("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    setError(null);

    if (!categoryId) {
      setError("Debes seleccionar una categoría.");
      return;
    }

    if (price.trim() === "" || stock.trim() === "") {
      setError("Debes indicar el precio y las existencias.");
      return;
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      !Number.isSafeInteger(parsedStock) ||
      parsedStock < 0
    ) {
      setError("Revisa el precio y las existencias ingresadas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          slug,
          description: description.trim() || null,
          type,
          categoryId,
          price: parsedPrice,
          stock: parsedStock,
          imageUrl: imageUrl.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          typeof result.message === "string"
            ? result.message
            : "No fue posible crear el producto."
        );
        return;
      }

      router.push("/admin/productos");
      router.refresh();
    } catch {
      setError(
        "No fue posible conectar con el servidor. Inténtalo nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  const labelClassName =
    "block text-sm font-semibold text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="product-name" className={labelClassName}>
          Nombre del producto *
        </label>

        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(event) =>
            handleNameChange(event.target.value)
          }
          minLength={3}
          maxLength={150}
          required
          className={inputClassName}
          placeholder="Ej. Abono orgánico premium"
        />
      </div>

      <div>
        <label htmlFor="product-slug" className={labelClassName}>
          Slug *
        </label>

        <input
          id="product-slug"
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          minLength={3}
          maxLength={150}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          className={inputClassName}
          placeholder="abono-organico-premium"
        />

        <p className="mt-1 text-xs text-gray-500">
          Se genera automáticamente desde el nombre y
          puedes modificarlo.
        </p>
      </div>

      <div>
        <label
          htmlFor="product-description"
          className={labelClassName}
        >
          Descripción
        </label>

        <textarea
          id="product-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          maxLength={2000}
          rows={4}
          className={inputClassName}
          placeholder="Describe las características del producto."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="product-type" className={labelClassName}>
            Tipo de producto *
          </label>

          <select
            id="product-type"
            value={type}
            onChange={(event) =>
              handleTypeChange(event.target.value as ProductType)
            }
            className={inputClassName}
          >
            <option value="FERTILIZER">Fertilizante</option>
            <option value="ACCESSORY">Accesorio</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="product-category"
            className={labelClassName}
          >
            Categoría *
          </label>

          <select
            id="product-category"
            value={categoryId}
            onChange={(event) =>
              setCategoryId(event.target.value)
            }
            required
            className={inputClassName}
          >
            <option value="">Selecciona una categoría</option>

            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="product-price" className={labelClassName}>
            Precio (COP) *
          </label>

          <input
            id="product-price"
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            min="0.01"
            max="9999999999.99"
            step="0.01"
            required
            className={inputClassName}
            placeholder="25000"
          />
        </div>

        <div>
          <label htmlFor="product-stock" className={labelClassName}>
            Existencias *
          </label>

          <input
            id="product-stock"
            type="number"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            min="0"
            max="2147483647"
            step="1"
            required
            className={inputClassName}
            placeholder="20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="product-image" className={labelClassName}>
          URL de imagen (opcional)
        </label>

        <input
          id="product-image"
          type="url"
          value={imageUrl}
          onChange={(event) =>
            setImageUrl(event.target.value)
          }
          maxLength={2048}
          className={inputClassName}
          placeholder="https://ejemplo.com/producto.jpg"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={isSubmitting || availableCategories.length === 0}
          className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Guardando producto..."
            : "Crear producto"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          disabled={isSubmitting}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
