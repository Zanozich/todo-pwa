/**
 * File: src/types/model.ts
 * Purpose: Core domain types for the app state.
 */

export type ColumnType = 'text' | 'number' | 'checkbox' | 'date' | 'select';

export type ColumnDef = {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // for select
  order: number;
};

export type RowData = {
  id: string;
  values: Record<string, any>;
};

export type TableData = {
  id: string;
  name: string;
  columns: ColumnDef[];
  rows: RowData[];
  meta?: {
    columnWidths?: Record<string, number>;
  };
};

export type DB = {
  id: string;
  name: string;
  tables: TableData[];
};

export type AppSettings = {
  isSidebarOpen: boolean;
  commandSeparator: '\\' | '|' | '/';
};

export type AppModel = {
  dbs: DB[];
  currentDBId?: string;
  currentTableId?: string;
  view: 'table' | 'kanban';
  kanbanGroupByColumnId?: string;
  cursor: { row: number | null; col: number | null };
  settings: AppSettings;
};
