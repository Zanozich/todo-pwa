/**
 * Файл: src/App.tsx
 * Назначение: Каркас приложения — Sidebar, верхняя панель, Table/Kanban, CommandBar.
 * В этой правке:
 *  1) Анимация сайдбара: всегда держим 2 колонки (0↔18rem), чтобы был плавный сдвиг.
 *  2) Хоткей-дублёр: добавляем Ctrl/Cmd+K для фокуса командной строки.
 *  3) Селектор группировки для канбана по колонке типа "select".
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Table as TableIcon,
  Columns,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/Sidebar';
import { TableView } from '@/components/TableView';
import { KanbanView } from '@/components/KanbanView';
import { CommandBar } from '@/components/CommandBar';
import { BackupsDialog } from '@/components/BackupsDialog';

// ↓ добавлен шадсн Select для выбора groupBy
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

import type { AppModel, ColumnDef } from '@/types/model';
import { execute, parseCommand } from '@/lib/commands';
import { makeDefaultDB } from '@/lib/factories';
import { uid } from '@/lib/id';
import {
  readFromOpfs,
  writeToOpfs,
  useAutoSave,
} from '@/hooks/useWorkspaceStore';

export default function App() {
  // 1) Модель
  const [model, setModel] = useState<AppModel>(() => ({
    dbs: [makeDefaultDB()],
    currentDBId: undefined,
    currentTableId: undefined,
    view: 'table',
    kanbanGroupBy: 'Status',
    settings: { isSidebarOpen: true, commandSeparator: '\\' },
  }));

  // 2) Загрузка/автосейв
  useEffect(() => {
    (async () => {
      const existing = await readFromOpfs();
      if (existing) setModel(existing);
      else await writeToOpfs(model);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useAutoSave(model, 800);

  // 3) Текущие ссылки
  useEffect(() => {
    if (!model.currentDBId && model.dbs.length) {
      setModel((m) => ({
        ...m,
        currentDBId: m.dbs[0].id,
        currentTableId: m.dbs[0].tables[0].id,
      }));
    }
  }, [model.currentDBId, model.dbs.length]);
  const currentDB = model.dbs.find((d) => d.id === model.currentDBId);
  const currentTable = currentDB?.tables.find(
    (t) => t.id === model.currentTableId
  );

  // 4) Выполнить команду
  function run(cmd: string) {
    const action = parseCommand(cmd);
    setModel((m) => execute(m, action));
  }

  // 5) Таблица: CRUD/resize
  function editCell(rowId: string, colId: string, v: any) {
    setModel((m) => {
      const next = structuredClone(m) as AppModel;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      const r = t.rows.find((r) => r.id === rowId)!;
      r.values[colId] = v;
      return next;
    });
  }
  function addRow() {
    setModel((m) => execute(m, { action: 'addRow', data: {} }));
  }
  function deleteRow(rowId: string) {
    setModel((m) => {
      const next = structuredClone(m) as AppModel;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      t.rows = t.rows.filter((r) => r.id !== rowId);
      return next;
    });
  }
  function addColumn() {
    const name = prompt('Column name?');
    if (!name) return;
    const type = (prompt('Type (text|number|checkbox|date|select)?', 'text') ||
      'text') as any;
    const options =
      type === 'select'
        ? (prompt('Options (comma-separated)?', 'Todo,Doing,Done') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    setModel((m) => {
      const next = structuredClone(m) as AppModel;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      const order = t.columns.length
        ? Math.max(...t.columns.map((c) => c.order)) + 1
        : 0;
      t.columns.push({ id: uid(), name, type, options, order });
      return next;
    });
  }
  function deleteColumn(colId: string) {
    setModel((m) => {
      const next = structuredClone(m) as AppModel;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      t.columns = t.columns.filter((c) => c.id !== colId);
      for (const r of t.rows) delete r.values[colId];
      t.meta?.columnWidths && delete t.meta.columnWidths[colId];
      return next;
    });
  }
  function resizeColumn(colId: string, width: number) {
    setModel((m) => {
      const next = structuredClone(m) as AppModel;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      t.meta ??= { columnWidths: {} };
      t.meta.columnWidths ??= {};
      t.meta.columnWidths[colId] = width;
      return next;
    });
  }

  // 6) Sidebar toggle
  function toggleSidebar() {
    setModel((m) => ({
      ...m,
      settings: { ...m.settings, isSidebarOpen: !m.settings.isSidebarOpen },
    }));
  }

  // 7) Хоткеи
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key;
      // Фокус командной строки
      if (
        isCtrl &&
        (key === '`' || key === 'ё' || key === 'Ё' || key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        window.dispatchEvent(new Event('focus-command'));
        return;
      }

      // Тоггл сайдбара (Ctrl+B / Ctrl+И)
      if (isCtrl && (key.toLowerCase() === 'b' || key.toLowerCase() === 'и')) {
        e.preventDefault();
        setModel((m) => ({
          ...m,
          settings: { ...m.settings, isSidebarOpen: !m.settings.isSidebarOpen },
        }));
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 8) Список select-колонок для канбана
  const selectColumns = useMemo<ColumnDef[]>(() => {
    return currentTable?.columns.filter((c) => c.type === 'select') ?? [];
  }, [currentTable?.columns]);

  const [showBackups, setShowBackups] = useState(false);

  function applyModel(next: AppModel) {
    // заменяем всю модель (после restore) и сохраняем
    setModel(next);
  }

  return (
    <div
      className='h-screen w-screen grid'
      // Всегда 2 колонки: анимируем первую от 18rem до 0 — так есть плавный сдвиг
      style={{
        gridTemplateColumns: `${
          model.settings.isSidebarOpen ? '18rem' : '0'
        } 1fr`,
        transition: 'grid-template-columns 200ms ease',
      }}
    >
      {/* Левая колонка — контейнер всегда есть (для анимации); контент скрываем визуально */}
      <div className='h-full overflow-hidden'>
        <div
          className={[
            'h-full w-72 border-r bg-background/60 backdrop-blur-sm',
            'transition-opacity duration-200',
            model.settings.isSidebarOpen
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <Sidebar
            dbs={model.dbs}
            currentDBId={model.currentDBId}
            currentTableId={model.currentTableId}
            onSelectDB={(id) =>
              setModel((m) => ({
                ...m,
                currentDBId: id,
                currentTableId: m.dbs.find((d) => d.id === id)!.tables[0].id,
              }))
            }
            onSelectTable={(dbId, tableId) =>
              setModel((m) => ({
                ...m,
                currentDBId: dbId,
                currentTableId: tableId,
              }))
            }
            onAddDB={() =>
              setModel((m) =>
                execute(m, { action: 'addDB', name: 'New Workspace' })
              )
            }
            onAddTable={() =>
              setModel((m) =>
                execute(m, { action: 'addTable', name: 'New Table' })
              )
            }
            onDeleteDB={(dbId) =>
              setModel((m) => {
                const next = structuredClone(m) as AppModel;
                next.dbs = next.dbs.filter((d) => d.id !== dbId);
                if (next.currentDBId === dbId) {
                  next.currentDBId = next.dbs[0]?.id;
                  next.currentTableId = next.dbs[0]?.tables[0]?.id;
                }
                return next;
              })
            }
            onDeleteTable={(dbId, tableId) =>
              setModel((m) => {
                const next = structuredClone(m) as AppModel;
                const db = next.dbs.find((d) => d.id === dbId)!;
                db.tables = db.tables.filter((t) => t.id !== tableId);
                if (next.currentTableId === tableId) {
                  next.currentTableId = db.tables[0]?.id;
                }
                return next;
              })
            }
          />
        </div>
      </div>

      {/* Правая колонка */}
      <div className='relative h-full flex flex-col'>
        {/* Верхняя панель */}
        <div className='h-14 flex items-center gap-2 px-4 border-b bg-background/60 backdrop-blur'>
          <Button
            variant='ghost'
            onClick={toggleSidebar}
            title='Toggle sidebar'
          >
            {model.settings.isSidebarOpen ? (
              <PanelLeftClose className='h-4 w-4' />
            ) : (
              <PanelLeftOpen className='h-4 w-4' />
            )}
          </Button>

          <div className='font-semibold text-lg flex items-center gap-2'>
            <TableIcon className='h-5 w-5' />
            <span>{currentDB?.name ?? 'Untitled'}</span>
            <span className='text-muted-foreground'>/</span>
            <span>{currentTable?.name ?? '(no table)'} </span>
          </div>

          {/* Селектор группировки для канбана — показываем, если есть select-колонки */}
          {model.view === 'kanban' && selectColumns.length > 0 && (
            <div className='ml-4 flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Group by:</span>
              <Select
                value={model.kanbanGroupBy}
                onValueChange={(val: any) =>
                  setModel((m) => ({ ...m, kanbanGroupBy: val }))
                }
              >
                <SelectTrigger className='w-44'>
                  <SelectValue placeholder='Select column' />
                </SelectTrigger>
                <SelectContent>
                  {selectColumns.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='ml-auto' />
          <Button variant='outline' onClick={() => setShowBackups(true)}>
            Backups
          </Button>
        </div>

        {/* Переключатель вида */}
        <div className='px-4 py-3 border-b flex items-center gap-2'>
          <Tabs
            value={model.view}
            onValueChange={(v: any) => setModel((m) => ({ ...m, view: v }))}
          >
            <TabsList>
              <TabsTrigger value='table'>
                <TableIcon className='h-4 w-4 mr-1' /> Table
              </TabsTrigger>
              <TabsTrigger value='kanban'>
                <Columns className='h-4 w-4 mr-1' /> Kanban
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {model.view === 'kanban' && (
            <div className='ml-2 text-sm text-muted-foreground'>
              Active: <Badge variant='secondary'>{model.kanbanGroupBy}</Badge>
            </div>
          )}
        </div>

        {/* Контент */}
        <div className='flex-1 p-4 overflow-auto'>
          {!currentTable ? (
            <div className='text-muted-foreground'>
              Create a table to get started…
            </div>
          ) : model.view === 'table' ? (
            <TableView
              table={currentTable}
              onEditCell={editCell}
              onAddRow={addRow}
              onDeleteRow={deleteRow}
              onAddColumn={addColumn}
              onDeleteColumn={deleteColumn}
              onResizeColumn={resizeColumn}
            />
          ) : (
            <KanbanView table={currentTable} groupBy={model.kanbanGroupBy} />
          )}
        </div>

        {/* Командная строка */}
        <CommandBar
          onExecute={run}
          isSideBarOpened={model.settings.isSidebarOpen}
        />

        <BackupsDialog
          open={showBackups}
          onOpenChange={setShowBackups}
          onRestore={applyModel}
          currentModel={model}
        />
      </div>
    </div>
  );
}
