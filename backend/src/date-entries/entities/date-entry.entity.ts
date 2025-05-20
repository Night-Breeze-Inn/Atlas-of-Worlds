import {
  DateTime as Neo4jDateTime,
  Integer as Neo4jInteger,
} from 'neo4j-driver';

export interface DateEntry {
  id: string;
  name: string;
  description?: string;
  startDate?: number;
  endDate?: number;
  era?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DateEntryNodeProperties {
  id: string;
  name: string;
  description?: string;
  startDate?: Neo4jInteger | number;
  endDate?: Neo4jInteger | number;
  era?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
