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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RelationshipsService } from './relationships.service';
import {
  CreateRelationshipDto,
  AllowedRelationshipTypes,
} from './dto/create-relationship.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtPayload } from '../auth/auth.service';

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
}
