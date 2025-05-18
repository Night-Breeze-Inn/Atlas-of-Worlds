import {
  Module,
  Global,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, ServerInfo } from 'neo4j-driver';
import { NEO4J_DRIVER, NEO4J_CONFIG } from './neo4j.constants';

interface Neo4jDriverConfig {
  uri: string;
  username: string;
  password?: string;
}

@Global()
@Module({
  providers: [
    {
      provide: NEO4J_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Neo4jDriverConfig => {
        const uri = configService.get<string>('neo4j.uri');
        const username = configService.get<string>('neo4j.username');
        const password = configService.get<string>('neo4j.password');

        if (!uri || !username) {
          throw new Error('Missing Neo4j configuration (uri or username)');
        }
        return { uri, username, password };
      },
    },
    {
      provide: NEO4J_DRIVER,
      inject: [NEO4J_CONFIG],
      useFactory: async (dbConfig: Neo4jDriverConfig) => {
        const logger = new Logger('Neo4jModule');

        if (!dbConfig.password) {
          logger.error(
            'Neo4j password is not configured in NEO4J_CONFIG. Authentication will likely fail.',
          );
        }

        const driver: Driver = neo4j.driver(
          dbConfig.uri,
          neo4j.auth.basic(dbConfig.username, dbConfig.password || ''),
        );
        try {
          const serverInfo: ServerInfo = await driver.getServerInfo();
          logger.log(
            `Successfully connected to Neo4j. Server Agent: ${serverInfo.agent}, Address: ${serverInfo.address}, Protocol Version: ${serverInfo.protocolVersion}`,
          );
        } catch (error) {
          logger.error('Neo4j connection error:', error);
          if (driver && typeof driver.close === 'function') {
            await driver.close();
          }
          throw error;
        }
        return driver;
      },
    },
  ],
  exports: [NEO4J_DRIVER],
})
export class Neo4jModule implements OnModuleDestroy {
  constructor(@Inject(NEO4J_DRIVER) private readonly driver: Driver) {}

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      console.log('Neo4j driver closed.');
    }
  }
}
