import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness and database readiness',
    description:
      'Returns process liveness and whether the application can query PostgreSQL.',
  })
  @ZodResponse({ type: HealthResponseDto })
  async getHealth(): Promise<HealthResponseDto> {
    return this.healthService.getStatus();
  }
}
