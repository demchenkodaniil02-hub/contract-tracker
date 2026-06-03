import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ContractStatus, Direction, PaymentStatus, StageStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: ru }) } catch { return dateStr }
}

export function isOverdue(endDate: string, status: ContractStatus): boolean {
  if (status === 'completed' || status === 'cancelled') return false
  if (!endDate) return false
  return isBefore(parseISO(endDate), new Date())
}

export function isDueSoon(endDate: string, status: ContractStatus, days = 30): boolean {
  if (status === 'completed' || status === 'cancelled') return false
  if (!endDate) return false
  const end = parseISO(endDate)
  const now = new Date()
  return isAfter(end, now) && isBefore(end, addDays(now, days))
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const directionLabel: Record<Direction, string> = {
  maf: 'МАФ / Металлоконструкции',
  finishing: 'Отделочные работы',
}

export const directionColor: Record<Direction, string> = {
  maf: 'bg-blue-100 text-blue-800',
  finishing: 'bg-orange-100 text-orange-800',
}

export const statusLabel: Record<ContractStatus, string> = {
  planning: 'Планируется',
  active: 'Активный',
  completed: 'Завершён',
  paused: 'Приостановлен',
  cancelled: 'Отменён',
  overdue: 'Просрочен',
}

export const statusColor: Record<ContractStatus, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-700',
  overdue: 'bg-red-200 text-red-900',
}

export const paymentLabel: Record<PaymentStatus, string> = {
  not_paid: 'Не оплачено',
  partial: 'Частично',
  paid: 'Оплачено',
}

export const paymentColor: Record<PaymentStatus, string> = {
  not_paid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
}

export const stageStatusLabel: Record<StageStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'Выполняется',
  completed: 'Завершён',
  delayed: 'Задержка',
}

export const stageStatusColor: Record<StageStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-700',
}

export function exportToCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(';'))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
