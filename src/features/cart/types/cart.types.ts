
export type CartItemType =
  | "PRODUCT"
  | "PREBUILT_KIT"
  | "CUSTOM_KIT";

export interface CustomKitComponent {
  componentId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CartItem {
  id: string;
  type: CartItemType;

  productId?: string;
  variantId?: string;

  name: string;
  variantName?: string;

  imageUrl?: string | null;

  unitPrice: number;
  quantity: number;

  // Existencias conocidas al agregar el artículo.
  // No representa una reserva de inventario.
  maxStock?: number;

  components?: CustomKitComponent[];
}
