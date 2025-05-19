import { DateTime as Neo4jDateTime } from 'neo4j-driver';

export interface Location {
  id: string;
  name: string;
  description?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationNodeProperties {
  id: string;
  name: string;
  description?: string;
  type?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
