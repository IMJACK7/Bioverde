
export interface ProductComponent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  quantity: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  components: ProductComponent[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  variants: ProductVariant[];
}

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}
