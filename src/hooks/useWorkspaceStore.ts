/**
 * Файл: src/hooks/useWorkspaceStore.ts
 * Назначение: Local-first хранилище в OPFS (Origin Private File System):
 *  - readFromOpfs / writeToOpfs
 *  - useAutoSave (автосохранение)
 *  - БЭКАПЫ: createBackup / listBackups / restoreBackup / downloadBackup
 */

import { useEffect, useMemo, useRef } from 'react';
import type { AppModel } from '@/types/model';

const FILE_NAME = 'workspace.todo.json';
const BACKUPS_DIR = 'backups';
const AUTO_BACKUP_EVERY_MS = 10 * 60 * 1000; // каждые 10 минут
const LAST_BACKUP_KEY = 'todo-pwa:lastBackupAt';

// ===== Helpers
function tsName() {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    '-' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0')
  );
}

async function getRootDir(): Promise<any> {
  return await navigator.storage.getDirectory();
}

async function getBackupsDir(): Promise<any> {
  const root = await getRootDir();
  return await root.getDirectoryHandle(BACKUPS_DIR, { create: true });
}

// ===== Основной файл
export async function readFromOpfs(): Promise<AppModel | null> {
  try {
    const root = await getRootDir();
    const handle = await root.getFileHandle(FILE_NAME, { create: false });
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text) as AppModel;
  } catch {
    return null;
  }
}

export async function writeToOpfs(model: AppModel): Promise<void> {
  const root = await getRootDir();
  const handle = await root.getFileHandle(FILE_NAME, { create: true });
  if (handle.createSyncAccessHandle) {
    const access = await handle.createSyncAccessHandle();
    const data = new TextEncoder().encode(JSON.stringify(model, null, 2));
    await access.truncate(0);
    await access.write(data, { at: 0 });
    await access.flush();
    await access.close();
  } else {
    const writable = await handle.createWritable();
    await writable.write(
      new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' })
    );
    await writable.close();
  }
}

// ===== Бэкапы (OPFS/backups/*.json)
export type BackupInfo = {
  fileName: string; // например: backup-20250922-143012.json
  size: number;
  lastModified: number;
};

export async function createBackup(model: AppModel): Promise<BackupInfo> {
  const dir = await getBackupsDir();
  const name = `backup-${tsName()}.json`;
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(
    new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' })
  );
  await writable.close();
  const file = await handle.getFile();
  return { fileName: name, size: file.size, lastModified: file.lastModified };
}

export async function listBackups(): Promise<BackupInfo[]> {
  const dir = await getBackupsDir();
  const out: BackupInfo[] = [];
  for await (const [name, entry] of dir.entries()) {
    if (entry.kind === 'file' && name.endsWith('.json')) {
      const f = await entry.getFile();
      out.push({ fileName: name, size: f.size, lastModified: f.lastModified });
    }
  }
  // новые сверху
  return out.sort((a, b) => b.lastModified - a.lastModified);
}

export async function restoreBackup(fileName: string): Promise<AppModel> {
  const dir = await getBackupsDir();
  const handle = await dir.getFileHandle(fileName, { create: false });
  const file = await handle.getFile();
  const text = await file.text();
  return JSON.parse(text) as AppModel;
}

export async function downloadBackup(fileName: string) {
  const dir = await getBackupsDir();
  const handle = await dir.getFileHandle(fileName, { create: false });
  const file = await handle.getFile();
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Автосохранение + авто-бэкап (каждые N минут)
export function useAutoSave(model: AppModel, delayMs = 800) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        await writeToOpfs(model);
        const last = Number(localStorage.getItem(LAST_BACKUP_KEY) ?? '0');
        if (Date.now() - last >= AUTO_BACKUP_EVERY_MS) {
          // создаём авто-снимок
          try {
            await createBackup(model);
            localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
          } catch (e) {
            // не мешаем работе, если бэкап не удался
            console.warn('Auto-backup failed:', e);
          }
        }
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }, delayMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [model, delayMs]);

  return useMemo(() => ({ fileName: FILE_NAME }), []);
}
