/**
 * File: src/components/PathBar.tsx
 * Purpose: Compact technical address preview "ws : table : row : col",
 *          shown just above the CommandBar.
 */

export function PathBar({
  ws,
  table,
  row,
  col,
  isSidebarOpen,
}: {
  ws?: string;
  table?: string;
  row?: number | null;
  col?: number | null;
  isSidebarOpen: boolean;
}) {
  return (
    <div
      className='fixed right-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-3 py-1'
      style={{
        left: isSidebarOpen ? '18rem' : '0',
        bottom: '3rem', // ~48px above CommandBar
        transition: 'left 200ms ease',
      }}
    >
      <span className='font-mono text-xs text-muted-foreground'>
        {ws ?? '–'} : {table ?? '–'} : {row ?? '–'} : {col ?? '–'}
      </span>
    </div>
  );
}
