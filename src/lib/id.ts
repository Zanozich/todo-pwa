/**
 * Файл: src/lib/id.ts
 * Назначение: Утилиты (генерация id).
 */

export const uid = () => Math.random().toString(36).slice(2, 10);
