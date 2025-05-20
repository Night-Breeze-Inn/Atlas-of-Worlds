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
import { FactionsService } from './factions.service';
import { CreateFactionDto } from './dto/create-faction.dto';
import { UpdateFactionDto } from './dto/update-faction.dto';
import { FactionDto } from './dto/faction.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('factions')
export class FactionsController {
  constructor(private readonly factionsService: FactionsService) {}

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
    @Body() createFactionDto: CreateFactionDto,
    @TempUser() currentUserId: string,
  ): Promise<FactionDto> {
    return this.factionsService.create(createFactionDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<FactionDto[]> {
    return this.factionsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<FactionDto> {
    const faction = await this.factionsService.findOneById(id, currentUserId);
    if (!faction) {
      throw new NotFoundException(
        `Faction with ID "${id}" not found or not accessible.`,
      );
    }
    return faction;
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
    @Body() updateFactionDto: UpdateFactionDto,
    @TempUser() currentUserId: string,
  ): Promise<FactionDto> {
    if (Object.keys(updateFactionDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.factionsService.update(id, updateFactionDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<void> {
    await this.factionsService.remove(id, currentUserId);
  }
}
