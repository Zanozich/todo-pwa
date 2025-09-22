# TODO PWA — Local-First Task Manager

![Status](https://img.shields.io/badge/status-WIP-yellow)

> **Status:** Work in progress (pet project). Stable enough to play with daily, but APIs/UX may change.

---

[!WARNING]
**Keep in mind:** This app isn’t (and won’t be) optimized for large datasets.
It re-renders most components on any state change. For my personal use, that’s fine.

A local-first, backend-free to-do manager built with React + Vite + Tailwind v4 + shadcn/ui.  
Data is persisted **entirely in your browser** using OPFS (Origin Private File System), so it works offline.  
You can view and manage your tasks as a **Table** or as a **Kanban**, and drive everything quickly via a **command bar**.

---

## Why

- **Local-first**: keep data on your machine; zero server setup.
- **Fast workflows**: keyboard-first command bar + simple structure you can tweak.
- **Free and the best is made by urself**: =)

---

## Features

- **Two views**
  - **Table**: inline edit cells, **resizable columns (persisted)** via OPFS.
  - **Kanban**: group by a `select` column. **Dynamic columns** are formed from schema options _and_ actual data, plus a `(No value)` column.
- **Local storage**
  - **OPFS autosave** on every change.
  - **Backups**: automatic snapshots (periodic) + **manual backup**, list/download/restore (stored in `OPFS/backups`).
- **Command bar**
  - Always available at the bottom.
  - **Hotkeys** to focus: ` Ctrl+\`` /  `Ctrl+Ё`/`Ctrl/Cmd+K`.
  - Toggle sidebar: `Ctrl+B` / `Ctrl+И`.
- **Sidebar**
  - Workspaces & tables management, **collapsible** with smooth animation (content shifts).
- **No backend required**
  - Pure frontend PWA; runs entirely in the browser.

> **Planned / Next**:
>
> - Customizable Kanban **card template** (choose fields to display).
> - Command syntax v2 (quick input with custom separators).
> - Enum (select) **colors** per option.
> - Subtasks, Undo/Redo.
> - Backup rotation & metadata labels.
> - smth.

---

## Tech Stack

- **React** (TypeScript) + **Vite**
- **Tailwind CSS v4** + `@tailwindcss/vite`
- **shadcn/ui** components
- **OPFS** (Origin Private File System) for persistence (no server)

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
