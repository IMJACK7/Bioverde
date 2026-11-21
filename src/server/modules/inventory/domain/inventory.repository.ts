
/**
 * Tipos de registros que administran
 * existencias independientes en BioVerde.
 */
export type InventoryItemType =
  | "PRODUCT"
  | "VARIANT"
  | "COMPONENT";

/**
 * Datos necesarios para registrar
 * una entrada de inventario.
 */
export interface AddInventoryInput {
  itemId: string;
  itemType: InventoryItemType;
  quantity: number;
}

/**
 * Resultado de una entrada de inventario.
 */
export interface InventoryEntryResult {
  itemId: string;
  itemType: InventoryItemType;
  previousStock: number;
  addedQuantity: number;
  currentStock: number;
}

/**
 * Contrato para registrar entradas
 * de inventario.
 */
export interface InventoryRepository {
  addStock(
    input: AddInventoryInput
  ): Promise<InventoryEntryResult | null>;
}
