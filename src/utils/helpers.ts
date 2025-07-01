import { format, isWithinInterval, parseISO } from 'date-fns'
import { PRODUCTION_SHIFTS } from './constants'

export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function getCurrentShift(): keyof typeof PRODUCTION_SHIFTS | null {
  const now = new Date()
  const currentTime = format(now, 'HH:mm')
  
  for (const [key, shift] of Object.entries(PRODUCTION_SHIFTS)) {
    const start = new Date(`1970-01-01T${shift.start}:00`)
    const end = new Date(`1970-01-01T${shift.end}:00`)
    const current = new Date(`1970-01-01T${currentTime}:00`)
    
    if (isWithinInterval(current, { start, end })) {
      return key as keyof typeof PRODUCTION_SHIFTS
    }
  }
  
  return null
}

export function generateODLNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.getTime().toString().slice(-4)
  
  return `ODL${year}${month}${day}${time}`
}

export function generateQRCodeData(type: 'ODL' | 'DEPARTMENT', id: string): string {
  return JSON.stringify({
    type,
    id,
    timestamp: new Date().toISOString(),
  })
}

export function parseQRCodeData(data: string): { type: string; id: string; timestamp: string } | null {
  try {
    const parsed = JSON.parse(data)
    if (parsed.type && parsed.id && parsed.timestamp) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function calculateUtilization(usedArea: number, totalArea: number): number {
  if (totalArea === 0) return 0
  return Math.round((usedArea / totalArea) * 100) / 100
}

export function validatePartNumber(partNumber: string): boolean {
  // Aerospace part numbers are typically alphanumeric
  const regex = /^[A-Z0-9]+$/i
  return regex.test(partNumber) && partNumber.length >= 3
}

export function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'CREATED':
      return 'default'
    case 'IN_CLEANROOM':
    case 'IN_AUTOCLAVE':
    case 'IN_NDI':
    case 'IN_RIFILATURA':
      return 'primary'
    case 'CLEANROOM_COMPLETED':
    case 'AUTOCLAVE_COMPLETED':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'ON_HOLD':
      return 'warning'
    case 'CANCELLED':
      return 'error'
    default:
      return 'default'
  }
}

export function getPriorityColor(priority: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (priority) {
    case 'LOW':
      return 'default'
    case 'NORMAL':
      return 'primary'
    case 'HIGH':
      return 'warning'
    case 'URGENT':
      return 'error'
    default:
      return 'default'
  }
}