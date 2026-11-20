
import type {
  OrderValidationRepository,
  OrderVariantComponentRecord,
} from "../domain/order-validation.repository";

import type {
  OrderValidationError,
  ValidatedOrderComponent,
} from "../domain/order.types";

import {
  createOrderValidationError,
  isPositiveInteger,
} from "../utils/order-validation.helpers";

/**
 * Resultado de validar la receta
 * de un kit prediseñado.
 */
export type KitRecipeValidationResult =
  | {
      success: true;
      components: ValidatedOrderComponent[];
    }
  | {
      success: false;
      errors: OrderValidationError[];
    };

/**
 * Valida los componentes que conforman
 * un kit prediseñado.
 *
 * Los kits prediseñados se consideran
 * productos preensamblados.
 *
 * Por lo tanto:
 * - Se valida su receta.
 * - Se consulta la información de los componentes.
 * - No se descuenta inventario.
 * - No se acumula demanda de componentes.
 *
 * El inventario disponible del kit se
 * controla mediante ProductVariant.stock.
 */
export async function validateKitRecipe(
  kitName: string,
  recipeComponents: OrderVariantComponentRecord[],
  repository: OrderValidationRepository
): Promise<KitRecipeValidationResult> {
  if (
    !Array.isArray(recipeComponents) ||
    recipeComponents.length === 0
  ) {
    return {
      success: false,
      errors: [
        createOrderValidationError(
          "INVALID_COMPONENT",
          `El kit "${kitName}" no tiene una receta registrada.`
        ),
      ],
    };
  }

  const errors: OrderValidationError[] = [];
  const validatedComponents: ValidatedOrderComponent[] = [];

  for (const recipe of recipeComponents) {
    if (
      !recipe ||
      !isPositiveInteger(recipe.quantity)
    ) {
      errors.push(
        createOrderValidationError(
          "INVALID_COMPONENT",
          "La receta del kit contiene cantidades inválidas."
        )
      );

      continue;
    }

    const component =
      await repository.findComponentById(
        recipe.componentId
      );

    if (!component || !component.isActive) {
      errors.push(
        createOrderValidationError(
          "INVALID_COMPONENT",
          `Un componente del kit "${kitName}" no está disponible.`
        )
      );

      continue;
    }

    validatedComponents.push({
      componentId: component.id,
      name: component.name,
      quantity: recipe.quantity,
      unitPrice: component.price,
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    components: validatedComponents,
  };
}
