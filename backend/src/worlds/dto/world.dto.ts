import { UserDto } from '../../users/dto/user.dto';

export class WorldDto {
  id: string;
  name: string;
  description?: string;
  defaultMoneySystem?: string;
  owner: UserDto;
  createdAt: Date;
  updatedAt: Date;
}
