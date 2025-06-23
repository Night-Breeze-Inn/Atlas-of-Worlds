export interface UserDto {
    id: string;
    username: string;
    email: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateUserDto {
    username: string;
    email: string;
    password: string;
  }
  
  export interface UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
  }
  