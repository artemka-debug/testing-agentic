import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEnvSchema } from '../config/env.validation';
import { DatabaseLoggingService } from './database-logging.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = databaseEnvSchema.parse({
          DB_HOST: config.getOrThrow<string>('DB_HOST'),
          DB_PORT: config.getOrThrow<number>('DB_PORT'),
          DB_USER: config.getOrThrow<string>('DB_USER'),
          DB_PASSWORD: config.getOrThrow<string>('DB_PASSWORD'),
          DB_NAME: config.getOrThrow<string>('DB_NAME'),
        });
        return {
          type: 'postgres' as const,
          host: db.DB_HOST,
          port: db.DB_PORT,
          username: db.DB_USER,
          password: db.DB_PASSWORD,
          database: db.DB_NAME,
          autoLoadEntities: true,
          synchronize: false,
          retryAttempts: 15,
          retryDelay: 2000,
        };
      },
    }),
  ],
  providers: [DatabaseLoggingService],
})
export class DatabaseModule {}
