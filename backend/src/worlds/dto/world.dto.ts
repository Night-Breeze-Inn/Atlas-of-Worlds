import type {
  WorldDto as IWorldDto,
  UserDto as IUserDto,
} from '@atlas-of-worlds/types';
export class WorldDto implements IWorldDto {
  id: string;
  name: string;
  description?: string;
  defaultMoneySystem?: string;
  owner: IUserDto; // Use the imported UserDto interface
  createdAt: string;
  updatedAt: string;
}
