import { ApiProperty } from '@nestjs/swagger';

export class WidgetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
