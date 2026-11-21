
import type {
  AdminProduct,
  AdminProductRepository,
  UpdateAdminProductInput,
} from "../domain/admin-product.repository";

import { validateProductCategory } from "./validate-product-category";


export class AdminProductUpdateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminProductUpdateValidationError";
  }
}

export class AdminProductNotFoundError extends Error {
  constructor() {
    super("El producto solicitado no existe.");
    this.name = "AdminProductNotFoundError";
  }
}

export class AdminProductNotEditableError extends Error {
  constructor() {
    super(
      "Solo se pueden editar fertilizantes y accesorios desde este módulo."
    );
    this.name = "AdminProductNotEditableError";
  }
}

export class UpdateAdminProductUseCase {
  constructor(
    private readonly productRepository: AdminProductRepository
  ) {}

  async execute(
    id: string,
    input: UpdateAdminProductInput
  ): Promise<AdminProduct> {
    // 1. Validar el identificador.
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(id)) {
      throw new AdminProductUpdateValidationError(
        "El identificador del producto no es válido."
      );
    }

    // 2. Consultar el producto existente.
    const existingProduct =
      await this.productRepository.findById(id);

    if (!existingProduct) {
      throw new AdminProductNotFoundError();
    }

    // 3. Restringir la edición a productos independientes.
    if (
      existingProduct.type !== "FERTILIZER" &&
      existingProduct.type !== "ACCESSORY"
    ) {
      throw new AdminProductNotEditableError();
    }

    // 4. Normalizar los datos.
    const name = input.name.trim();
    const description = input.description?.trim() || null;
    const imageUrl = input.imageUrl?.trim() || null;
    const categoryId = input.categoryId.trim();

    // 5. Validar nombre.
    if (name.length < 3 || name.length > 150) {
      throw new AdminProductUpdateValidationError(
        "El nombre debe contener entre 3 y 150 caracteres."
      );
    }

    // 6. Validar descripción.
    if (
      description !== null &&
      description.length > 2000
    ) {
      throw new AdminProductUpdateValidationError(
        "La descripción no puede superar los 2000 caracteres."
      );
    }

    // 7. Validar precio.
    if (
      typeof input.price !== "number" ||
      !Number.isFinite(input.price) ||
      input.price <= 0 ||
      input.price > 9999999999.99 ||
      Math.round(input.price * 100) / 100 !== input.price
    ) {
      throw new AdminProductUpdateValidationError(
        "El precio debe ser mayor que cero, tener máximo dos decimales y estar dentro del rango permitido."
      );
    }

    // 8. Validar existencias.
    if (
      !Number.isSafeInteger(input.stock) ||
      input.stock < 0 ||
      input.stock > 2147483647
    ) {
      throw new AdminProductUpdateValidationError(
        "El stock debe ser un número entero no negativo dentro del rango permitido."
      );
    }

    // 9. Validar categoría.
    if (!uuidPattern.test(categoryId)) {
      throw new AdminProductUpdateValidationError(
        "Debes seleccionar una categoría válida."
      );
    }

    // 10. Validar URL de imagen.
    if (imageUrl !== null) {
      if (imageUrl.length > 2048) {
        throw new AdminProductUpdateValidationError(
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
        throw new AdminProductUpdateValidationError(
          "La imagen debe tener una URL HTTP o HTTPS válida."
        );
      }
    }
    
        // 11. Comprobar que la categoría exista y corresponda
        // al tipo original del producto.
        await validateProductCategory(
        existingProduct.type,
        categoryId
        );

    // 11.1 Actualizar el producto.
    const updatedProduct =
      await this.productRepository.update(id, {
        name,
        description,
        price: input.price,
        stock: input.stock,
        imageUrl,
        categoryId,
      });

    if (!updatedProduct) {
      throw new AdminProductNotFoundError();
    }

    return updatedProduct;
  }
}
