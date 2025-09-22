/**
 * Файл: src/components/BackupsDialog.tsx
 * Назначение: Диалог со списком бэкапов (OPFS/backups), кнопки:
 *  - Create backup now
 *  - Download
 *  - Restore (подтверждение)
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppModel } from '@/types/model';
import {
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup,
} from '@/hooks/useWorkspaceStore';

export function BackupsDialog({
  open,
  onOpenChange,
  onRestore,
  currentModel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRestore: (model: AppModel) => void;
  currentModel: AppModel;
}) {
  const [items, setItems] = useState<
    { fileName: string; size: number; lastModified: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await listBackups());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  async function handleCreate() {
    await createBackup(currentModel);
    await refresh();
  }

  async function handleRestore(name: string) {
    if (!confirm(`Restore from "${name}"? Current data will be replaced.`))
      return;
    const m = await restoreBackup(name);
    onRestore(m);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Backups</DialogTitle>
        </DialogHeader>

        <div className='mb-3'>
          <Button onClick={handleCreate} disabled={loading}>
            Create backup now
          </Button>
        </div>

        <ScrollArea className='h-64 rounded border'>
          <div className='divide-y'>
            {items.map((b) => (
              <div key={b.fileName} className='flex items-center gap-2 p-2'>
                <div className='flex-1'>
                  <div className='font-mono text-sm'>{b.fileName}</div>
                  <div className='text-xs text-muted-foreground'>
                    {(b.size / 1024).toFixed(1)} KB ·{' '}
                    {new Date(b.lastModified).toLocaleString()}
                  </div>
                </div>
                <Button
                  variant='outline'
                  onClick={() => downloadBackup(b.fileName)}
                >
                  Download
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => handleRestore(b.fileName)}
                >
                  Restore
                </Button>
              </div>
            ))}
            {items.length === 0 && (
              <div className='p-4 text-sm text-muted-foreground'>
                No backups yet.
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
