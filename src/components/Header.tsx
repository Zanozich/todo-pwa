/**
 * File: src/components/Header.tsx
 * Purpose: Top bar with sidebar toggle, current workspace/table title, and utilities.
 */

import { Button } from '@/components/ui/button';
import {
  Table as TableIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type HeaderProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  dbName?: string;
  tableName?: string;
  onOpenBackups: () => void;
};

export function Header({
  isSidebarOpen,
  onToggleSidebar,
  dbName,
  tableName,
  onOpenBackups,
}: HeaderProps) {
  return (
    <div className='h-14 flex items-center gap-3 px-4 border-b bg-background/60 backdrop-blur'>
      <Button variant='ghost' onClick={onToggleSidebar} title='Toggle sidebar'>
        {isSidebarOpen ? (
          <PanelLeftClose className='h-4 w-4' />
        ) : (
          <PanelLeftOpen className='h-4 w-4' />
        )}
      </Button>

      <div className='font-semibold text-lg flex items-center gap-2'>
        <TableIcon className='h-5 w-5' />
        <span>{dbName ?? 'Untitled'}</span>
        <span className='text-muted-foreground'>/</span>
        <span>{tableName ?? '(no table)'}</span>
      </div>

      <div className='ml-auto flex items-center gap-3'>
        <Button variant='outline' onClick={onOpenBackups}>
          Backups
        </Button>
      </div>
    </div>
  );
}
