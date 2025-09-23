/**
 * File: src/lib/commands.ts
 * Purpose: Command language (v1.4) — only the current spec:
 *   - /s [path]     → select path (ws:table:row:col), supports relative ":" forms
 *   - /v [path] ... → view table | view kanban <column|1-based index>
 *
 * Path rules (short):
 *   - Absolute:  ws[:table[:row[:col]]]
 *   - Relative:  ":" (go up 1 level), "::" (up 2), ":table", ":1", ":1:2", ":_:3", ":table:10:20"
 *   - Inside ws:table single token prefers workspace name first; if not found — table in current ws.
 *   - No auto-create here; invalid targets do NOT change state.
 */

import type { AppModel, DB, TableData } from '@/types/model';

type Action =
  | { action: 'selectPath'; path: string | null }
  | {
      action: 'view';
      path?: string | null;
      mode: 'table' | 'kanban';
      by?: string;
    }
  | { action: 'unknown' };

export function parseCommand(input: string): Action {
  const cmd = input.trim();
  const lower = cmd.toLowerCase();

  // /s [path?]
  if (
    lower === '/s' ||
    lower.startsWith('/s ') ||
    lower.startsWith('/select')
  ) {
    const arg = cmd.replace(/^\/(s|select)\s*/i, '');
    return { action: 'selectPath', path: arg.length ? arg : null };
  }

  // /v [path] (table|kanban [by])
  if (lower === '/v' || lower.startsWith('/v ')) {
    const rest = cmd.replace(/^\/v\s*/i, '').trim();
    if (!rest) return { action: 'view', mode: 'table' };

    // Forms:
    //   "table"
    //   "kanban <by>"
    //   "<path> table"
    //   "<path> kanban <by>"
    const m = rest.match(/^(.*)\s+(table|kanban)(?:\s+(.*))?$/i);
    if (m) {
      const rawPath = m[1]?.trim();
      const mode = m[2].toLowerCase() as 'table' | 'kanban';
      const by = m[3]?.trim() || undefined;
      if (rawPath) return { action: 'view', path: rawPath, mode, by };
      return { action: 'view', mode, by };
    }

    // No explicit "table|kanban" keyword → assume "table"
    return { action: 'view', mode: 'table' };
  }

  return { action: 'unknown' };
}

// ---------------- helpers ----------------

function findWsByNameOrIndex(m: AppModel, token: string): DB | undefined {
  if (/^\d+$/.test(token)) return m.dbs[Number(token) - 1];
  return m.dbs.find((d) => d.name.toLowerCase() === token.toLowerCase());
}
function findTableByNameOrIndex(db: DB, token: string): TableData | undefined {
  if (/^\d+$/.test(token)) return db.tables[Number(token) - 1];
  return db.tables.find((t) => t.name.toLowerCase() === token.toLowerCase());
}

function selectAbsolute(next: AppModel, arg: string) {
  const tokens = arg.split(':').filter(Boolean);
  if (!tokens.length) return;

  // Single token inside ws:table → try WORKSPACE first, else TABLE in current ws
  if (tokens.length === 1 && next.currentDBId) {
    const token = tokens[0];
    const wsByName = next.dbs.find(
      (d) => d.name.toLowerCase() === token.toLowerCase()
    );
    if (wsByName) {
      next.currentDBId = wsByName.id;
      next.currentTableId = undefined;
      next.cursor = { row: null, col: null };
      return;
    }
    const db = next.dbs.find((d) => d.id === next.currentDBId)!;
    const t = findTableByNameOrIndex(db, token);
    if (t) {
      next.currentTableId = t.id;
      next.cursor = { row: null, col: null };
    }
    return;
  }

  // Full absolute: ws[:table[:row[:col]]]
  const wsTok = tokens[0];
  const ws = findWsByNameOrIndex(next, wsTok);
  if (!ws) return;
  next.currentDBId = ws.id;
  next.currentTableId = undefined;
  next.cursor = { row: null, col: null };

  if (tokens[1]) {
    const tbl = findTableByNameOrIndex(ws, tokens[1]);
    if (!tbl) return;
    next.currentTableId = tbl.id;
  }
  if (tokens[2])
    next.cursor.row = /^\d+$/.test(tokens[2]) ? Number(tokens[2]) : null;
  if (tokens[3])
    next.cursor.col = /^\d+$/.test(tokens[3]) ? Number(tokens[3]) : null;
}

function selectRelative(next: AppModel, arg: string) {
  // ":" up, "::" up2, etc.
  if (/^:+$/.test(arg)) {
    const ups = arg.length;
    for (let i = 0; i < ups; i++) {
      if (next.cursor?.col != null) next.cursor.col = null;
      else if (next.cursor?.row != null) next.cursor.row = null;
      else if (next.currentTableId) next.currentTableId = undefined;
      else if (next.currentDBId) next.currentDBId = undefined;
    }
    return;
  }

  // :table | :1 | :1:2 | :_:3 | :table:10:20
  const rest = arg.slice(1);
  const parts = rest.split(':').filter((p) => p.length);
  const db = next.dbs.find((d) => d.id === next.currentDBId);
  if (!db) return;

  if (parts.length === 1) {
    const p0 = parts[0];
    if (/^\d+$/.test(p0)) {
      // :i → row select
      next.cursor = { row: Number(p0), col: null };
      return;
    }
    // :tableName / index
    const t = findTableByNameOrIndex(db, p0);
    if (t) {
      next.currentTableId = t.id;
      next.cursor = { row: null, col: null };
    }
    return;
  }

  if (parts.length === 2) {
    const [a, b] = parts;
    if (a === '_' && /^\d+$/.test(b)) {
      // :_:j → column select
      next.cursor = { row: null, col: Number(b) };
      return;
    }
    if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
      // :i:j → cell select
      next.cursor = { row: Number(a), col: Number(b) };
      return;
    }
    return;
  }

  // :table:i:j
  if (parts.length >= 3) {
    const [tbl, r, c] = parts;
    const t = findTableByNameOrIndex(db, tbl);
    if (t) {
      next.currentTableId = t.id;
      next.cursor = {
        row: /^\d+$/.test(r) ? Number(r) : null,
        col: /^\d+$/.test(c) ? Number(c) : null,
      };
    }
  }
}

export function execute(model: AppModel, action: Action): AppModel {
  const next: AppModel = JSON.parse(JSON.stringify(model));

  switch (action.action) {
    case 'selectPath': {
      const arg = action.path?.trim();
      if (!arg) {
        // Root — no auto-select here
        next.currentDBId = undefined;
        next.currentTableId = undefined;
        next.cursor = { row: null, col: null };
        return next;
      }
      if (arg.startsWith(':')) selectRelative(next, arg);
      else selectAbsolute(next, arg);
      return next;
    }

    case 'view': {
      // optional path first
      if (action.path?.trim()) {
        const p = action.path.trim();
        if (p.startsWith(':')) selectRelative(next, p);
        else selectAbsolute(next, p);
      }

      next.view = action.mode;
      if (action.mode === 'kanban' && action.by) {
        const db = next.dbs.find((d) => d.id === next.currentDBId);
        const t = db?.tables.find((x) => x.id === next.currentTableId);
        if (t) {
          let colId: string | undefined;
          if (/^\d+$/.test(action.by)) {
            const idx = Number(action.by) - 1;
            colId = t.columns[idx]?.id;
          } else {
            colId = t.columns.find(
              (c) => c.name.toLowerCase() === action.by!.toLowerCase()
            )?.id;
          }
          if (colId) next.kanbanGroupByColumnId = colId;
        }
      }
      return next;
    }

    default:
      return next;
  }
}
