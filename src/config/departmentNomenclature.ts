import { 
  CleaningServices, 
  LocalFireDepartment, 
  Analytics, 
  Build, 
  Brush, 
  Engineering, 
  GridView, 
  Settings, 
  VerifiedUser 
} from '@mui/icons-material'

// Configurazione nomenclature specifiche per ogni reparto
export const DEPARTMENT_NOMENCLATURE = {
  // Clean Room - Laminazione
  CR: {
    name: 'Clean Room - Laminazione',
    description: 'Preparazione e Laminazione composite',
    icon: CleaningServices,
    colors: {
      primary: 'primary.main',
      secondary: 'primary.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione materiali e setup'
      },
      inProcess: {
        label: 'In Laminazione',
        description: 'Laminazione in corso'
      },
      completed: {
        label: 'Laminazione Completata',
        description: 'Pronto per trasferimento'
      }
    },
    statistics: {
      activeStations: 'Postazioni Attive',
      avgCycleTime: 'Tempo Medio Ciclo',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Laminazione'
    },
    workflow: {
      entry: 'Ingresso in Clean Room',
      exit: 'Uscita da Clean Room',
      process: 'Processo di Laminazione'
    }
  },

  // Autoclavi - Cura
  AC: {
    name: 'Autoclavi - Cura',
    description: 'Cura e consolidamento composite',
    icon: LocalFireDepartment,
    colors: {
      primary: 'error.main',
      secondary: 'error.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione carico autoclave'
      },
      inProcess: {
        label: 'In Cura',
        description: 'Ciclo di cura in corso'
      },
      completed: {
        label: 'Cura Completata',
        description: 'Ciclo completato e raffreddamento'
      }
    },
    statistics: {
      activeStations: 'Autoclavi Attive',
      avgCycleTime: 'Tempo Medio Ciclo',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Cura'
    },
    workflow: {
      entry: 'Carico in Autoclave',
      exit: 'Scarico da Autoclave',
      process: 'Ciclo di Cura'
    }
  },

  // NDI - Controlli Non Distruttivi
  ND: {
    name: 'NDI - Controlli Non Distruttivi',
    description: 'Controlli qualità non distruttivi',
    icon: Analytics,
    colors: {
      primary: 'info.main',
      secondary: 'info.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Setup strumentazione NDI'
      },
      inProcess: {
        label: 'In Controllo',
        description: 'Controlli NDI in corso'
      },
      completed: {
        label: 'Controlli Completati',
        description: 'Controlli NDI completati'
      }
    },
    statistics: {
      activeStations: 'Postazioni NDI',
      avgCycleTime: 'Tempo Medio Controllo',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Controlli'
    },
    workflow: {
      entry: 'Ingresso in NDI',
      exit: 'Uscita da NDI',
      process: 'Controlli NDI'
    }
  },

  // Controllo Numerico
  CN: {
    name: 'Controllo Numerico',
    description: 'Lavorazioni CNC e finiture',
    icon: Analytics,
    colors: {
      primary: 'success.main',
      secondary: 'success.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Setup macchina e utensili'
      },
      inProcess: {
        label: 'In Lavorazione',
        description: 'Lavorazione CNC in corso'
      },
      completed: {
        label: 'Lavorazione Completata',
        description: 'Lavorazione CNC completata'
      }
    },
    statistics: {
      activeStations: 'Macchine CNC',
      avgCycleTime: 'Tempo Medio Lavorazione',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza CNC'
    },
    workflow: {
      entry: 'Ingresso in CNC',
      exit: 'Uscita da CNC',
      process: 'Lavorazione CNC'
    }
  },

  // Montaggio
  RM: {
    name: 'Montaggio',
    description: 'Assemblaggio e montaggio componenti',
    icon: Build,
    colors: {
      primary: 'warning.main',
      secondary: 'warning.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione componenti'
      },
      inProcess: {
        label: 'In Montaggio',
        description: 'Montaggio in corso'
      },
      completed: {
        label: 'Montaggio Completato',
        description: 'Montaggio completato'
      }
    },
    statistics: {
      activeStations: 'Postazioni Montaggio',
      avgCycleTime: 'Tempo Medio Montaggio',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Montaggio'
    },
    workflow: {
      entry: 'Ingresso in Montaggio',
      exit: 'Uscita da Montaggio',
      process: 'Processo di Montaggio'
    }
  },

  // Verniciatura
  VR: {
    name: 'Verniciatura',
    description: 'Verniciatura e finiture superficiali',
    icon: Brush,
    colors: {
      primary: 'secondary.main',
      secondary: 'secondary.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione superfici'
      },
      inProcess: {
        label: 'In Verniciatura',
        description: 'Verniciatura in corso'
      },
      completed: {
        label: 'Verniciatura Completata',
        description: 'Verniciatura completata'
      }
    },
    statistics: {
      activeStations: 'Cabine Verniciatura',
      avgCycleTime: 'Tempo Medio Verniciatura',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Verniciatura'
    },
    workflow: {
      entry: 'Ingresso in Verniciatura',
      exit: 'Uscita da Verniciatura',
      process: 'Processo di Verniciatura'
    }
  },

  // Honeycomb
  HC: {
    name: 'Honeycomb',
    description: 'Lavorazione strutture honeycomb',
    icon: GridView,
    colors: {
      primary: 'info.main',
      secondary: 'info.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione honeycomb'
      },
      inProcess: {
        label: 'In Lavorazione',
        description: 'Lavorazione honeycomb'
      },
      completed: {
        label: 'Lavorazione Completata',
        description: 'Lavorazione honeycomb completata'
      }
    },
    statistics: {
      activeStations: 'Postazioni Honeycomb',
      avgCycleTime: 'Tempo Medio Lavorazione',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Honeycomb'
    },
    workflow: {
      entry: 'Ingresso in Honeycomb',
      exit: 'Uscita da Honeycomb',
      process: 'Lavorazione Honeycomb'
    }
  },

  // Motori
  MT: {
    name: 'Motori',
    description: 'Assemblaggio e test motori',
    icon: Engineering,
    colors: {
      primary: 'error.main',
      secondary: 'error.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione componenti motore'
      },
      inProcess: {
        label: 'In Assemblaggio',
        description: 'Assemblaggio motore in corso'
      },
      completed: {
        label: 'Assemblaggio Completato',
        description: 'Motore assemblato e testato'
      }
    },
    statistics: {
      activeStations: 'Postazioni Motori',
      avgCycleTime: 'Tempo Medio Assemblaggio',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Assemblaggio'
    },
    workflow: {
      entry: 'Ingresso in Motori',
      exit: 'Uscita da Motori',
      process: 'Assemblaggio Motore'
    }
  },

  // Controllo Qualità
  CQ: {
    name: 'Controllo Qualità',
    description: 'Controlli finali e certificazione',
    icon: VerifiedUser,
    colors: {
      primary: 'success.main',
      secondary: 'success.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione controlli'
      },
      inProcess: {
        label: 'In Controllo',
        description: 'Controlli qualità in corso'
      },
      completed: {
        label: 'Controlli Completati',
        description: 'Controlli qualità completati'
      }
    },
    statistics: {
      activeStations: 'Postazioni Controllo',
      avgCycleTime: 'Tempo Medio Controllo',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza Controlli'
    },
    workflow: {
      entry: 'Ingresso in Controllo Qualità',
      exit: 'Uscita da Controllo Qualità',
      process: 'Controlli Qualità'
    }
  },

  // Default per reparti non specificati
  DEFAULT: {
    name: 'Reparto',
    description: 'Lavorazioni generiche',
    icon: Settings,
    colors: {
      primary: 'primary.main',
      secondary: 'primary.light'
    },
    states: {
      preparation: {
        label: 'In Preparazione',
        description: 'Preparazione lavorazione'
      },
      inProcess: {
        label: 'In Lavorazione',
        description: 'Lavorazione in corso'
      },
      completed: {
        label: 'Lavorazione Completata',
        description: 'Lavorazione completata'
      }
    },
    statistics: {
      activeStations: 'Postazioni Attive',
      avgCycleTime: 'Tempo Medio Ciclo',
      inPreparation: 'In Preparazione',
      efficiency: 'Efficienza'
    },
    workflow: {
      entry: 'Ingresso in Reparto',
      exit: 'Uscita da Reparto',
      process: 'Processo di Lavorazione'
    }
  }
} as const

// Utility function per ottenere nomenclatura di un reparto
export function getDepartmentNomenclature(departmentCode: string) {
  return DEPARTMENT_NOMENCLATURE[departmentCode as keyof typeof DEPARTMENT_NOMENCLATURE] || DEPARTMENT_NOMENCLATURE.DEFAULT
}

// Utility function per ottenere l'icona di un reparto
export function getDepartmentIcon(departmentCode: string) {
  const nomenclature = getDepartmentNomenclature(departmentCode)
  return nomenclature.icon
}

// Utility function per ottenere i colori di un reparto
export function getDepartmentColors(departmentCode: string) {
  const nomenclature = getDepartmentNomenclature(departmentCode)
  return nomenclature.colors
}