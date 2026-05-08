import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthResponseSchema = z
  .object({
    status: z.string().meta({ examples: ['ok'] }),
    database: z.enum(['up', 'down']).meta({ examples: ['up'] }),
  })
  .meta({ id: 'HealthResponseDto' });

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}
