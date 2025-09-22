/**
 * Файл: src/components/KanbanView.tsx
 * Назначение: Канбан-представление.
 * В этой правке:
 *  - Группировка строго по выбранной колонке типа "select".
 *  - Список колонок формируется из column.options (если есть) И/ИЛИ из фактических значений в данных.
 *  - Значения, которых нет в options, добавляются в конец.
 *  - Пустые/неизвестные значения идут в колонку "(No value)".
 */

import { useMemo } from 'react';
import type { TableData } from '@/types/model';
import { Card } from '@/components/ui/card';

export function KanbanView({
  table,
  groupBy,
}: {
  table: TableData;
  groupBy: string;
}) {
  // 1) Находим колонку для группировки
  const groupCol = useMemo(
    () => table.columns.find((c) => c.name === groupBy && c.type === 'select'),
    [table.columns, groupBy]
  );

  // 2) Формируем список колонок канбана
  const columns = useMemo(() => {
    const NO = '(No value)';
    if (!groupCol) {
      // fallback — одна колонка со всем
      return [{ key: NO, title: NO }];
    }
    const fromOptions = (groupCol.options ?? []).filter(Boolean);
    const fromData = new Set<string>();
    for (const r of table.rows) {
      const v = r.values[groupCol.id];
      if (v === undefined || v === null || String(v).trim() === '') continue;
      fromData.add(String(v));
    }
    // порядок: options (как в схеме) → потом значения, которых нет в options → и колонка "No value" всегда последняя
    const extra = [...fromData].filter((v) => !fromOptions.includes(v));
    return [
      ...fromOptions.map((v) => ({ key: v, title: v })),
      ...extra.map((v) => ({ key: v, title: v })),
      { key: NO, title: NO },
    ];
  }, [groupCol, table.rows]);

  // 3) Ряды по колонкам
  const rowsByCol = useMemo(() => {
    const map = new Map<string, typeof table.rows>();
    for (const c of columns) map.set(c.key, []);
    const NO = '(No value)';
    for (const r of table.rows) {
      if (!groupCol) {
        map.get(NO)!.push(r);
        continue;
      }
      const raw = r.values[groupCol.id];
      const key =
        raw === undefined || raw === null || String(raw).trim() === ''
          ? NO
          : String(raw);
      if (!map.has(key)) map.set(key, []); // на случай новых значений
      map.get(key)!.push(r);
    }
    return map;
  }, [columns, groupCol, table.rows]);

  return (
    <div
      className='grid gap-4'
      style={{
        gridTemplateColumns: `repeat(${Math.max(
          1,
          columns.length
        )}, minmax(220px, 1fr))`,
      }}
    >
      {columns.map((c) => (
        <div key={c.key} className='space-y-2'>
          <div className='text-sm font-semibold'>{c.title}</div>
          <div className='space-y-2'>
            {rowsByCol.get(c.key)!.map((r) => (
              <Card key={r.id} className='p-2'>
                <div className='font-medium'>
                  {String(r.values[table.columns[0]?.id] ?? `Row ${r.id}`)}
                </div>
                {/* можно добавить отображение пары ключевых полей */}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
