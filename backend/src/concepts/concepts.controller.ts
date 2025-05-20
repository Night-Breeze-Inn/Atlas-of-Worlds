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
import { ConceptsService } from './concepts.service';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { ConceptDto } from './dto/concept.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('concepts')
@UseGuards(AuthGuard('jwt'))
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
    @AuthUser() user: JwtPayload,
  ): Promise<ConceptDto> {
    const currentUserId = user.sub;
    return this.conceptsService.create(createConceptDto, currentUserId);
  }

  @Get('world/:worldId')
  async findAllByWorld(
    @Param('worldId', ParseUUIDPipe) worldId: string,
    @AuthUser() user: JwtPayload,
  ): Promise<ConceptDto[]> {
    const currentUserId = user.sub;
    return this.conceptsService.findAllByWorld(worldId, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<ConceptDto> {
    const currentUserId = user.sub;
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
    @AuthUser() user: JwtPayload,
  ): Promise<ConceptDto> {
    const currentUserId = user.sub;
    if (Object.keys(updateConceptDto).length === 0) {
      throw new BadRequestException('Update data cannot be empty.');
    }
    return this.conceptsService.update(id, updateConceptDto, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() user: JwtPayload,
  ): Promise<void> {
    const currentUserId = user.sub;
    await this.conceptsService.remove(id, currentUserId);
  }
}
