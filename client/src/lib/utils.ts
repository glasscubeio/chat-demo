import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatSize = (b: number) =>
  b < 1024 ** 2 ? `${Math.ceil(b / 1024)} KB` : `${(b / 1024 ** 2).toFixed(1)} MB`
