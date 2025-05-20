import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Driver,
  QueryResult,
  Session,
  Record as Neo4jRecord,
  DateTime as Neo4jDateTime,
  Integer as Neo4jInteger,
} from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  private neo4jIntToNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;

    if (value instanceof Neo4jInteger) {
      return value.toNumber();
    }

    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return num;
    }
    console.warn(
      'neo4jIntToNumber received unexpected type or structure:',
      value,
    );
    return 0;
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
        'MATCH (u:User {email: $email}) RETURN u.id as id, u.username as username, u.email as email, u.passwordHash as passwordHash, u.createdAt as createdAt, u.updatedAt as updatedAt',
        { email },
      );
      if (result.records.length === 0) {
        return null;
      }
      const record = result.records[0];
      return {
        id: record.get('id') as string,
        username: record.get('username') as string,
        email: record.get('email') as string,
        passwordHash: record.get('passwordHash') as string,
        createdAt: this.neo4jDateTimeToDate(
          record.get('createdAt') as Neo4jDateTime | string,
        ),
        updatedAt: this.neo4jDateTimeToDate(
          record.get('updatedAt') as Neo4jDateTime | string,
        ),
      };
    } finally {
      await session.close();
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const session = this.neo4jDriver.session();
    try {
      const existingUserResult = await session.run(
        'MATCH (u:User {id: $id}) RETURN u',
        { id },
      );
      if (existingUserResult.records.length === 0) {
        throw new NotFoundException(`User with ID "${id}" not found.`);
      }

      const propertiesToUpdate: { [key: string]: any } = {};
      const setClauses: string[] = [];

      if (updateUserDto.username) {
        const byUsername = await session.run(
          'MATCH (u:User {username: $username}) WHERE u.id <> $id RETURN u.id',
          { username: updateUserDto.username, id },
        );
        if (byUsername.records.length > 0)
          throw new ConflictException('Username already taken.');
        propertiesToUpdate.username = updateUserDto.username;
        setClauses.push('u.username = $username');
      }
      if (updateUserDto.email) {
        const byEmail = await session.run(
          'MATCH (u:User {email: $email}) WHERE u.id <> $id RETURN u.id',
          { email: updateUserDto.email, id },
        );
        if (byEmail.records.length > 0)
          throw new ConflictException('Email already registered.');
        propertiesToUpdate.email = updateUserDto.email;
        setClauses.push('u.email = $email');
      }
      if (updateUserDto.password) {
        propertiesToUpdate.passwordHash = await this.hashPassword(
          updateUserDto.password,
        );
        setClauses.push('u.passwordHash = $passwordHash');
      }

      if (setClauses.length === 0) {
        return this.mapRecordToUserDto(existingUserResult.records[0]);
      }

      propertiesToUpdate.updatedAt = new Date().toISOString();
      setClauses.push('u.updatedAt = datetime($updatedAt)');

      const result = await session.run(
        `MATCH (u:User {id: $id})
           SET ${setClauses.join(', ')}
           RETURN u`,
        { id, ...propertiesToUpdate },
      );

      return this.mapRecordToUserDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      console.error(`Error updating user ${id}:`, error);
      throw new InternalServerErrorException('Could not update user.');
    } finally {
      await session.close();
    }
  }

  async remove(id: string): Promise<void> {
    const session = this.neo4jDriver.session();
    try {
      const ownedWorldsCheck = await session.run(
        `MATCH (u:User {id: $id})-[:OWNS]->(w:World) RETURN count(w) as worldCount`,
        { id },
      );
      const worldCount =
        ownedWorldsCheck.records.length > 0
          ? (this.neo4jIntToNumber(
              ownedWorldsCheck.records[0].get('worldCount'),
            ) ?? 0)
          : 0;
      if (worldCount > 0) {
        throw new ConflictException(
          'Cannot delete user: user owns one or more worlds. Please delete or transfer ownership of worlds first.',
        );
      }

      const result = await session.run(
        'MATCH (u:User {id: $id}) DETACH DELETE u RETURN count(u) as deletedCount',
        { id },
      );

      const deletedCount =
        result.records.length > 0
          ? (this.neo4jIntToNumber(result.records[0].get('deletedCount')) ?? 0)
          : 0;

      if (deletedCount === 0) {
        throw new NotFoundException(`User with ID "${id}" not found.`);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      console.error(`Error removing user ${id}:`, error);
      throw new InternalServerErrorException('Could not remove user.');
    } finally {
      await session.close();
    }
  }
}
