# TODO PWA — Local-First Task Manager

![Status](https://img.shields.io/badge/status-WIP-yellow)

> **Status:** Work in progress (pet project). Stable enough for daily use, but APIs/UX may change.  
> ⚠️ **Performance note:** This app is not (and won’t be) optimized for large datasets. Most components re-render when state changes. That’s acceptable for my personal use.

A local-first, backend-free to-do manager built with **React + Vite + Tailwind v4 + shadcn/ui**.  
All data is kept **entirely in your browser** via **OPFS (Origin Private File System)** — works offline.  
Manage tasks as a **Table** or **Kanban**, and drive workflows fast via a **command bar**.

---

## Why

- **Local-first:** keep data on your machine; zero server setup.
- **Fast workflows:** keyboard-first command bar; minimal UI friction.
- **Pet project:** tuned for my needs; simple, transparent architecture.

---

## Features

- **Two views**
  - **Table:** inline cell edit, **resizable columns (persisted)**.
  - **Kanban:** group by a `select` column. **Dynamic columns** = schema options + actual data; “(No value)” column appears **only if** there are empty values.
- **Local storage**
  - **OPFS autosave** on every change.
  - **Backups:** automatic snapshots + **manual backup** (stored under `OPFS/backups`) with list/download/restore.
- **Command bar**
  - Fixed at the bottom.
  - **Hotkeys:** focus ` Ctrl+\`` /  `Ctrl+Ё`/`Ctrl/Cmd+K`; toggle sidebar `Ctrl+B`/`Ctrl+И`.
- **Sidebar**
  - Workspaces & tables management, **collapsible** with smooth layout shift.
- **No backend**
  - Pure frontend PWA; runs completely in the browser.

---

## Data & Storage

```text
Primary file:  workspace.todo.json (OPFS, private to this origin)
Backups:       OPFS/backups/*.json  (automatic & manual snapshots)
Manual ops:    Create, download, restore backups from UI
Support:       OPFS is supported in modern Chromium-based browsers (latest Chrome/Edge)
```

---

## Keyboard Shortcuts

```text
Focus command bar:  Ctrl+` / Ctrl+Ё / Ctrl/Cmd+K
Toggle sidebar:     Ctrl+B / Ctrl+И
```

---

## Command Language (v1.3)

**Intro.** Paths use the format `ws:table:row:col`. You can pass **absolute** paths (e.g. `Work:Tasks:10:2`) or **relative** forms starting with `:` (e.g. `:Tasks`, `:10:2`, `:_:3`, `:` to go up).

### Cheat sheet

```text
/s [path?]                 → Select path (ws:table:row:col). “:” forms = relative.
/v [path?] table           → Switch to Table view (optionally after selecting path).
/v [path?] kanban [by]     → Switch to Kanban (group by column name or 1-based index).
```

### Path syntax (short)

- **Absolute:** `ws[:table[:row[:col]]]`
- **Relative:**
  - `:` go up one level; `::` go up two; etc.
  - `:Tasks` switch table in current workspace
  - `:10` select row 10 (in current table)
  - `:10:2` select cell (row 10, col 2)
  - `:_:3` select column 3
  - `:Tasks:10:2` switch table then select cell
- **Single token inside `ws:table`**: treated as **workspace** first; if not found — as **table** in current workspace.
- **No auto-create** in `/s` and `/v`: invalid targets do not change state (toasts planned in Sprint 4).

### Examples

```text
/s Work                     → select workspace “Work”
/s Work:Tasks               → select ws “Work”, table “Tasks”
/s :Tasks                   → switch table to “Tasks” (current ws)
/s :10:2                    → select cell row=10, col=2
/v table                    → switch current table to Table view
/v kanban Status            → Kanban grouped by “Status” (by name)
/v Work:Tasks kanban 2      → select path then Kanban grouped by 2nd column
```

---

## Getting Started

```bash
# install deps
npm install

# start dev server
npm run dev

# build for production
npm run build

# preview the production build
npm run preview
```

---

## Roadmap (Sprint 4 highlights)

- **Commands & UI**
  - Rename workspace/table via UI **and** via commands.
  - `/v` with **no path** should work consistently (use current selection).
  - Errors & notifications (toast) for invalid `/s` and `/v`.
  - Bootstrap-only auto-select (don’t auto-jump after `/s` to root).
- **Kanban**
  - Configurable card template (fields to show).
- **Table**
  - Per-option colors for `select` (applied in Table & Kanban).
- **Data safety**
  - Backup rotation & metadata; Undo/Redo (in-memory).

---
