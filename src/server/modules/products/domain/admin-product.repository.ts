
import type { ProductType } from "@/generated/prisma/enums";

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  isArchived: boolean;
  hasVariants: boolean;
  type: ProductType;
  categoryId: string;
  categoryName: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ManageableProductType =
  | "FERTILIZER"
  | "ACCESSORY";

export interface CreateAdminProductInput {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  type: ManageableProductType;
  categoryId: string;
}

export interface UpdateAdminProductInput {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
}

export interface AdminProductRepository {
  findAll(): Promise<AdminProduct[]>;

  findBySlug(
    slug: string
  ): Promise<AdminProduct | null>;

  findById(
    id: string
  ): Promise<AdminProduct | null>;

  create(
    input: CreateAdminProductInput
  ): Promise<AdminProduct>;

  update(
    id: string,
    input: UpdateAdminProductInput
  ): Promise<AdminProduct | null>;

  setActiveStatus(
    id: string,
    isActive: boolean
  ): Promise<AdminProduct | null>;
}
