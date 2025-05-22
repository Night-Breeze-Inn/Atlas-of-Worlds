export class RelatedNodeDto<
  NodeDtoType,
  RelationshipPropsType = Record<string, any>,
> {
  node: NodeDtoType;
  relationshipProperties: RelationshipPropsType;
  relationshipType: string;
  direction?: 'outgoing' | 'incoming';
}
