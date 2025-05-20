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
import { FactionsService } from './factions.service';
import { CreateFactionDto } from './dto/create-faction.dto';
import { UpdateFactionDto } from './dto/update-faction.dto';
import { FactionDto } from './dto/faction.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@Controller('factions')
@UseGuards(AuthGuard('jwt'))
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
    @AuthUser() user: JwtPayload,
  ): Promise<FactionDto> {
    const currentUserId = user.sub;
    return this.factionsService.create(createFactionDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @AuthUser() user: JwtPayload,
  ): Promise<FactionDto[]> {
    const currentUserId = user.sub;
    return this.factionsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<FactionDto> {
    const currentUserId = user.sub;
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
    @AuthUser() user: JwtPayload,
  ): Promise<FactionDto> {
    const currentUserId = user.sub;
    if (Object.keys(updateFactionDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.factionsService.update(id, updateFactionDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<void> {
    const currentUserId = user.sub;
    await this.factionsService.remove(id, currentUserId);
  }
}
