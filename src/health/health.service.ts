import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async getStatus(): Promise<HealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
