
import type {
  OrderValidationRepository,
  OrderVariantComponentRecord,
} from "../domain/order-validation.repository";

import type {
  OrderItemInput,
  OrderValidationError,
} from "../domain/order.types";

import {
  createOrderValidationError,
  isValidId,
} from "../utils/order-validation.helpers";

/**
 * Datos del producto o variante
 * validados contra el catálogo.
 *
 * Todavía no incluye la validación
 * de recetas ni existencias acumuladas.
 */
export interface ValidatedCatalogItem {
  productId: string;
  variantId?: string;

  name: string;
  variantName?: string;

  type: "PRODUCT" | "PREBUILT_KIT";

  quantity: number;
  unitPrice: number;

  stock: number;
  inventoryKey: string;

  recipeComponents: OrderVariantComponentRecord[];
}

export type CatalogItemValidationResult =
  | {
      success: true;
      data: ValidatedCatalogItem;
    }
  | {
      success: false;
      errors: OrderValidationError[];
    };

/**
 * Valida productos y kits prediseñados
 * utilizando información del catálogo.
 *
 * No modifica inventario.
 * No registra pedidos.
 */
export async function validateCatalogItem(
  item: OrderItemInput,
  repository: OrderValidationRepository
): Promise<CatalogItemValidationResult> {
  if (
    item.type !== "PRODUCT" &&
    item.type !== "PREBUILT_KIT"
  ) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_ORDER",
          "El artículo no corresponde a un producto del catálogo."
        ),
      ],
    };
  }

  if (!isValidId(item.productId)) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_PRODUCT",
          "Uno de los productos no tiene un identificador válido."
        ),
      ],
    };
  }

  const product = await repository.findProductById(
    item.productId
  );

  if (!product || !product.isActive) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_PRODUCT",
          "Uno de los productos ya no está disponible."
        ),
      ],
    };
  }

  if (product.hasVariants && !item.variantId) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_VARIANT",
          `Debes seleccionar una presentación de "${product.name}".`
        ),
      ],
    };
  }

  let unitPrice = product.price;
  let variantName: string | undefined;
  let variantId: string | undefined;
  let stock = product.stock;

  let recipeComponents: OrderVariantComponentRecord[] = [];

  if (item.variantId !== undefined) {
    if (!isValidId(item.variantId)) {
      return {
        success: false,
        errors: [
          createOrderValidationError(
            "INVALID_VARIANT",
            "La variante seleccionada es inválida."
          ),
        ],
      };
    }

    const variant = await repository.findVariantById(
      item.variantId
    );

    if (
      !variant ||
      !variant.isActive ||
      variant.productId !== product.id
    ) {
      return {
        success: false,
        errors: [
          createOrderValidationError(
            "INVALID_VARIANT",
            "La variante seleccionada no está disponible para este producto."
          ),
        ],
      };
    }

    unitPrice = variant.price;
    variantName = variant.name;
    variantId = variant.id;
    stock = variant.stock;
    recipeComponents = variant.recipeComponents;
  }

  const isPrebuiltKit =
    product.type === "PREBUILT_KIT";

  if (
    (item.type === "PREBUILT_KIT") !== isPrebuiltKit
  ) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_ORDER",
          "El tipo de artículo no coincide con el catálogo."
        ),
      ],
    };
  }

  if (isPrebuiltKit && !variantId) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_VARIANT",
          "Debes seleccionar una variante del kit."
        ),
      ],
    };
  }

  const inventoryKey = variantId
    ? `variant:${variantId}`
    : `product:${product.id}`;

  return {
    success: true,
    data: {
      productId: product.id,
      variantId,
      name: product.name,
      variantName,
      type: isPrebuiltKit
        ? "PREBUILT_KIT"
        : "PRODUCT",
      quantity: item.quantity,
      unitPrice,
      stock,
      inventoryKey,
      recipeComponents,
    },
  };
}
