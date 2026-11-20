
import type {
  OrderValidationRepository,
} from "../domain/order-validation.repository";

import type {
  OrderItemInput,
  OrderValidationError,
  OrderValidationResult,
  ValidatedOrderItem,
  ValidatedOrderComponent,
} from "../domain/order.types";

import {
  createOrderValidationError,
  isPositiveInteger,
  roundMoney,
} from "../utils/order-validation.helpers";

import { validateCustomKit } from "../validation/custom-kit.validation";
import { validateCatalogItem } from "../validation/catalog-item.validation";
import { validateKitRecipe } from "../validation/kit-recipe.validation";
import { validateStock } from "../validation/stock.validation";

  /**
   * Valida un carrito utilizando información
   * consultada desde PostgreSQL.
   *
   * No registra pedidos ni modifica inventario.
   */
  export class ValidateOrderUseCase {
    constructor(
      private readonly repository: OrderValidationRepository
    ) {}

    async execute(
      items: OrderItemInput[]
    ): Promise<OrderValidationResult> {
      if (!Array.isArray(items) || items.length === 0) {
        return {
          success: false,
          errors: [
            createOrderValidationError(
              "EMPTY_CART",
              "Debes agregar al menos un producto al carrito."
            ),
          ],
        };
      }

      const errors: OrderValidationError[] = [];
      const validatedItems: ValidatedOrderItem[] = [];

      // Demanda acumulada por producto o variante.
      const productDemand = new Map<string, number>();

      // Demanda acumulada de componentes compartidos.
      const componentDemand = new Map<string, number>();

      // Existencias consultadas desde PostgreSQL.
      const productStocks = new Map<string, number>();

      const addDemand = (
        demand: Map<string, number>,
        id: string,
        quantity: number
      ) => {
        const previous = demand.get(id) ?? 0;
        const next = previous + quantity;

        if (!Number.isSafeInteger(next)) {
          errors.push(
            createOrderValidationError(
              "INVALID_QUANTITY",
              "La cantidad solicitada supera el límite permitido."
            )
          );
          return;
        }

        demand.set(id, next);
      };

      for (const item of items) {
        if (
          !item ||
          !isPositiveInteger(item.quantity) ||
          !["PRODUCT", "PREBUILT_KIT", "CUSTOM_KIT"].includes(
            item.type
          )
        ) {
          errors.push(
            createOrderValidationError(
              "INVALID_ORDER",
              "El carrito contiene un artículo inválido."
            )
          );
          continue;
        }

        // -----------------------------------------
        // KITS PERSONALIZADOS
        // -----------------------------------------
       
if (item.type === "CUSTOM_KIT") {
  const result = await validateCustomKit(
    item,
    this.repository
  );

  if (!result.success) {
    errors.push(...result.errors);
    continue;
  }

  // Acumular la demanda de componentes
  // de todos los kits personalizados.
  for (const [componentId, quantity] of result.componentDemand) {
    addDemand(
      componentDemand,
      componentId,
      quantity
    );
  }

  validatedItems.push(result.item);

  continue;
}
        // -----------------------------------------
        // PRODUCTOS Y KITS PREDISEÑADOS
        // -----------------------------------------
       
                        
        const catalogResult = await validateCatalogItem(
          item,
          this.repository
        );

        if (!catalogResult.success) {
          errors.push(...catalogResult.errors);
          continue;
        }

        const catalogItem = catalogResult.data;

        const {
          productId,
          variantId,
          name,
          variantName,
          type,
          quantity,
          unitPrice,
          stock,
          inventoryKey,
          recipeComponents,
        } = catalogItem;

        // La receta solo se valida para kits prediseñados.
        // Estos kits están preensamblados, por lo que
        // utilizan el stock de su variante.
        let validatedRecipe: ValidatedOrderComponent[] = [];

        if (type === "PREBUILT_KIT") {
          const recipeResult = await validateKitRecipe(
            name,
            recipeComponents,
            this.repository
          );

          if (!recipeResult.success) {
            errors.push(...recipeResult.errors);
            continue;
          }

          validatedRecipe = recipeResult.components;
        }

        // El artículo ya pasó todas sus validaciones.
        // Solo ahora acumulamos su demanda.
        productStocks.set(inventoryKey, stock);

        addDemand(
          productDemand,
          inventoryKey,
          quantity
        );

        validatedItems.push({
          type,
          productId,
          variantId,
          name,
          variantName,
          quantity,
          unitPrice: roundMoney(unitPrice),
          subtotal: roundMoney(unitPrice * quantity),
          components: validatedRecipe,
        });

      }
      // -----------------------------------------
      // VERIFICACIÓN DE EXISTENCIAS
      // -----------------------------------------
      const stockResult = await validateStock(
        {
          productDemand,
          productStocks,
          componentDemand,
        },
        this.repository
      );

      if (!stockResult.success) {
        errors.push(...stockResult.errors);
      }

      if (errors.length > 0) {
        return {
          success: false,
          errors,
        };
      }

      const subtotal = roundMoney(
        validatedItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        )
      );

      if (!Number.isFinite(subtotal) || subtotal < 0) {
        return {
          success: false,
          errors: [
            createOrderValidationError(
              "INVALID_ORDER",
              "No fue posible calcular el total del pedido."
            ),
          ],
        };
      }

      return {
        success: true,
        data: {
          items: validatedItems,
          subtotal,
          totalItems: validatedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
        },
      };
    }
  }
