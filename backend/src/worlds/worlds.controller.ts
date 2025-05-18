// backend/src/worlds/worlds.controller.ts
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
import { WorldsService } from './worlds.service';
import { CreateWorldDto } from './dto/create-world.dto';
import { UpdateWorldDto } from './dto/update-world.dto';
import { WorldDto } from './dto/world.dto';

interface UpdateBodyWithTestingId extends UpdateWorldDto {
  tempOwnerIdForTesting?: string;
}
interface DeleteBodyWithTestingId {
  tempOwnerIdForTesting?: string;
}

@Controller('worlds')
export class WorldsController {
  constructor(private readonly worldsService: WorldsService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createWorldDto: CreateWorldDto): Promise<WorldDto> {
    return this.worldsService.create(createWorldDto);
  }

  @Get('owner/:ownerId')
  async findAllByOwner(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
  ): Promise<WorldDto[]> {
    return this.worldsService.findAllByOwner(ownerId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WorldDto> {
    const world = await this.worldsService.findOneById(id);
    if (!world) {
      throw new NotFoundException(`World with ID "${id}" not found.`);
    }
    return world;
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: true,
    }),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() bodyWithTestingId: UpdateBodyWithTestingId,
  ): Promise<WorldDto> {
    const { tempOwnerIdForTesting, ...updateWorldDto } = bodyWithTestingId;

    const currentUserId: string =
      tempOwnerIdForTesting || '00000000-0000-0000-0000-000000000000';

    if (Object.keys(updateWorldDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.worldsService.update(id, updateWorldDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeleteBodyWithTestingId,
  ): Promise<void> {
    const currentUserId: string =
      body.tempOwnerIdForTesting || '00000000-0000-0000-0000-000000000000';
    await this.worldsService.remove(id, currentUserId);
  }
}
