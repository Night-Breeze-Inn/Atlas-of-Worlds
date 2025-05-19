// backend/src/locations/locations.controller.ts
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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationDto } from './dto/location.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @TempUser() currentUserId: string,
  ): Promise<LocationDto> {
    return this.locationsService.create(createLocationDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<LocationDto[]> {
    return this.locationsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<LocationDto> {
    const location = await this.locationsService.findOneById(id, currentUserId);
    if (!location) {
      throw new NotFoundException(
        `Location with ID "${id}" not found or not accessible.`,
      );
    }
    return location;
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @TempUser() currentUserId: string,
  ): Promise<LocationDto> {
    if (Object.keys(updateLocationDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.locationsService.update(id, updateLocationDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string, // Injected by decorator (from query or header)
  ): Promise<void> {
    await this.locationsService.remove(id, currentUserId);
  }
}
