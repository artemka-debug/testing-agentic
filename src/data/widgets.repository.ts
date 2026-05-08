import { Injectable } from '@nestjs/common';
import { XyizleService } from 'xyizle';
import type { WidgetRecord, WidgetRow } from './widget.types';

@Injectable()
export class WidgetsRepository {
  constructor(private readonly xyizle: XyizleService) {}

  async create(name: string): Promise<WidgetRecord> {
    const rows = await this.xyizle.query<WidgetRow>(
      'INSERT INTO widgets (name) VALUES ($1) RETURNING id, name, created_at',
      [name],
    );
    const row = rows[0];
    if (!row) {
      throw new Error('Xyizle returned no row after INSERT');
    }
    return mapRow(row);
  }

  async findById(id: string): Promise<WidgetRecord | null> {
    const rows = await this.xyizle.query<WidgetRow>(
      'SELECT id, name, created_at FROM widgets WHERE id = $1',
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  }
}

function mapRow(row: WidgetRow): WidgetRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}
