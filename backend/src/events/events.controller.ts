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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventDto } from './dto/event.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
    @Body() createEventDto: CreateEventDto,
    @TempUser() currentUserId: string,
  ): Promise<EventDto> {
    return this.eventsService.create(createEventDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<EventDto[]> {
    return this.eventsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<EventDto> {
    const event = await this.eventsService.findOneById(id, currentUserId);
    if (!event) {
      throw new NotFoundException(
        `Event with ID "${id}" not found or not accessible.`,
      );
    }
    return event;
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
    @Body() updateEventDto: UpdateEventDto,
    @TempUser() currentUserId: string,
  ): Promise<EventDto> {
    if (Object.keys(updateEventDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.eventsService.update(id, updateEventDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<void> {
    await this.eventsService.remove(id, currentUserId);
  }
}
