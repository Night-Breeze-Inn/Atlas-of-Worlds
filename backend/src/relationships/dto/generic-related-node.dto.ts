export class GenericRelatedNodeDto {
  node: {
    id: string;
    labels: string[];
    properties: Record<string, any>;
  };
  relationship: {
    id: string;
    type: string;
    properties: Record<string, any>;
  };
  direction: 'outgoing' | 'incoming';
}
