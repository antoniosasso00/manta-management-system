/**
 * Utility functions for formatting data display
 */

/**
 * Formatta minuti in formato ore:minuti leggibile
 */
export function formatTime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '--'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  } else {
    return `${mins}m`
  }
}

/**
 * Formatta una data in formato locale italiano
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }
  
  return dateObj.toLocaleString('it-IT', defaultOptions)
}

/**
 * Formatta una durata in millisecondi in formato leggibile
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Formatta un numero con separatori di migliaia
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formatta una percentuale
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`
}

/**
 * Formatta un Part Number per visualizzazione
 */
export function formatPartNumber(partNumber: string): string {
  // Se il part number è molto lungo, mostra solo i primi caratteri
  if (partNumber.length > 12) {
    return `${partNumber.substring(0, 12)}...`
  }
  return partNumber
}

/**
 * Tronca una stringa alla lunghezza specificata aggiungendo ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.substring(0, maxLength)}...`
}