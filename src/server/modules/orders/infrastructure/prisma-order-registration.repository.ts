
import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

import type {
  ExistingOrder,
  OrderRegistrationData,
  OrderRegistrationRepository,
  OrderRegistrationResult,
  RegisteredOrder,
} from "../domain/order-registration.types";

import { OrderIdempotencyConflictError } from "../domain/order-registration.types";

/**
 * Campos recuperados de un pedido.
 */
const registeredOrderSelect = {
  id: true,
  status: true,
  subtotal: true,
  createdAt: true,
  requestHash: true,

  items: {
    select: {
      name: true,
      variantName: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,

      components: {
        select: {
          name: true,
          quantity: true,
        },
      },
    },
  },
} as const;

type SelectedOrder = Prisma.OrderGetPayload<{
  select: typeof registeredOrderSelect;
}>;

/**
 * Convierte el resultado de Prisma
 * al contrato de la aplicación.
 */
function mapRegisteredOrder(
  order: SelectedOrder
): RegisteredOrder {
  const items = order.items.map((item) => ({
    name: item.name,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),

    components: item.components.map((component) => ({
      name: component.name,
      quantity: component.quantity,
    })),
  }));

  return {
    id: order.id,
    status: order.status,
    subtotal: Number(order.subtotal),

    totalItems: items.reduce(
      (total, item) => total + item.quantity,
      0
    ),

    createdAt: order.createdAt,
    items,
  };
}

/**
 * Repositorio de pedidos de BioVerde.
 *
 * Los pedidos PENDING no reservan ni
 * descuentan existencias del inventario.
 */
export class PrismaOrderRegistrationRepository
  implements OrderRegistrationRepository
{
  /**
   * Recupera un pedido mediante su clave única.
   */
  async findByIdempotencyKey(
    key: string
  ): Promise<ExistingOrder | null> {
    const existingOrder = await prisma.order.findUnique({
      where: {
        idempotencyKey: key,
      },
      select: registeredOrderSelect,
    });

    if (!existingOrder) {
      return null;
    }

    return {
      requestHash: existingOrder.requestHash,
      order: mapRegisteredOrder(existingOrder),
    };
  }

  /**
   * Registra un pedido y sus artículos.
   *
   * Devuelve reused = false cuando crea
   * un pedido nuevo.
   *
   * Devuelve reused = true cuando recupera
   * uno existente después de un conflicto.
   */
  async create(
    data: OrderRegistrationData
  ): Promise<OrderRegistrationResult> {
    try {
      const createdOrder = await prisma.order.create({
        data: {
          idempotencyKey: data.idempotencyKey,
          requestHash: data.requestHash,

          customerName: data.customer.name,
          customerPhone: data.customer.phone,
          municipality: data.customer.municipality,
          deliveryAddress: data.customer.deliveryAddress,
          notes: data.customer.notes ?? null,

          subtotal: data.order.subtotal,
          status: "PENDING",

          items: {
            create: data.order.items.map((item) => ({
              productId: item.productId ?? null,
              variantId: item.variantId ?? null,
              type: item.type,
              name: item.name,
              variantName: item.variantName ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,

              components: {
                create: item.components.map(
                  (component) => ({
                    componentId: component.componentId,
                    name: component.name,
                    quantity: component.quantity,
                    unitPrice: component.unitPrice,
                  })
                ),
              },
            })),
          },
        },

        select: registeredOrderSelect,
      });

      // Prisma creó el pedido correctamente.
      return {
        order: mapRegisteredOrder(createdOrder),
        reused: false,
      };
    } catch (error) {
      /**
       * P2002: violación de una restricción UNIQUE.
       *
       * Puede ocurrir cuando dos solicitudes
       * intentan registrar simultáneamente
       * la misma clave de idempotencia.
       */
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingOrder =
          await this.findByIdempotencyKey(
            data.idempotencyKey
          );

        if (existingOrder) {
          // Misma clave y misma huella:
          // recuperar el pedido original.
          if (
            existingOrder.requestHash ===
            data.requestHash
          ) {
            return {
              order: existingOrder.order,
              reused: true,
            };
          }

          // Misma clave con datos diferentes.
          throw new OrderIdempotencyConflictError();
        }
      }

      // No ocultar errores inesperados.
      throw error;
    }
  }
}
