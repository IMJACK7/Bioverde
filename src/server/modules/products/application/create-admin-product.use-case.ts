
import type {
  AdminProduct,
  AdminProductRepository,
  CreateAdminProductInput,
} from "../domain/admin-product.repository";

import { validateProductCategory } from "./validate-product-category";


export class AdminProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminProductValidationError";
  }
}

export class AdminProductSlugConflictError extends Error {
  constructor() {
    super("Ya existe un producto con este slug.");
    this.name = "AdminProductSlugConflictError";
  }
}

export class CreateAdminProductUseCase {
  constructor(
    private readonly productRepository: AdminProductRepository
  ) {}

  async execute(
    input: CreateAdminProductInput
  ): Promise<AdminProduct> {
    const name = input.name.trim();
    const slug = input.slug.trim().toLowerCase();
    const description = input.description?.trim() || null;
    const imageUrl = input.imageUrl?.trim() || null;
    const categoryId = input.categoryId.trim();

    if (name.length < 3 || name.length > 150) {
      throw new AdminProductValidationError(
        "El nombre debe contener entre 3 y 150 caracteres."
      );
    }

    if (
      slug.length < 3 ||
      slug.length > 150 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      throw new AdminProductValidationError(
        "El slug debe contener entre 3 y 150 caracteres y utilizar letras minúsculas, números o guiones."
      );
    }

    if (
      description !== null &&
      description.length > 2000
    ) {
      throw new AdminProductValidationError(
        "La descripción no puede superar los 2000 caracteres."
      );
    }

    if (
      typeof input.price !== "number" ||
      !Number.isFinite(input.price) ||
      input.price <= 0 ||
      input.price > 9999999999.99 ||
      Math.round(input.price * 100) / 100 !== input.price
    ) {
      throw new AdminProductValidationError(
        "El precio debe ser mayor que cero, tener máximo dos decimales y estar dentro del rango permitido."
      );
    }

    if (
      !Number.isSafeInteger(input.stock) ||
      input.stock < 0 ||
      input.stock > 2147483647
    ) {
      throw new AdminProductValidationError(
        "El stock debe ser un número entero entre 0 y 2147483647."
      );
    }

    if (
      input.type !== "FERTILIZER" &&
      input.type !== "ACCESSORY"
    ) {
      throw new AdminProductValidationError(
        "Solo se pueden crear fertilizantes o accesorios desde este formulario."
      );
    }

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        categoryId
      )
    ) {
      throw new AdminProductValidationError(
        "Debes seleccionar una categoría válida."
      );
    }

    if (imageUrl !== null) {
      if (imageUrl.length > 2048) {
        throw new AdminProductValidationError(
          "La URL de la imagen es demasiado larga."
        );
      }

      try {
        const url = new URL(imageUrl);

        if (
          url.protocol !== "https:" &&
          url.protocol !== "http:"
        ) {
          throw new Error("Protocolo no permitido");
        }
      } catch {
        throw new AdminProductValidationError(
          "La imagen debe tener una URL HTTP o HTTPS válida."
        );
      }
    }

    
            const existingProduct =
            await this.productRepository.findBySlug(slug);

            if (existingProduct) {
            throw new AdminProductSlugConflictError();
            }

            // Comprobar en PostgreSQL que la categoría exista
            // y corresponda al tipo de producto.
            await validateProductCategory(
            input.type,
            categoryId
            );

            return this.productRepository.create({
            name,
            slug,
            description,
            price: input.price,
            stock: input.stock,
            imageUrl,
            type: input.type,
            categoryId,
            });

  }
}
