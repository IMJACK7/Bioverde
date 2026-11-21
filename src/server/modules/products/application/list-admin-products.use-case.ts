
import type {
  AdminProduct,
  AdminProductRepository,
} from "../domain/admin-product.repository";

export class ListAdminProductsUseCase {
  constructor(
    private readonly productRepository: AdminProductRepository
  ) {}

  async execute(): Promise<AdminProduct[]> {
    return this.productRepository.findAll();
  }
}
