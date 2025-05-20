import { ItemRarity, ItemType } from '../entities/item.entity';

export class ItemDto {
  id: string;
  name: string;
  description?: string;
  type?: ItemType;
  rarity?: ItemRarity;
  properties?: Record<string, any>;
  worldId: string;
  createdAt: Date;
  updatedAt: Date;
}
