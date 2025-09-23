/**
 * File: src/components/KanbanView.tsx
 * Purpose: Kanban view grouped by ANY column. For select-type columns:
 *          options come first; then extra values from data; finally "(No value)" — only if needed.
 */

import { useMemo } from 'react';
import type { TableData } from '@/types/model';
import { Card } from '@/components/ui/card';

export function KanbanView({
  table,
  groupByColumnId,
}: {
  table: TableData;
  groupByColumnId?: string;
}) {
  const groupCol = useMemo(
    () => table.columns.find((c) => c.id === groupByColumnId),
    [table.columns, groupByColumnId]
  );

  const columns = useMemo(() => {
    const NO = '(No value)';
    if (!groupCol) {
      return [{ key: NO, title: NO }];
    }

    const fromOptions =
      groupCol.type === 'select'
        ? (groupCol.options ?? []).filter(Boolean)
        : [];

    const fromData = new Set<string>();
    let hasEmpty = false;
    for (const r of table.rows) {
      const raw = r.values[groupByColumnId!];
      if (raw === undefined || raw === null || String(raw).trim() === '') {
        hasEmpty = true;
        continue;
      }
      fromData.add(String(raw));
    }

    const extra = [...fromData].filter((v) => !fromOptions.includes(v));

    const list = [
      ...fromOptions.map((v) => ({ key: v, title: v })),
      ...extra.map((v) => ({ key: v, title: v })),
    ];
    if (hasEmpty) list.push({ key: NO, title: NO });

    // If options and data are both empty, still show a fallback column
    return list.length ? list : [{ key: NO, title: NO }];
  }, [groupCol, groupByColumnId, table.rows]);

  const rowsByCol = useMemo(() => {
    const map = new Map<string, typeof table.rows>();
    for (const c of columns) map.set(c.key, []);
    const NO = '(No value)';
    for (const r of table.rows) {
      if (!groupCol) {
        map.get(NO)!.push(r);
        continue;
      }
      const raw = r.values[groupByColumnId!];
      const key =
        raw === undefined || raw === null || String(raw).trim() === ''
          ? NO
          : String(raw);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [columns, groupCol, groupByColumnId, table.rows]);

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
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
