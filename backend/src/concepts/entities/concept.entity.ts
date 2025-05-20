import { DateTime as Neo4jDateTime } from 'neo4j-driver';

export interface Concept {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptNodeProperties {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
