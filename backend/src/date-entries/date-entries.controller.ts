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
import { DateEntriesService } from './date-entries.service';
import { CreateDateEntryDto } from './dto/create-date-entry.dto';
import { UpdateDateEntryDto } from './dto/update-date-entry.dto';
import { DateEntryDto } from './dto/date-entry.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '../auth/auth.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';

@Controller('date-entries')
@UseGuards(AuthGuard('jwt'))
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
    @AuthUser() user: JwtPayload,
  ): Promise<DateEntryDto> {
    const currentUserId = user.sub;
    return this.dateEntriesService.create(createDateEntryDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @AuthUser() user: JwtPayload,
  ): Promise<DateEntryDto[]> {
    const currentUserId = user.sub;
    return this.dateEntriesService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<DateEntryDto> {
    const currentUserId = user.sub;
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
    @AuthUser() user: JwtPayload,
  ): Promise<DateEntryDto> {
    const currentUserId = user.sub;
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
    @AuthUser() user: JwtPayload,
  ): Promise<void> {
    const currentUserId = user.sub;
    await this.dateEntriesService.remove(id, currentUserId);
  }
}
