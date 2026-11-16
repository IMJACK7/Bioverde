
import type {
  Product,
  ProductRepository,
} from "../domain/product.repository";

export class ListProductsUseCase {
  constructor(
    private readonly repository: ProductRepository
  ) {}

  async execute(): Promise<Product[]> {
    return this.repository.findAll();
  }
}
