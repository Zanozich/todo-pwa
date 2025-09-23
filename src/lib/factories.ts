/**
 * Файл: src/lib/factories.ts
 * Назначение: Фабрики создания пустых сущностей (DB/Table/Row).
 * Требование: никакого «seed»-контента — новая таблица пустая (0 колонок, 0 строк).
 */

import type { DB, TableData, RowData, ColumnDef } from '@/types/model';
import { uid } from '@/lib/id';

export function makeEmptyTable(name = 'New Table'): TableData {
  return {
    id: uid(),
    name,
    columns: [],
    rows: [],
    meta: { columnWidths: {} },
  };
}

export function makeDefaultDB(name = 'New Workspace'): DB {
  // Создаём 1 пустую таблицу, чтобы UI мог выбрать currentTableId
  const table = makeEmptyTable();
  return {
    id: uid(),
    name,
    tables: [table],
  };
}

// (опционально пригодится далее)
export function makeTextColumn(name: string, order: number): ColumnDef {
  return { id: uid(), name, type: 'text', order };
}

export function makeRow(): RowData {
  return { id: uid(), values: {} };
}
