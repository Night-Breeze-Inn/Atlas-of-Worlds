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
} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CharacterDto } from './dto/character.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('characters')
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
    @TempUser() currentUserId: string,
  ): Promise<CharacterDto> {
    return this.charactersService.create(createCharacterDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<CharacterDto[]> {
    return this.charactersService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<CharacterDto> {
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
    @TempUser() currentUserId: string,
  ): Promise<CharacterDto> {
    if (Object.keys(updateCharacterDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.charactersService.update(id, updateCharacterDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<void> {
    await this.charactersService.remove(id, currentUserId);
  }
}
