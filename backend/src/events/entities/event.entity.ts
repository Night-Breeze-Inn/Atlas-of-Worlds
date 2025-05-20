import { DateTime as Neo4jDateTime, Date as Neo4jDate } from 'neo4j-driver';

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate?: Date;
  significance?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventNodeProperties {
  id: string;
  name: string;
  description?: string;
  eventDate?: Neo4jDate | Neo4jDateTime | string;
  significance?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
