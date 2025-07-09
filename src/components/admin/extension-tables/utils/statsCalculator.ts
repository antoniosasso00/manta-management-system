import { StatsConfig } from '../types'

export const calculateStats = (statsConfig: StatsConfig[], data: any[]) => {
  return statsConfig.map(config => {
    let value: string | number
    
    if (typeof config.value === 'function') {
      value = config.value(data)
    } else if (typeof config.value === 'string') {
      // Calcoli predefiniti comuni
      switch (config.value) {
        case 'count':
          value = data.length
          break
        case 'avgSetupTime':
          const setupTimes = data.filter(item => item.setupTime).map(item => item.setupTime)
          value = setupTimes.length > 0 
            ? Math.round(setupTimes.reduce((a, b) => a + b, 0) / setupTimes.length) 
            : 0
          break
        case 'avgCycleTime':
          const cycleTimes = data.filter(item => item.cycleTime).map(item => item.cycleTime)
          value = cycleTimes.length > 0 
            ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) 
            : 0
          break
        case 'avgVacuumLines':
          const vacuumLines = data.filter(item => item.vacuumLines).map(item => item.vacuumLines)
          value = vacuumLines.length > 0 
            ? Math.round(vacuumLines.reduce((a, b) => a + b, 0) / vacuumLines.length) 
            : 0
          break
        case 'withSetupTime':
          value = data.filter(item => item.setupTime).length
          break
        case 'withNotes':
          value = data.filter(item => item.notes && item.notes.trim()).length
          break
        case 'certificationRequired':
          value = data.filter(item => item.certificationReq || item.requiredCerts).length
          break
        default:
          value = config.value
      }
    } else {
      value = config.value
    }
    
    return {
      label: config.label,
      value: value.toString(),
      color: config.color || 'primary',
      icon: config.icon
    }
  })
}