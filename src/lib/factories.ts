/**
 * Файл: src/lib/factories.ts
 * Назначение: Фабрики для создания дефолтных таблиц/баз (seed-данные).
 */

import type { ColumnDef, DatabaseData, TableData } from '@/types/model';
import { uid } from './id';

// 1) Создаём дефолтную таблицу "Tasks"
export function makeDefaultTable(name = 'Tasks'): TableData {
  // 1.1) Колонки
  const colTitle: ColumnDef = {
    id: uid(),
    name: 'Title',
    type: 'text',
    order: 0,
  };
  const colStatus: ColumnDef = {
    id: uid(),
    name: 'Status',
    type: 'select',
    options: ['Todo', 'Doing', 'Done'],
    order: 1,
  };
  const colPriority: ColumnDef = {
    id: uid(),
    name: 'Priority',
    type: 'select',
    options: ['Low', 'Med', 'High'],
    order: 2,
  };

  // 1.2) Таблица с одной строкой и пустыми метаданными
  return {
    id: uid(),
    name,
    columns: [colTitle, colStatus, colPriority],
    rows: [
      {
        id: uid(),
        values: {
          [colTitle.id]: 'Sample task',
          [colStatus.id]: 'Todo',
          [colPriority.id]: 'Med',
        },
      },
    ],
    meta: { columnWidths: {} },
  };
}

// 2) Создаём дефолтную базу (workspace)
export function makeDefaultDB(name = 'My Workspace'): DatabaseData {
  return { id: uid(), name, tables: [makeDefaultTable()] };
}
