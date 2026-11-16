
import type {
  Product,
  ProductRepository,
} from "../domain/product.repository";

export class GetProductBySlugUseCase {
  constructor(
    private readonly repository: ProductRepository
  ) {}

  async execute(
    slug: string
  ): Promise<Product | null> {
    return this.repository.findBySlug(slug);
  }
}
