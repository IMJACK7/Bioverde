
import type {
  AddInventoryInput,
  InventoryEntryResult,
  InventoryRepository,
  InventoryItemType,
} from "../domain/inventory.repository";

const MAX_STOCK = 2_147_483_647;
const MAX_RETRIES = 3;

export class InvalidInventoryEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInventoryEntryError";
  }
}

export class InventoryItemNotFoundError extends Error {
  constructor() {
    super(
      "El registro de inventario no existe o no está disponible."
    );
    this.name = "InventoryItemNotFoundError";
  }
}

export class InventoryEntryConflictError extends Error {
  constructor() {
    super(
      "No fue posible registrar la entrada de inventario. Intenta nuevamente."
    );
    this.name = "InventoryEntryConflictError";
  }
}

function isInventoryItemType(
  value: unknown
): value is InventoryItemType {
  return (
    value === "PRODUCT" ||
    value === "VARIANT" ||
    value === "COMPONENT"
  );
}

function isPrismaTransactionConflict(
  error: unknown
): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error)
  ) {
    return false;
  }

  return error.code === "P2034";
}

export class AddInventoryUseCase {
  constructor(
    private readonly repository: InventoryRepository
  ) {}

  async execute(
    input: AddInventoryInput
  ): Promise<InventoryEntryResult> {
    if (
      !input ||
      typeof input.itemId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        input.itemId
      )
    ) {
      throw new InvalidInventoryEntryError(
        "El identificador del inventario no es válido."
      );
    }

    if (!isInventoryItemType(input.itemType)) {
      throw new InvalidInventoryEntryError(
        "El tipo de inventario no es válido."
      );
    }

    if (
      !Number.isSafeInteger(input.quantity) ||
      input.quantity <= 0 ||
      input.quantity > MAX_STOCK
    ) {
      throw new InvalidInventoryEntryError(
        "La cantidad debe ser un número entero positivo válido."
      );
    }

    for (
      let attempt = 0;
      attempt < MAX_RETRIES;
      attempt++
    ) {
      try {
        const result =
          await this.repository.addStock(input);

        if (!result) {
          throw new InventoryItemNotFoundError();
        }

        return result;
      } catch (error) {
        if (!isPrismaTransactionConflict(error)) {
          throw error;
        }

        if (attempt === MAX_RETRIES - 1) {
          throw new InventoryEntryConflictError();
        }
      }
    }

    throw new InventoryEntryConflictError();
  }
}
