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
import { ConceptsService } from './concepts.service';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { ConceptDto } from './dto/concept.dto';
import { TempUser } from '../common/decorators/temp-user.decorator';

@Controller('concepts')
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

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
    @Body() createConceptDto: CreateConceptDto,
    @TempUser() currentUserId: string,
  ): Promise<ConceptDto> {
    return this.conceptsService.create(createConceptDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @TempUser() currentUserId: string,
  ): Promise<ConceptDto[]> {
    return this.conceptsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<ConceptDto> {
    const concept = await this.conceptsService.findOneById(id, currentUserId);
    if (!concept) {
      throw new NotFoundException(
        `Concept with ID "${id}" not found or not accessible.`,
      );
    }
    return concept;
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
    @Body() updateConceptDto: UpdateConceptDto,
    @TempUser() currentUserId: string,
  ): Promise<ConceptDto> {
    if (Object.keys(updateConceptDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.conceptsService.update(id, updateConceptDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TempUser() currentUserId: string,
  ): Promise<void> {
    await this.conceptsService.remove(id, currentUserId);
  }
}
