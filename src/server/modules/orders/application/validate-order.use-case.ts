
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

type ErrorCode = OrderValidationError["code"];

function createError(
  code: ErrorCode,
  message: string
): OrderValidationError {
  return { code, message };
}


const MAX_ITEM_QUANTITY = 100;
const MAX_COMPONENT_QUANTITY = 100;

function isPositiveInteger(
  value: unknown,
  max: number = MAX_ITEM_QUANTITY
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= max
  );
}


function isValidId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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
          createError(
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
    const componentStocks = new Map<string, number>();

    const addDemand = (
      demand: Map<string, number>,
      id: string,
      quantity: number
    ) => {
      const previous = demand.get(id) ?? 0;
      const next = previous + quantity;

      if (!Number.isSafeInteger(next)) {
        errors.push(
          createError(
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
          createError(
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
        if (
          !Array.isArray(item.components) ||
          item.components.length === 0
        ) {
          errors.push(
            createError(
              "INVALID_COMPONENT",
              "El kit personalizado debe incluir componentes."
            )
          );
          continue;
        }

        const validatedComponents: ValidatedOrderComponent[] =
          [];

        let kitPrice = 0;
        let kitIsValid = true;

        const seenComponents = new Set<string>();

        for (const requested of item.components) {
          if (
            !requested ||
            !isValidId(requested.componentId) ||
            !isPositiveInteger(
                requested.quantity,
                MAX_COMPONENT_QUANTITY
                ) ||
            seenComponents.has(requested.componentId)
          ) {
            errors.push(
              createError(
                "INVALID_COMPONENT",
                "El kit contiene componentes duplicados o inválidos."
              )
            );
            kitIsValid = false;
            continue;
          }

          seenComponents.add(requested.componentId);

          const component =
            await this.repository.findComponentById(
              requested.componentId
            );

          if (!component || !component.isActive) {
            errors.push(
              createError(
                "INVALID_COMPONENT",
                "Uno de los componentes seleccionados ya no está disponible."
              )
            );
            kitIsValid = false;
            continue;
          }

          const requiredQuantity =
            requested.quantity * item.quantity;

          if (!Number.isSafeInteger(requiredQuantity)) {
            errors.push(
              createError(
                "INVALID_QUANTITY",
                "La cantidad de componentes solicitada es inválida."
              )
            );
            kitIsValid = false;
            continue;
          }

          kitPrice += component.price * requested.quantity;

          validatedComponents.push({
            componentId: component.id,
            name: component.name,
            quantity: requested.quantity,
            unitPrice: component.price,
          });
        }

        if (!kitIsValid) {
          continue;
        }

        // Acumular demanda únicamente si el kit es válido.
        for (const component of validatedComponents) {
          const requiredQuantity =
            component.quantity * item.quantity;

          addDemand(
            componentDemand,
            component.componentId,
            requiredQuantity
          );
        }

        validatedItems.push({
          type: "CUSTOM_KIT",
          name: "Kit personalizado BioVerde",
          quantity: item.quantity,
          unitPrice: roundMoney(kitPrice),
          subtotal: roundMoney(kitPrice * item.quantity),
          components: validatedComponents,
        });

        continue;
      }

      // -----------------------------------------
      // PRODUCTOS Y KITS PREDISEÑADOS
      // -----------------------------------------
      if (!isValidId(item.productId)) {
        errors.push(
          createError(
            "INVALID_PRODUCT",
            "Uno de los productos no tiene un identificador válido."
          )
        );
        continue;
      }

      const product =
        await this.repository.findProductById(
          item.productId
        );

      if (!product || !product.isActive) {
        errors.push(
          createError(
            "INVALID_PRODUCT",
            "Uno de los productos ya no está disponible."
          )
        );
        continue;
      }
      if (product.hasVariants && !item.variantId) {
  errors.push(
    createError(
      "INVALID_VARIANT",
      `Debes seleccionar una presentación de "${product.name}".`
    )
  );
  continue;
}

      let unitPrice = product.price;
      let variantName: string | undefined;
      let variantId: string | undefined;
      let stock = product.stock;

      let recipeComponents:
        { componentId: string; quantity: number }[] = [];

      if (item.variantId !== undefined) {
        if (!isValidId(item.variantId)) {
          errors.push(
            createError(
              "INVALID_VARIANT",
              "La variante seleccionada es inválida."
            )
          );
          continue;
        }

        const variant =
          await this.repository.findVariantById(
            item.variantId
          );

        if (
          !variant ||
          !variant.isActive ||
          variant.productId !== product.id
        ) {
          errors.push(
            createError(
              "INVALID_VARIANT",
              "La variante seleccionada no está disponible para este producto."
            )
          );
          continue;
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
        errors.push(
          createError(
            "INVALID_ORDER",
            "El tipo de artículo no coincide con el catálogo."
          )
        );
        continue;
      }

      if (isPrebuiltKit && !variantId) {
        errors.push(
          createError(
            "INVALID_VARIANT",
            "Debes seleccionar una variante del kit."
          )
        );
        continue;
      }

      // Clave única de inventario para cada variante.
      const inventoryKey = variantId
        ? `variant:${variantId}`
        : `product:${product.id}`;

      productStocks.set(inventoryKey, stock);

      addDemand(
        productDemand,
        inventoryKey,
        item.quantity
      );

            // Los kits prediseñados están preensamblados.
        // Su receta se consulta para registrar su contenido,
        // pero solo se valida el stock de la variante.
        const validatedRecipe: ValidatedOrderComponent[] = [];
        let recipeIsValid = true;

      if (isPrebuiltKit) {
        if (recipeComponents.length === 0) {
          errors.push(
            createError(
              "INVALID_COMPONENT",
              `El kit "${product.name}" no tiene una receta registrada.`
            )
          );
          continue;
        }

        for (const recipe of recipeComponents) {
          if (!isPositiveInteger(recipe.quantity)) {
            errors.push(
              createError(
                "INVALID_COMPONENT",
                "La receta del kit contiene cantidades inválidas."
              )
            );
            recipeIsValid = false;
            continue;
          }

          const component =
            await this.repository.findComponentById(
              recipe.componentId
            );

          if (!component || !component.isActive) {
            errors.push(
              createError(
                "INVALID_COMPONENT",
                `Un componente del kit "${product.name}" no está disponible.`
              )
            );
            recipeIsValid = false;
            continue;
          }

          validatedRecipe.push({
            componentId: component.id,
            name: component.name,
            quantity: recipe.quantity,
            unitPrice: component.price,
          });
        }

        if (!recipeIsValid) {
          continue;
        }

        // Acumular demanda de componentes únicamente si la receta es válida.
      }

      validatedItems.push({
        type: isPrebuiltKit ? "PREBUILT_KIT" : "PRODUCT",
        productId: product.id,
        variantId,
        name: product.name,
        variantName,
        quantity: item.quantity,
        unitPrice: roundMoney(unitPrice),
        subtotal: roundMoney(unitPrice * item.quantity),
        components: validatedRecipe,
      });
    }

    // -----------------------------------------
    // VERIFICACIÓN DE EXISTENCIAS
    // -----------------------------------------
    for (const [key, required] of productDemand) {
      const available = productStocks.get(key) ?? 0;

      if (required > available) {
        errors.push(
          createError(
            "INSUFFICIENT_STOCK",
            `Las existencias del artículo ${key} no son suficientes.`
          )
        );
      }
    }

    for (const [componentId, required] of componentDemand) {
      const component =
        await this.repository.findComponentById(
          componentId
        );

      if (!component || !component.isActive) {
        errors.push(
          createError(
            "INVALID_COMPONENT",
            "Uno de los componentes ya no está disponible."
          )
        );
        continue;
      }

      componentStocks.set(componentId, component.stock);

      const available = componentStocks.get(componentId) ?? 0;

      if (required > available) {
        errors.push(
          createError(
            "INSUFFICIENT_STOCK",
            `No hay suficientes existencias del componente "${component.name}".`
          )
        );
      }
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
          createError(
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
