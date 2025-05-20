import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsObject,
} from 'class-validator';
import { ItemRarity, ItemType } from '../entities/item.entity';

export class UpdateItemDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(ItemType))
  type?: ItemType;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(ItemRarity))
  rarity?: ItemRarity;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;
}
