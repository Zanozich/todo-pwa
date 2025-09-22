/**
 * Файл: src/lib/commands.ts
 * Назначение: Парсер и исполнитель команд командной строки.
 * Вход: строка "/add table "Tasks" ...".
 * Выход: новый AppModel.
 */

import type { AppModel } from '@/types/model';
import { makeDefaultDB, makeDefaultTable } from './factories';
import { uid } from './id';

// 1) Разбираем строку команды в структуру { action, ...args }
export function parseCommand(cmd: string) {
  const out: any = { raw: cmd };
  const lower = cmd.toLowerCase();

  // 1.1) /add table "Name"
  if (lower.startsWith('/add table')) {
    const name = cmd.match(/\"([^\"]+)\"/i)?.[1] ?? 'New Table';
    out.action = 'addTable';
    out.name = name;
    return out;
  }

  // 1.2) /add db "Name"
  if (lower.startsWith('/add db') || lower.startsWith('/add workspace')) {
    const name = cmd.match(/\"([^\"]+)\"/i)?.[1] ?? 'New Workspace';
    out.action = 'addDB';
    out.name = name;
    return out;
  }

  // 1.3) /select table "Name"
  if (lower.startsWith('/select table')) {
    const name =
      cmd.match(/table\\s+\"([^\"]+)\"/i)?.[1] ?? cmd.split(' ').pop();
    out.action = 'selectTableByName';
    out.name = name;
    return out;
  }

  // 1.4) /view kanban by:Status
  if (lower.startsWith('/view kanban')) {
    const by = cmd.match(/by:([\\w\\-]+)/i)?.[1] ?? 'Status';
    out.action = 'viewKanban';
    out.by = by.trim();
    return out;
  }

  // 1.5) /view table
  if (lower.startsWith('/view table')) {
    out.action = 'viewTable';
    return out;
  }

  // 1.6) /add row title:"Task" status:Todo
  if (lower.startsWith('/add row')) {
    const pairs = Array.from(
      cmd.matchAll(/(\\w+):\"([^\"]+)\"|(\\w+):(\\w+)/g)
    );
    const data: Record<string, string> = {};
    for (const m of pairs) {
      const k = (m[1] || m[3])?.trim();
      const v = (m[2] || m[4])?.trim();
      if (k && v) data[k] = v;
    }
    out.action = 'addRow';
    out.data = data;
    return out;
  }

  out.action = 'unknown';
  return out;
}

// 2) Применяем действие к модели → возвращаем новую модель
export function execute(model: AppModel, action: any): AppModel {
  // 2.1) Делаем глубокую копию модели
  const next: AppModel = JSON.parse(JSON.stringify(model));

  switch (action.action) {
    // 2.2) Добавляем новую базу
    case 'addDB': {
      const db = makeDefaultDB(action.name);
      next.dbs.push(db);
      next.currentDBId = db.id;
      next.currentTableId = db.tables[0].id;
      return next;
    }
    // 2.3) Добавляем таблицу в текущую базу
    case 'addTable': {
      if (!next.currentDBId) return next;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = makeDefaultTable(action.name);
      db.tables.push(t);
      next.currentTableId = t.id;
      return next;
    }
    // 2.4) Выбираем таблицу по имени
    case 'selectTableByName': {
      if (!next.currentDBId) return next;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find(
        (x) => x.name.toLowerCase() === String(action.name ?? '').toLowerCase()
      );
      if (t) next.currentTableId = t.id;
      return next;
    }
    // 2.5) Переключаемся на Канбан
    case 'viewKanban': {
      next.view = 'kanban';
      next.kanbanGroupBy = action.by || 'Status';
      return next;
    }
    // 2.6) Переключаемся на Таблицу
    case 'viewTable': {
      next.view = 'table';
      return next;
    }
    // 2.7) Добавляем строку в текущую таблицу
    case 'addRow': {
      if (!next.currentDBId || !next.currentTableId) return next;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      const row = { id: uid(), values: {} as Record<string, any> };

      // 2.7.1) Маппим пары key:value по имени колонки → по id колонки
      for (const [k, v] of Object.entries(action.data || {})) {
        const col = t.columns.find(
          (c) => c.name.toLowerCase() === k.toLowerCase()
        );
        if (col) row.values[col.id] = v;
      }
      // 2.7.2) Гарантируем Title
      const titleCol = t.columns[0];
      if (!row.values[titleCol.id]) row.values[titleCol.id] = 'New Row';

      // 2.7.3) Добавляем строку
      t.rows.push(row);
      return next;
    }
    default:
      return next;
  }
}
