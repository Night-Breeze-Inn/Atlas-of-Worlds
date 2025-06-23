import type { UserDto } from './users.types';

export interface WorldDto {
  id: string;
  name: string;
  description?: string;
  defaultMoneySystem?: string;
  owner: UserDto;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

export interface CreateWorldDto {
  name: string;
  description?: string;
  defaultMoneySystem?: string;
}

export interface UpdateWorldDto {
  name?: string;
  description?: string;
  defaultMoneySystem?: string;
}

export interface CreateWorldDto {
  name: string;
  description?: string;
  defaultMoneySystem?: string;
}