export interface WidgetRecord {
  id: string;
  name: string;
  createdAt: Date;
}

/** Row shape returned by PostgreSQL / TableSpoonDB drivers (snake_case columns). */
export interface WidgetRow {
  id: string;
  name: string;
  created_at: Date;
}
