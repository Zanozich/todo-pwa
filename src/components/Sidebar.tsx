/**
 * File: src/components/Sidebar.tsx
 * Purpose: Left navigation — workspaces and tables. Create/select/delete actions.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Database, Plus, Table as TableIcon, Trash2 } from 'lucide-react';
import type { DB } from '@/types/model';

export function Sidebar({
  dbs,
  currentDBId,
  currentTableId,
  onSelectDB,
  onSelectTable,
  onAddDB,
  onAddTable,
  onDeleteDB,
  onDeleteTable,
}: {
  dbs: DB[];
  currentDBId?: string;
  currentTableId?: string;
  onSelectDB: (id: string) => void;
  onSelectTable: (dbId: string, tableId: string) => void;
  onAddDB: () => void;
  onAddTable: (dbId: string) => void;
  onDeleteDB: (dbId: string) => void;
  onDeleteTable: (dbId: string, tableId: string) => void;
}) {
  return (
    <div className='h-full w-72 border-r bg-background/60 backdrop-blur-sm'>
      <div className='p-3 flex items-center gap-2'>
        <Database className='h-5 w-5' />
        <div className='font-semibold'>Workspaces</div>
        <div className='ml-auto flex gap-1'>
          {/* Add workspace */}
          <Button
            variant='ghost'
            size='icon'
            onClick={onAddDB}
            title='Add workspace'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <Separator />

      <ScrollArea className='h-[calc(100%-3rem)] p-2'>
        <div className='space-y-2'>
          {dbs.map((db) => (
            <div key={db.id} className='rounded-xl border'>
              {/* Workspace header */}
              <div
                className={`flex items-center gap-2 p-2 cursor-pointer ${
                  currentDBId === db.id ? 'bg-muted' : 'hover:bg-muted/60'
                }`}
                onClick={() => onSelectDB(db.id)}
              >
                <span className='font-medium truncate'>{db.name}</span>
                <Badge variant='secondary' className='ml-auto'>
                  {db.tables.length}
                </Badge>
                {/* Delete workspace */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete workspace "${db.name}"?`))
                      onDeleteDB(db.id);
                  }}
                  title='Delete workspace'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
                {/* Add table */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTable(db.id);
                  }}
                  title='Add table'
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              {/* Tables of active workspace */}
              {currentDBId === db.id && (
                <div className='px-2 pb-2 space-y-1'>
                  {db.tables.map((t) => (
                    <div key={t.id} className='flex items-center'>
                      <button
                        onClick={() => onSelectTable(db.id, t.id)}
                        className={`flex-1 text-left text-sm px-2 py-1 rounded-md flex items-center gap-2 ${
                          currentTableId === t.id
                            ? 'bg-accent'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <TableIcon className='h-4 w-4' />
                        <span className='truncate'>{t.name}</span>
                      </button>
                      {/* Delete table */}
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete table "${t.name}"?`))
                            onDeleteTable(db.id, t.id);
                        }}
                        title='Delete table'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
