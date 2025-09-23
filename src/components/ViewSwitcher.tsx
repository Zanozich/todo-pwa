/**
 * File: src/components/ViewSwitcher.tsx
 * Purpose: Tabs for Table/Kanban + column select for group-by (any column).
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Columns, Table as TableIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@/types/model';

export type ViewSwitcherProps = {
  view: 'table' | 'kanban';
  onChangeView: (v: 'table' | 'kanban') => void;
  columns: ColumnDef[];
  groupByColumnId?: string;
  onChangeGroupBy: (id?: string) => void;
};

export function ViewSwitcher({
  view,
  onChangeView,
  columns,
  groupByColumnId,
  onChangeGroupBy,
}: ViewSwitcherProps) {
  const activeName =
    columns.find((c) => c.id === groupByColumnId)?.name ?? '(none)';

  return (
    <div className='px-4 py-3 border-b flex items-center gap-2'>
      <Tabs value={view} onValueChange={(v: any) => onChangeView(v)}>
        <TabsList>
          <TabsTrigger value='table'>
            <TableIcon className='h-4 w-4 mr-1' /> Table
          </TabsTrigger>
          <TabsTrigger value='kanban'>
            <Columns className='h-4 w-4 mr-1' /> Kanban
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'kanban' && (
        <>
          <div className='ml-2 text-sm text-muted-foreground'>
            Active: <Badge variant='secondary'>{activeName}</Badge>
          </div>
          <div className='ml-4 flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Group by:</span>
            <Select
              value={groupByColumnId}
              onValueChange={(id) => onChangeGroupBy(id)}
            >
              <SelectTrigger className='w-44'>
                <SelectValue placeholder='Select column' />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
