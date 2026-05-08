import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { WidgetsRepository } from '../../data/widgets.repository';
import { CreateWidgetDto } from './create-widget.dto';
import { WidgetResponseDto } from './widget-response.dto';

@ApiTags('widgets')
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgets: WidgetsRepository) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a widget (persistence proof via Xyizle)' })
  @ApiCreatedResponse({ type: WidgetResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() body: CreateWidgetDto): Promise<WidgetResponseDto> {
    return await this.widgets.create(body.name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a widget by identifier' })
  @ApiNotFoundResponse({ description: 'Widget not found' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<WidgetResponseDto> {
    const found = await this.widgets.findById(id);
    if (!found) {
      throw new NotFoundException('Widget not found');
    }
    return found;
  }
}
