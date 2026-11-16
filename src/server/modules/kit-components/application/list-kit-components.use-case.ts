
import type {
  KitComponent,
  KitComponentRepository,
} from "../domain/kit-component.repository";

export class ListKitComponentsUseCase {
  constructor(
    private readonly repository: KitComponentRepository
  ) {}

  async execute(): Promise<KitComponent[]> {
    return this.repository.findAllAvailable();
  }
}
