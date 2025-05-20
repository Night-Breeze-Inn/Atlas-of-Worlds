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
import { DateEntriesService } from './date-entries.service';
import { CreateDateEntryDto } from './dto/create-date-entry.dto';
import { UpdateDateEntryDto } from './dto/update-date-entry.dto';
import { DateEntryDto } from './dto/date-entry.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('date-entries')
export class DateEntriesController {
  constructor(private readonly dateEntriesService: DateEntriesService) {}

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
    @Body() createDateEntryDto: CreateDateEntryDto,
    @TempUser() currentUserId: string,
  ): Promise<DateEntryDto> {
    return this.dateEntriesService.create(createDateEntryDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<DateEntryDto[]> {
    return this.dateEntriesService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<DateEntryDto> {
    const dateEntry = await this.dateEntriesService.findOneById(
      id,
      currentUserId,
    );
    if (!dateEntry) {
      throw new NotFoundException(
        `Date entry with ID "${id}" not found or not accessible.`,
      );
    }
    return dateEntry;
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
    @Body() updateDateEntryDto: UpdateDateEntryDto,
    @TempUser() currentUserId: string,
  ): Promise<DateEntryDto> {
    if (Object.keys(updateDateEntryDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.dateEntriesService.update(
      id,
      updateDateEntryDto,
      currentUserId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<void> {
    await this.dateEntriesService.remove(id, currentUserId);
  }
}
