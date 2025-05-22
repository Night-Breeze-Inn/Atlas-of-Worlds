import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  InternalServerErrorException,
  Get,
  DefaultValuePipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RelationshipsService } from './relationships.service';
import {
  CreateRelationshipDto,
  AllowedRelationshipTypes,
} from './dto/create-relationship.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { GenericRelatedNodeDto } from './dto/generic-related-node.dto';

@Controller('relationships')
@UseGuards(AuthGuard('jwt'))
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post(':startNodeType/:startNodeId/:endNodeType/:endNodeId')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async createRelationship(
    @Param('startNodeType') startNodeType: string,
    @Param('startNodeId', ParseUUIDPipe) startNodeId: string,
    @Param('endNodeType') endNodeType: string,
    @Param('endNodeId', ParseUUIDPipe) endNodeId: string,
    @Body() createRelationshipDto: CreateRelationshipDto,
    @AuthUser() user: JwtPayload,
  ): Promise<ReturnType<RelationshipsService['createRelationship']>> {
    return this.relationshipsService.createRelationship(
      startNodeType,
      startNodeId,
      endNodeType,
      endNodeId,
      createRelationshipDto,
      user.sub,
    );
  }

  @Delete(':startNodeType/:startNodeId/:endNodeType/:endNodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRelationship(
    @Param('startNodeType') startNodeType: string,
    @Param('startNodeId', ParseUUIDPipe) startNodeId: string,
    @Param('endNodeType') endNodeType: string,
    @Param('endNodeId', ParseUUIDPipe) endNodeId: string,
    @Query('type') relationshipType: AllowedRelationshipTypes,
    @AuthUser() user: JwtPayload,
  ) {
    if (!relationshipType) {
      throw new BadRequestException(
        'Query parameter "type" (relationshipType) is required for deletion.',
      );
    }
    return this.relationshipsService.deleteRelationship(
      startNodeType,
      startNodeId,
      endNodeType,
      endNodeId,
      relationshipType,
      user.sub,
    );
  }

  @Get('nodes/:startNodeType/:startNodeId/related')
  async getRelatedNodes(
    @Param('startNodeType') startNodeType: string,
    @Param('startNodeId', ParseUUIDPipe) startNodeId: string,
    @Query(
      'direction',
      new DefaultValuePipe('outgoing'),
      new ParseEnumPipe(['outgoing', 'incoming', 'both']),
    )
    direction: 'outgoing' | 'incoming' | 'both',
    @Query('relationshipType')
    relationshipTypeParam: AllowedRelationshipTypes | string,
    @Query('endNodeType') endNodeTypeParam: string,
    @AuthUser() user: JwtPayload,
  ): Promise<GenericRelatedNodeDto[]> {
    console.log('--- Controller: getRelatedNodes ---');
    console.log(
      'Received user object (from @AuthUser):',
      JSON.stringify(user, null, 2),
    );
    if (!user) {
      console.error(
        'Controller: FATAL - User object is undefined immediately after injection!',
      );
      throw new InternalServerErrorException(
        'User context not available after authentication.',
      );
    }
    if (typeof user.sub === 'undefined') {
      console.error(
        'Controller: FATAL - User object is defined, but user.sub is undefined!',
        JSON.stringify(user, null, 2),
      );
      throw new InternalServerErrorException(
        'User ID (sub) is missing from user context.',
      );
    }

    const currentUserId = user.sub;
    console.log('Controller: Extracted currentUserId:', currentUserId);

    return this.relationshipsService.getRelatedNodes(
      startNodeType,
      startNodeId,
      direction,
      currentUserId,
      relationshipTypeParam,
      endNodeTypeParam,
    );
  }
}
