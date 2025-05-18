import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Driver,
  QueryResult,
  Session,
  Record as Neo4jRecord,
  DateTime as Neo4jDateTime,
} from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserDto } from './dto/user.dto';

interface UserNodeProperties {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}

@Injectable()
export class UsersService {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  private hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private neo4jDateTimeToDate(dateTime: UserNodeProperties['createdAt']): Date {
    if (typeof dateTime === 'string') {
      return new Date(dateTime);
    }
    return new Date(
      dateTime.year.toInt(),
      dateTime.month.toInt() - 1,
      dateTime.day.toInt(),
      dateTime.hour.toInt(),
      dateTime.minute.toInt(),
      dateTime.second.toInt(),
      dateTime.nanosecond.toInt() / 1000000,
    );
  }

  private mapRecordToUserDto(record: Neo4jRecord): UserDto {
    const userNode = record.get('u') as { properties: UserNodeProperties };
    const userNodeProperties = userNode.properties;
    return {
      id: userNodeProperties.id,
      username: userNodeProperties.username,
      email: userNodeProperties.email,
      createdAt: this.neo4jDateTimeToDate(userNodeProperties.createdAt),
      updatedAt: this.neo4jDateTimeToDate(userNodeProperties.updatedAt),
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const existingUserByEmailResult: QueryResult = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email: createUserDto.email },
      );
      if (existingUserByEmailResult.records.length > 0) {
        throw new ConflictException('User with this email already exists');
      }

      const existingUserByUsernameResult: QueryResult = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username: createUserDto.username },
      );
      if (existingUserByUsernameResult.records.length > 0) {
        throw new ConflictException('User with this username already exists');
      }

      const passwordHash = await this.hashPassword(createUserDto.password);
      const userId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `CREATE (u:User {
           id: $id,
           username: $username,
           email: $email,
           passwordHash: $passwordHash,
           createdAt: datetime($createdAt),
           updatedAt: datetime($updatedAt)
         }) RETURN u`,
        {
          id: userId,
          username: createUserDto.username,
          email: createUserDto.email,
          passwordHash: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        throw new Error('Failed to create user node.');
      }
      return this.mapRecordToUserDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Could not create user: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findOneById(id: string): Promise<UserDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        'MATCH (u:User {id: $id}) RETURN u',
        { id },
      );
      if (result.records.length === 0) {
        return null;
      }
      return this.mapRecordToUserDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email },
      );
      if (result.records.length === 0) {
        return null;
      }
      const userNode = result.records[0].get('u') as {
        properties: UserNodeProperties;
      };
      const userNodeProperties = userNode.properties;
      return {
        id: userNodeProperties.id,
        username: userNodeProperties.username,
        email: userNodeProperties.email,
        passwordHash: userNodeProperties.passwordHash,
        createdAt: this.neo4jDateTimeToDate(userNodeProperties.createdAt),
        updatedAt: this.neo4jDateTimeToDate(userNodeProperties.updatedAt),
      };
    } finally {
      await session.close();
    }
  }
}
