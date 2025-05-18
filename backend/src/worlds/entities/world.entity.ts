import { DateTime as Neo4jDriverDateTime } from 'neo4j-driver';

export interface World {
  id: string;
  name: string;
  description?: string;
  defaultMoneySystem?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldNodeProperties {
  id: string;
  name: string;
  description?: string;
  defaultMoneySystem?: string;
  createdAt: Neo4jDriverDateTime | string;
  updatedAt: Neo4jDriverDateTime | string;
}
