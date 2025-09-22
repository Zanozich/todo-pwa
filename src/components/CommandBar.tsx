/**
 * Файл: src/components/CommandBar.tsx
 * Назначение: Нижняя фиксированная панель ввода команд и отправка наверх onExecute. Поддерживает глобальный фокус.
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 1) Панель: инпут + кнопка Run
export function CommandBar({
  onExecute,
  isSideBarOpened,
}: {
  onExecute: (cmd: string) => void;
  isSideBarOpened: boolean;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  // 1.1) Фокус по кастомному событию
  useEffect(() => {
    function onFocusRequest() {
      ref.current?.focus();
    }
    window.addEventListener('focus-command', onFocusRequest as EventListener);
    return () =>
      window.removeEventListener(
        'focus-command',
        onFocusRequest as EventListener
      );
  }, []);

  // 1.2) Отправляем команду
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onExecute(v);
    setValue('');
  }

  return (
    <div
      className='fixed bottom-0 right-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-2'
      style={{
        left: isSideBarOpened ? '18rem' : '0',
        transition: 'left 200ms ease',
      }}
    >
      <form onSubmit={handleSubmit} className='flex items-center gap-2'>
        <Input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Type a command… e.g. /add table "Tasks" | /view kanban by:Status | /add row title:"Buy milk" status:Todo'
        />
        <Button type='submit'>Run</Button>
      </form>
    </div>
  );
}
