
import type {
  AdminProduct,
  AdminProductRepository,
} from "../domain/admin-product.repository";

export class AdminProductStatusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminProductStatusValidationError";
  }
}

export class AdminProductStatusNotFoundError extends Error {
  constructor() {
    super("El producto solicitado no existe.");
    this.name = "AdminProductStatusNotFoundError";
  }
}

export class AdminProductStatusNotAllowedError extends Error {
  constructor(
    message = "Solo se permite activar o desactivar fertilizantes y accesorios."
  ) {
    super(message);
    this.name = "AdminProductStatusNotAllowedError";
  }
}

export class SetAdminProductStatusUseCase {
  constructor(
    private readonly productRepository: AdminProductRepository
  ) {}

  async execute(
    id: string,
    isActive: boolean
  ): Promise<AdminProduct> {
    // 1. Validar el identificador.
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(id)) {
      throw new AdminProductStatusValidationError(
        "El identificador del producto no es válido."
      );
    }

    // 2. Validar el estado solicitado.
    if (typeof isActive !== "boolean") {
      throw new AdminProductStatusValidationError(
        "El estado del producto debe ser verdadero o falso."
      );
    }

    // 3. Consultar el producto.
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AdminProductStatusNotFoundError();
    }

    // 4. Conservar la restricción de tipos.
    if (
      product.type !== "FERTILIZER" &&
      product.type !== "ACCESSORY"
    ) {
      throw new AdminProductStatusNotAllowedError();
    }

    // 5. Proteger los registros archivados.
    if (product.isArchived) {
      throw new AdminProductStatusNotAllowedError(
        "Este producto está archivado y no puede activarse ni desactivarse."
      );
    }

    // 6. Evitar actualizaciones innecesarias.
    if (product.isActive === isActive) {
      return product;
    }

    // 7. Actualizar el estado.
    const updatedProduct =
      await this.productRepository.setActiveStatus(
        id,
        isActive
      );

    if (!updatedProduct) {
      // El repositorio puede rechazar una operación
      // si el producto fue archivado mientras se procesaba.
      const currentProduct =
        await this.productRepository.findById(id);

      if (currentProduct?.isArchived) {
        throw new AdminProductStatusNotAllowedError(
          "Este producto está archivado y no puede cambiar de estado."
        );
      }

      if (!currentProduct) {
        throw new AdminProductStatusNotFoundError();
      }

      throw new AdminProductStatusNotAllowedError(
        "No se permite cambiar el estado de este producto."
      );
    }

    return updatedProduct;
  }
}
