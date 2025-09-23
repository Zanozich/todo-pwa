/**
 * File: src/components/Breadcrumbs.tsx
 * Purpose: Breadcrumbs for current path (ws/table/row/col) with click-up actions.
 * Behavior:
 *  - Shows names/indices; clicking a segment goes "up" to that level.
 *  - Does not own state; delegates to caller via onGoTo(level).
 */

import { ChevronRight } from 'lucide-react';

export type BreadcrumbsProps = {
  wsName?: string;
  tableName?: string;
  row?: number | null;
  col?: number | null;
  onGoTo: (level: 'ws' | 'table' | 'row' | 'col') => void;
};

export function Breadcrumbs({
  wsName,
  tableName,
  row,
  col,
  onGoTo,
}: BreadcrumbsProps) {
  return (
    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
      <button
        className='hover:underline'
        onClick={() => onGoTo('ws')}
        disabled={!wsName}
        title='Go to workspace'
      >
        {wsName ?? '(no ws)'}
      </button>
      <ChevronRight className='h-3 w-3' />
      <button
        className='hover:underline'
        onClick={() => onGoTo('table')}
        disabled={!tableName}
        title='Go to table'
      >
        {tableName ?? '(no table)'}
      </button>
      <ChevronRight className='h-3 w-3' />
      <button
        className='hover:underline'
        onClick={() => onGoTo('row')}
        disabled={row == null}
        title='Go to row level'
      >
        Row: {row ?? '—'}
      </button>
      <ChevronRight className='h-3 w-3' />
      <button
        className='hover:underline'
        onClick={() => onGoTo('col')}
        disabled={col == null}
        title='Go to col level'
      >
        Col: {col ?? '—'}
      </button>
    </div>
  );
}
