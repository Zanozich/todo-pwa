/**
 * Файл: src/types/model.ts
 * Назначение: Общие типы данных приложения (модель, сущности, метаданные и настройки).
 */

export type ColumnType = 'text' | 'number' | 'checkbox' | 'date' | 'select';

export interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // для select
  styleMap?: Record<string, { bg: string; text?: string }>; // цвета для enum-значений
  order: number;
}

export interface TableMeta {
  columnWidths?: Record<string, number>; // ширины колонок по px
}

export interface RowData {
  id: string;
  values: Record<string, any>; // ключ = column.id
  parentId?: string; // для подзадач
}

export interface TableData {
  id: string;
  name: string;
  columns: ColumnDef[];
  rows: RowData[];
  meta?: TableMeta; // метаданные таблицы
}

export interface DatabaseData {
  id: string;
  name: string;
  tables: TableData[];
}

export interface AppSettings {
  isSidebarOpen: boolean; // состояние сайдбара
  commandSeparator: string; // разделитель для быстрых команд
}

export type AppModel = {
  dbs: DatabaseData[];
  currentDBId?: string;
  currentTableId?: string;
  view: 'table' | 'kanban';
  kanbanGroupBy: string;
  settings: AppSettings; // настройки приложения
};
