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
import { AuthGuard } from '@nestjs/passport';
import { WorldsService } from './worlds.service';
import { CreateWorldDto } from './dto/create-world.dto';
import { UpdateWorldDto } from './dto/update-world.dto';
import { WorldDto } from './dto/world.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@Controller('worlds')
@UseGuards(AuthGuard('jwt'))
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
  async create(
    @Body() createWorldDto: CreateWorldDto,
    @AuthUser() user: JwtPayload,
  ): Promise<WorldDto> {
    const authenticatedUserId = user.sub;
    return this.worldsService.create(createWorldDto, authenticatedUserId);
  }

  @Get('owner/me')
  async findAllByAuthenticatedOwner(
    @AuthUser() user: JwtPayload,
  ): Promise<WorldDto[]> {
    const ownerId = user.sub;
    return this.worldsService.findAllByOwner(ownerId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<WorldDto> {
    const currentUserId = user.sub;
    const world = await this.worldsService.findOneById(id, currentUserId);
    if (!world) {
      throw new NotFoundException(
        `World with ID "${id}" not found or not accessible to you.`,
      );
    }
    return world;
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
    @Body() updateWorldDto: UpdateWorldDto,
    @AuthUser() user: JwtPayload,
  ): Promise<WorldDto> {
    const currentUserId = user.sub;
    if (Object.keys(updateWorldDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.worldsService.update(id, updateWorldDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<void> {
    const currentUserId = user.sub;
    await this.worldsService.remove(id, currentUserId);
  }
}
