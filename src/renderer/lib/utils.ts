import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in CNY
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

// Format month display (e.g., "12月" for December)
export function formatMonth(month: string): string {
  return `${month}月`
}

// Parse month from string (e.g., "2024-12" -> "12")
export function parseMonth(dateString: string): string {
  const parts = dateString.split('-')
  return parts.length > 1 ? parts[1] : dateString
}

// Get current month in format "YYYY-MM"
export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// Format date for display
export function formatDate(date: string | Date): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
