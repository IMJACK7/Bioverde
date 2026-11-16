
/**
 * Contratos de consulta para validar pedidos.
 *
 * La capa de dominio no depende de Prisma.
 * La implementación consultará PostgreSQL.
 */

export interface OrderProductRecord {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  isActive: boolean;
  hasVariants: boolean;
}

export interface OrderVariantComponentRecord {
  componentId: string;
  quantity: number;
}

export interface OrderVariantRecord {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;

  recipeComponents: OrderVariantComponentRecord[];
}

export interface OrderComponentRecord {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
}

/**
 * Consultas necesarias para comprobar un pedido.
 */
export interface OrderValidationRepository {
  findProductById(
    productId: string
  ): Promise<OrderProductRecord | null>;

  findVariantById(
    variantId: string
  ): Promise<OrderVariantRecord | null>;

  findComponentById(
    componentId: string
  ): Promise<OrderComponentRecord | null>;
}
