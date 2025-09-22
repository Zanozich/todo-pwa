/**
 * Файл: src/components/TableView.tsx
 * Назначение: Табличное представление.
 * В этой правке:
 *  1) Принудительно используем table-layout: fixed (через класс table-fixed),
 *  2) Добавляем <colgroup> и выставляем ширины колонок из meta.columnWidths,
 *     чтобы сохранённые ширины применялись на рендере.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import type { ColumnDef, TableData } from '@/types/model';

export function TableView({
  ...props
}: {
  table: TableData;
  onEditCell: (rowId: string, colId: string, v: any) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onAddColumn: () => void;
  onDeleteColumn: (colId: string) => void;
  onResizeColumn: (colId: string, width: number) => void;
}) {
  const {
    table,
    onEditCell,
    onAddRow,
    onDeleteRow,
    onAddColumn,
    onDeleteColumn,
    onResizeColumn,
  } = props;
  const cols = useMemo(
    () => [...table.columns].sort((a, b) => a.order - b.order),
    [table.columns]
  );

  return (
    <div className='h-full w-full flex flex-col'>
      <div className='flex items-center gap-2 mb-2'>
        <Button onClick={onAddRow}>
          <Plus className='h-4 w-4 mr-1' /> Add row
        </Button>
        <Button variant='outline' onClick={onAddColumn}>
          <Plus className='h-4 w-4 mr-1' /> Add column
        </Button>
      </div>

      <div className='overflow-auto rounded-xl border'>
        {/* table-fixed заставляет браузер уважать явные ширины колонок */}
        <table className='w-full text-sm table-fixed'>
          {/* colgroup задаёт ширины для каждой колонки */}
          <colgroup>
            {cols.map((c) => {
              const w = table.meta?.columnWidths?.[c.id];
              return (
                <col key={c.id} style={w ? { width: `${w}px` } : undefined} />
              );
            })}
            <col style={{ width: '4rem' }} />
          </colgroup>

          <thead className='bg-muted'>
            <tr>
              {cols.map((c) => (
                <ResizableTH
                  key={c.id}
                  col={c}
                  width={table.meta?.columnWidths?.[c.id]}
                  onResize={(w) => onResizeColumn(c.id, w)}
                  onDelete={() => {
                    if (confirm(`Delete column "${c.name}"?`))
                      onDeleteColumn(c.id);
                  }}
                />
              ))}
              <th className='px-2 py-2 text-right'>⋯</th>
            </tr>
          </thead>

          <tbody>
            {table.rows.map((r) => (
              <tr key={r.id} className='border-t'>
                {cols.map((c) => (
                  <td key={c.id} className='px-3 py-1 align-top'>
                    <CellEditor
                      value={r.values[c.id]}
                      col={c}
                      onChange={(v) => onEditCell(r.id, c.id, v)}
                    />
                  </td>
                ))}
                <td className='px-2 py-1 text-right'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      if (confirm(`Delete row ${r.id}?`)) onDeleteRow(r.id);
                    }}
                    title='Delete row'
                    className='text-muted-foreground hover:text-red-600'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2) Редактор ячейки по типу колонки
function CellEditor({
  value,
  col,
  onChange,
}: {
  value: any;
  col: ColumnDef;
  onChange: (v: any) => void;
}) {
  // 2.1) Чекбокс
  if (col.type === 'checkbox') {
    return (
      <input
        type='checkbox'
        className='h-4 w-4'
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  // 2.2) Текстовый инпут
  return (
    <Input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={col.name}
    />
  );
}

// 3) Заголовок колонки с ресайзом и удалением
function ResizableTH({
  col,
  width,
  onResize,
  onDelete,
}: {
  col: ColumnDef;
  width?: number;
  onResize: (w: number) => void;
  onDelete: () => void;
}) {
  // 3.1) Перетаскивание для ресайза
  const thRef = useRef<HTMLTableCellElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging || !thRef.current) return;
      const rect = thRef.current.getBoundingClientRect();
      const w = Math.max(80, e.clientX - rect.left);
      onResize(Math.round(w));
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, onResize]);

  return (
    <th
      ref={thRef}
      className='text-left px-3 py-2 whitespace-nowrap font-semibold relative'
      style={{ width: width ?? undefined }}
    >
      <div className='flex items-center gap-2'>
        <span>{col.name}</span>
        <Button
          variant='ghost'
          size='icon'
          title='Delete column'
          onClick={onDelete}
          className='text-muted-foreground hover:text-red-600'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
      {/* 3.2) Хэндл ресайза */}
      <div
        onMouseDown={() => setDragging(true)}
        className='absolute top-0 right-0 h-full w-1 cursor-col-resize select-none'
      />
    </th>
  );
}
