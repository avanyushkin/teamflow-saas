/*
  утилита для объединения css-классов (стд хелпер в проектах на shadcn/ui)
*/

import { clsx, type ClassValue } from "clsx" // собирает css-классы в одну строку, убирает дублирующиеся классы
import { twMerge } from "tailwind-merge" // убирает конфликтующие tailwind-css классы

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
  // сначала clsx собирает классы в одну строку, убирает дублирующиеся классы, потом twMerge убирает конфликтующие tailwind-css классы
}
