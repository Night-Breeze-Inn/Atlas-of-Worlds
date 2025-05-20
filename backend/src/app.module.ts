import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jModule } from './database/neo4j/neo4j.module';
import { UsersModule } from './users/users.module';
import { WorldsModule } from './worlds/worlds.module';
import { LocationsModule } from './locations/locations.module';
import { CharactersModule } from './characters/characters.module';
import { FactionsModule } from './factions/factions.module';
import { ItemsModule } from './items/items.module';
import neo4jConfig from './database/neo4j/neo4j.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [neo4jConfig],
    }),
    Neo4jModule,
    UsersModule,
    WorldsModule,
    LocationsModule,
    CharactersModule,
    FactionsModule,
    ItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
