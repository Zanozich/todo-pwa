/**
 * File: src/App.tsx
 * Purpose: Application shell — layout, sidebar animation, header, view switcher,
 *          content area, path bar and command bar, backups dialog.
 */

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TableView } from '@/components/TableView';
import { KanbanView } from '@/components/KanbanView';
import { CommandBar } from '@/components/CommandBar';
import { BackupsDialog } from '@/components/BackupsDialog';
import { Header } from '@/components/Header';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import { PathBar } from '@/components/PathBar';

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
  const [model, setModel] = useState<AppModel>(() => ({
    dbs: [makeDefaultDB()],
    currentDBId: undefined,
    currentTableId: undefined,
    view: 'table',
    kanbanGroupByColumnId: undefined,
    cursor: { row: null, col: null },
    settings: { isSidebarOpen: true, commandSeparator: '\\' },
  }));

  // Load / persist
  useEffect(() => {
    (async () => {
      const existing = await readFromOpfs();
      if (existing) setModel(existing);
      else await writeToOpfs(model);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useAutoSave(model, 800);

  // Initial pointers (bootstrap only)
  useEffect(() => {
    if (!model.currentDBId && model.dbs.length) {
      setModel((m) => ({
        ...m,
        currentDBId: m.dbs[0].id,
        currentTableId: m.dbs[0].tables[0]?.id,
      }));
    }
  }, [model.currentDBId, model.dbs.length]);

  const currentDB = model.dbs.find((d) => d.id === model.currentDBId);
  const currentTable = currentDB?.tables.find(
    (t) => t.id === model.currentTableId
  );

  // Commands
  function run(cmd: string) {
    const action = parseCommand(cmd);
    setModel((m) => execute(m, action));
  }

  // Table handlers
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
    // UI-only shortcut: add empty row below
    setModel((m) => {
      const next = structuredClone(m) as AppModel;
      const db = next.dbs.find((d) => d.id === next.currentDBId)!;
      const t = db.tables.find((x) => x.id === next.currentTableId)!;
      t.rows.push({ id: uid(), values: {} });
      return next;
    });
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
    const raw =
      type === 'select' ? prompt('Options (comma-separated)?', '') || '' : '';
    const options =
      type === 'select'
        ? raw
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

  // Sidebar toggle + hotkeys
  function toggleSidebar() {
    setModel((m) => ({
      ...m,
      settings: { ...m.settings, isSidebarOpen: !m.settings.isSidebarOpen },
    }));
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key;
      if (
        isCtrl &&
        (key === '`' || key === 'ё' || key === 'Ё' || key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        window.dispatchEvent(new Event('focus-command'));
        return;
      }
      if (isCtrl && (key.toLowerCase() === 'b' || key.toLowerCase() === 'и')) {
        e.preventDefault();
        toggleSidebar();
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Columns for view switcher (all columns)
  const allColumns = useMemo<ColumnDef[]>(
    () => currentTable?.columns ?? [],
    [currentTable?.columns]
  );

  const [showBackups, setShowBackups] = useState(false);

  return (
    <div
      className='h-screen w-screen grid'
      style={{
        gridTemplateColumns: `${
          model.settings.isSidebarOpen ? '18rem' : '0'
        } 1fr`,
        transition: 'grid-template-columns 200ms ease',
      }}
    >
      {/* Sidebar container (kept for smooth animation) */}
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
                currentTableId: m.dbs.find((d) => d.id === id)!.tables[0]?.id,
                cursor: { row: null, col: null },
              }))
            }
            onSelectTable={(dbId, tableId) =>
              setModel((m) => ({
                ...m,
                currentDBId: dbId,
                currentTableId: tableId,
                cursor: { row: null, col: null },
              }))
            }
            onAddDB={() =>
              setModel((m) => ({
                ...m,
                dbs: [...m.dbs, makeDefaultDB('New Workspace')],
              }))
            }
            onAddTable={() =>
              setModel((m) => {
                const next = structuredClone(m) as AppModel;
                const db = next.dbs.find((d) => d.id === next.currentDBId)!;
                db.tables.push({
                  id: uid(),
                  name: 'New Table',
                  columns: [],
                  rows: [],
                  meta: { columnWidths: {} },
                });
                next.currentTableId = db.tables[db.tables.length - 1].id;
                next.cursor = { row: null, col: null };
                return next;
              })
            }
            onDeleteDB={(dbId) =>
              setModel((m) => {
                const next = structuredClone(m) as AppModel;
                next.dbs = next.dbs.filter((d) => d.id !== dbId);
                if (next.currentDBId === dbId) {
                  next.currentDBId = next.dbs[0]?.id;
                  next.currentTableId = next.dbs[0]?.tables[0]?.id;
                  next.cursor = { row: null, col: null };
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
                  next.cursor = { row: null, col: null };
                }
                return next;
              })
            }
          />
        </div>
      </div>

      {/* Right column */}
      <div className='relative h-full flex flex-col'>
        <Header
          isSidebarOpen={model.settings.isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          dbName={currentDB?.name}
          tableName={currentTable?.name}
          onOpenBackups={() => setShowBackups(true)}
        />

        <ViewSwitcher
          view={model.view}
          onChangeView={(v) => setModel((m) => ({ ...m, view: v }))}
          columns={allColumns}
          groupByColumnId={model.kanbanGroupByColumnId}
          onChangeGroupBy={(id) =>
            setModel((m) => ({ ...m, kanbanGroupByColumnId: id }))
          }
        />

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
            <KanbanView
              table={currentTable}
              groupByColumnId={model.kanbanGroupByColumnId}
            />
          )}
        </div>

        {/* Technical path preview above command bar */}
        <PathBar
          ws={currentDB?.name}
          table={currentTable?.name}
          row={model.cursor?.row ?? null}
          col={model.cursor?.col ?? null}
          isSidebarOpen={model.settings.isSidebarOpen}
        />

        {/* Command bar at the very bottom (slides with sidebar) */}
        <CommandBar
          onExecute={run}
          isSideBarOpened={model.settings.isSidebarOpen}
        />

        <BackupsDialog
          open={showBackups}
          onOpenChange={setShowBackups}
          onRestore={(next) => setModel(next)}
          currentModel={model}
        />
      </div>
    </div>
  );
}
