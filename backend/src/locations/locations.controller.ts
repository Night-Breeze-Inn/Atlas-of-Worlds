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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationDto } from './dto/location.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@Controller('locations')
@UseGuards(AuthGuard('jwt'))
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
    @AuthUser() user: JwtPayload,
  ): Promise<LocationDto> {
    const currentUserId = user.sub;
    return this.locationsService.create(createLocationDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @AuthUser() user: JwtPayload,
  ): Promise<LocationDto[]> {
    const currentUserId = user.sub;
    return this.locationsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<LocationDto> {
    const currentUserId = user.sub;
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
    @AuthUser() user: JwtPayload,
  ): Promise<LocationDto> {
    const currentUserId = user.sub;
    if (Object.keys(updateLocationDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.locationsService.update(id, updateLocationDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<void> {
    const currentUserId = user.sub;
    await this.locationsService.remove(id, currentUserId);
  }
}
