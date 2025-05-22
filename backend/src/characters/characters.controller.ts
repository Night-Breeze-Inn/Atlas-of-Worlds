import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CharacterDto } from './dto/character.dto';
import { JwtPayload } from '../auth/auth.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FactionDto } from '../factions/dto/faction.dto';
import { RelationshipPropertiesDto } from '../relationships/dto/create-relationship.dto';
import { RelatedNodeDto } from '../relationships/dto/related-node.dto';

@Controller('characters')
@UseGuards(AuthGuard('jwt'))
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCharacterDto: CreateCharacterDto,
    @AuthUser() user: JwtPayload,
  ): Promise<CharacterDto> {
    const currentUserId = user.sub;
    return this.charactersService.create(createCharacterDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @AuthUser() user: JwtPayload,
  ): Promise<CharacterDto[]> {
    const currentUserId = user.sub;
    return this.charactersService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<CharacterDto> {
    const currentUserId = user.sub;
    const character = await this.charactersService.findOneById(
      id,
      currentUserId,
    );
    if (!character) {
      throw new NotFoundException(
        `Character with ID "${id}" not found or not accessible.`,
      );
    }
    return character;
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
    @AuthUser() user: JwtPayload,
  ): Promise<CharacterDto> {
    const currentUserId = user.sub;
    if (Object.keys(updateCharacterDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.charactersService.update(id, updateCharacterDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<void> {
    const currentUserId = user.sub;
    await this.charactersService.remove(id, currentUserId);
  }

  @Get(':id/member-of-factions')
  async getMemberOfFactions(
    @Param('id', ParseUUIDPipe) characterId: string,
    @AuthUser() user: JwtPayload,
  ): Promise<RelatedNodeDto<FactionDto, RelationshipPropertiesDto>[]> {
    return this.charactersService.findMemberOfFactions(characterId, user.sub);
  }
}
