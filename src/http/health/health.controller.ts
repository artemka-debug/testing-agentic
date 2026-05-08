import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { XyizleService } from 'xyizle';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly xyizle: XyizleService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness and TableSpoonDB connectivity (via Xyizle)',
  })
  async getHealth(): Promise<{ status: string; database: string }> {
    await this.xyizle.ping();
    return { status: 'ok', database: 'up' };
  }
}
