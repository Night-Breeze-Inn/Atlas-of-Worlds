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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemDto } from './dto/item.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

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
    @Body() createItemDto: CreateItemDto,
    @TempUser() currentUserId: string,
  ): Promise<ItemDto> {
    return this.itemsService.create(createItemDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<ItemDto[]> {
    return this.itemsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<ItemDto> {
    const item = await this.itemsService.findOneById(id, currentUserId);
    if (!item) {
      throw new NotFoundException(
        `Item with ID "${id}" not found or not accessible.`,
      );
    }
    return item;
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
    @Body() updateItemDto: UpdateItemDto,
    @TempUser() currentUserId: string,
  ): Promise<ItemDto> {
    if (Object.keys(updateItemDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.itemsService.update(id, updateItemDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<void> {
    await this.itemsService.remove(id, currentUserId);
  }
}
