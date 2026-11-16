
export type KitComponentType =
  | "SEED"
  | "FERTILIZER"
  | "SUBSTRATE"
  | "POT"
  | "TOOL"
  | "GUIDE";

export interface KitComponent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: KitComponentType;
  price: number;
  stock: number;
}

export interface KitComponentRepository {
  findAllAvailable(): Promise<KitComponent[]>;
}
