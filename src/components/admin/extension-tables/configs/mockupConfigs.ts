import { ExtensionTableConfig } from '../types'

export const honeycombConfig: ExtensionTableConfig = {
  entityName: 'part-honeycomb',
  displayName: 'Configurazione Part-Honeycomb',
  description: 'Parametri per lavorazione honeycomb core',
  apiEndpoint: '/api/admin/part-honeycomb',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'coreType',
      label: 'Tipo Core',
      type: 'select',
      required: true,
      options: [
        { value: 'ALUMINUM', label: 'Alluminio' },
        { value: 'NOMEX', label: 'Nomex' },
        { value: 'FIBERGLASS', label: 'Fibra di Vetro' },
        { value: 'CARBON', label: 'Carbonio' }
      ],
      helperText: 'Tipo di materiale del core'
    },
    {
      name: 'cellSize',
      label: 'Dimensione Cella',
      type: 'text',
      required: true,
      helperText: 'Dimensioni della cella (es: 1/8", 3/16")'
    },
    {
      name: 'coreDensity',
      label: 'Densità Core',
      type: 'number',
      required: true,
      min: 0,
      unit: 'kg/m³',
      helperText: 'Densità del materiale core'
    },
    {
      name: 'coreThickness',
      label: 'Spessore Core',
      type: 'number',
      required: true,
      min: 0,
      unit: 'mm',
      helperText: 'Spessore del core'
    },
    {
      name: 'skinMaterial',
      label: 'Materiale Skin',
      type: 'select',
      required: true,
      options: [
        { value: 'CARBON_FIBER', label: 'Fibra di Carbonio' },
        { value: 'FIBERGLASS', label: 'Fibra di Vetro' },
        { value: 'ALUMINUM', label: 'Alluminio' },
        { value: 'PREPREG', label: 'Prepreg' }
      ],
      helperText: 'Materiale delle pelli'
    },
    {
      name: 'adhesiveType',
      label: 'Tipo Adesivo',
      type: 'select',
      required: true,
      options: [
        { value: 'FILM_ADHESIVE', label: 'Film Adesivo' },
        { value: 'PASTE_ADHESIVE', label: 'Pasta Adesiva' },
        { value: 'STRUCTURAL_ADHESIVE', label: 'Adesivo Strutturale' }
      ],
      helperText: 'Tipo di adesivo utilizzato'
    },
    {
      name: 'cureTemperature',
      label: 'Temperatura Cura',
      type: 'number',
      required: true,
      min: 20,
      max: 200,
      unit: '°C',
      helperText: 'Temperatura di cura'
    },
    {
      name: 'cureTime',
      label: 'Tempo Cura',
      type: 'number',
      required: true,
      min: 1,
      unit: 'minuti',
      helperText: 'Tempo di cura'
    },
    {
      name: 'pressure',
      label: 'Pressione',
      type: 'number',
      required: true,
      min: 0,
      unit: 'bar',
      helperText: 'Pressione applicata'
    },
    {
      name: 'vacuumLevel',
      label: 'Livello Vuoto',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      unit: '%',
      helperText: 'Livello di vuoto'
    },
    {
      name: 'qualityChecks',
      label: 'Controlli Qualità',
      type: 'multiline',
      required: true,
      rows: 2,
      helperText: 'Controlli di qualità da effettuare'
    },
    {
      name: 'notes',
      label: 'Note',
      type: 'multiline',
      rows: 2,
      helperText: 'Note aggiuntive (opzionale)'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Temp. Cura Media',
      value: (data) => {
        const temps = data.filter(item => item.cureTemperature).map(item => item.cureTemperature)
        return temps.length > 0 
          ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) 
          : 0
      },
      color: 'secondary'
    },
    {
      label: 'Tipi Core',
      value: (data) => new Set(data.map(item => item.coreType)).size,
      color: 'success'
    },
    {
      label: 'Tempo Cura Medio',
      value: (data) => {
        const times = data.filter(item => item.cureTime).map(item => item.cureTime)
        return times.length > 0 
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) 
          : 0
      },
      color: 'info'
    }
  ],
  actions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canImport: false,
    canExport: false
  }
}

export const controlloNumericoConfig: ExtensionTableConfig = {
  entityName: 'part-controllo-numerico',
  displayName: 'Configurazione Part-Controllo Numerico',
  description: 'Parametri per lavorazioni CNC',
  apiEndpoint: '/api/admin/part-controllo-numerico',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'materialType',
      label: 'Tipo Materiale',
      type: 'select',
      required: true,
      options: [
        { value: 'ALUMINUM', label: 'Alluminio' },
        { value: 'TITANIUM', label: 'Titanio' },
        { value: 'STEEL', label: 'Acciaio' },
        { value: 'COMPOSITE', label: 'Composito' },
        { value: 'INCONEL', label: 'Inconel' }
      ],
      helperText: 'Tipo di materiale da lavorare'
    },
    {
      name: 'toolingRequired',
      label: 'Utensili Richiesti',
      type: 'text',
      required: true,
      helperText: 'Lista degli utensili necessari'
    },
    {
      name: 'programmingTime',
      label: 'Tempo Programmazione',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di programmazione CNC'
    },
    {
      name: 'setupTime',
      label: 'Tempo Setup',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di setup macchina'
    },
    {
      name: 'cycleTime',
      label: 'Tempo Ciclo',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di lavorazione'
    },
    {
      name: 'toleranceClass',
      label: 'Classe Tolleranza',
      type: 'select',
      required: true,
      options: [
        { value: 'IT6', label: 'IT6' },
        { value: 'IT7', label: 'IT7' },
        { value: 'IT8', label: 'IT8' },
        { value: 'IT9', label: 'IT9' },
        { value: 'IT10', label: 'IT10' }
      ],
      helperText: 'Classe di tolleranza richiesta'
    },
    {
      name: 'surfaceFinish',
      label: 'Finitura Superficie',
      type: 'select',
      required: true,
      options: [
        { value: 'RA_0_8', label: 'Ra 0.8' },
        { value: 'RA_1_6', label: 'Ra 1.6' },
        { value: 'RA_3_2', label: 'Ra 3.2' },
        { value: 'RA_6_3', label: 'Ra 6.3' }
      ],
      helperText: 'Finitura superficiale richiesta'
    },
    {
      name: 'qualityChecks',
      label: 'Controlli Qualità',
      type: 'multiline',
      required: true,
      rows: 2,
      helperText: 'Controlli di qualità da effettuare'
    },
    {
      name: 'notes',
      label: 'Note',
      type: 'multiline',
      rows: 2,
      helperText: 'Note aggiuntive (opzionale)'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Tempo Setup Medio',
      value: 'avgSetupTime',
      color: 'secondary'
    },
    {
      label: 'Tempo Ciclo Medio',
      value: 'avgCycleTime',
      color: 'success'
    },
    {
      label: 'Materiali Diversi',
      value: (data) => new Set(data.map(item => item.materialType)).size,
      color: 'info'
    }
  ],
  actions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canImport: false,
    canExport: false
  }
}

export const montaggioConfig: ExtensionTableConfig = {
  entityName: 'part-montaggio',
  displayName: 'Configurazione Part-Montaggio',
  description: 'Parametri per operazioni di assemblaggio',
  apiEndpoint: '/api/admin/part-montaggio',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'assemblyType',
      label: 'Tipo Assemblaggio',
      type: 'select',
      required: true,
      options: [
        { value: 'MECHANICAL', label: 'Meccanico' },
        { value: 'BONDED', label: 'Incollato' },
        { value: 'WELDED', label: 'Saldato' },
        { value: 'RIVETED', label: 'Chiodato' },
        { value: 'BOLTED', label: 'Bullonato' }
      ],
      helperText: 'Tipo di assemblaggio'
    },
    {
      name: 'componentCount',
      label: 'Numero Componenti',
      type: 'number',
      required: true,
      min: 1,
      helperText: 'Numero di componenti da assemblare'
    },
    {
      name: 'assemblyTime',
      label: 'Tempo Assemblaggio',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di assemblaggio'
    },
    {
      name: 'testingTime',
      label: 'Tempo Test',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di test funzionale'
    },
    {
      name: 'requiredParts',
      label: 'Parti Richieste',
      type: 'text',
      required: true,
      helperText: 'Lista delle parti necessarie'
    },
    {
      name: 'toolsRequired',
      label: 'Utensili Richiesti',
      type: 'text',
      required: true,
      helperText: 'Lista degli utensili necessari'
    },
    {
      name: 'qualityChecks',
      label: 'Controlli Qualità',
      type: 'multiline',
      required: true,
      rows: 2,
      helperText: 'Controlli di qualità da effettuare'
    },
    {
      name: 'certificationReq',
      label: 'Certificazione Richiesta',
      type: 'boolean',
      defaultValue: false,
      helperText: 'Indica se è richiesta certificazione'
    },
    {
      name: 'notes',
      label: 'Note',
      type: 'multiline',
      rows: 2,
      helperText: 'Note aggiuntive (opzionale)'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Tempo Assemblaggio Medio',
      value: (data) => {
        const times = data.filter(item => item.assemblyTime).map(item => item.assemblyTime)
        return times.length > 0 
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) 
          : 0
      },
      color: 'secondary'
    },
    {
      label: 'Componenti Medi',
      value: (data) => {
        const counts = data.filter(item => item.componentCount).map(item => item.componentCount)
        return counts.length > 0 
          ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) 
          : 0
      },
      color: 'success'
    },
    {
      label: 'Certificazione Richiesta',
      value: 'certificationRequired',
      color: 'warning'
    }
  ],
  actions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canImport: false,
    canExport: false
  }
}

export const verniciatureConfig: ExtensionTableConfig = {
  entityName: 'part-verniciatura',
  displayName: 'Configurazione Part-Verniciatura',
  description: 'Parametri per operazioni di verniciatura',
  apiEndpoint: '/api/admin/part-verniciatura',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'coatingType',
      label: 'Tipo Rivestimento',
      type: 'select',
      required: true,
      options: [
        { value: 'PRIMER', label: 'Primer' },
        { value: 'BASECOAT', label: 'Base Coat' },
        { value: 'TOPCOAT', label: 'Top Coat' },
        { value: 'CLEARCOAT', label: 'Clear Coat' },
        { value: 'SPECIALTY', label: 'Specialty' }
      ],
      helperText: 'Tipo di rivestimento'
    },
    {
      name: 'primerRequired',
      label: 'Primer Richiesto',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Indica se è richiesto il primer'
    },
    {
      name: 'coatLayers',
      label: 'Strati Vernice',
      type: 'number',
      required: true,
      min: 1,
      max: 10,
      helperText: 'Numero di strati di vernice'
    },
    {
      name: 'surfacePrep',
      label: 'Preparazione Superficie',
      type: 'select',
      required: true,
      options: [
        { value: 'SANDING', label: 'Carteggiatura' },
        { value: 'BLASTING', label: 'Sabbiatura' },
        { value: 'CHEMICAL', label: 'Chimico' },
        { value: 'CLEANING', label: 'Pulizia' }
      ],
      helperText: 'Tipo di preparazione superficie'
    },
    {
      name: 'cleaningRequired',
      label: 'Pulizia Richiesta',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Indica se è richiesta pulizia speciale'
    },
    {
      name: 'dryTime',
      label: 'Tempo Asciugatura',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di asciugatura'
    },
    {
      name: 'cureTime',
      label: 'Tempo Cura',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di cura'
    },
    {
      name: 'qualityChecks',
      label: 'Controlli Qualità',
      type: 'multiline',
      required: true,
      rows: 2,
      helperText: 'Controlli di qualità da effettuare'
    },
    {
      name: 'environmentalReq',
      label: 'Requisiti Ambientali',
      type: 'text',
      required: true,
      helperText: 'Requisiti ambientali (temperatura, umidità, etc.)'
    },
    {
      name: 'notes',
      label: 'Note',
      type: 'multiline',
      rows: 2,
      helperText: 'Note aggiuntive (opzionale)'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Tempo Asciugatura Medio',
      value: (data) => {
        const times = data.filter(item => item.dryTime).map(item => item.dryTime)
        return times.length > 0 
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) 
          : 0
      },
      color: 'secondary'
    },
    {
      label: 'Strati Medi',
      value: (data) => {
        const layers = data.filter(item => item.coatLayers).map(item => item.coatLayers)
        return layers.length > 0 
          ? Math.round(layers.reduce((a, b) => a + b, 0) / layers.length) 
          : 0
      },
      color: 'success'
    },
    {
      label: 'Con Primer',
      value: (data) => data.filter(item => item.primerRequired).length,
      color: 'info'
    }
  ],
  actions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canImport: false,
    canExport: false
  }
}

export const motoriConfig: ExtensionTableConfig = {
  entityName: 'part-motori',
  displayName: 'Configurazione Part-Motori',
  description: 'Parametri per componenti motori',
  apiEndpoint: '/api/admin/part-motori',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'engineType',
      label: 'Tipo Motore',
      type: 'select',
      required: true,
      options: [
        { value: 'TURBOFAN', label: 'Turbofan' },
        { value: 'TURBOJET', label: 'Turbojet' },
        { value: 'TURBOPROP', label: 'Turboprop' },
        { value: 'TURBOSHAFT', label: 'Turboshaft' },
        { value: 'ROCKET', label: 'Rocket' }
      ],
      helperText: 'Tipo di motore'
    },
    {
      name: 'powerRating',
      label: 'Potenza Nominale',
      type: 'number',
      required: true,
      min: 0,
      unit: 'kW',
      helperText: 'Potenza nominale del motore'
    },
    {
      name: 'rpmRange',
      label: 'Range RPM',
      type: 'text',
      required: true,
      helperText: 'Range di RPM (es: 1000-5000)'
    },
    {
      name: 'fuelType',
      label: 'Tipo Combustibile',
      type: 'select',
      required: true,
      options: [
        { value: 'JET_A1', label: 'Jet A-1' },
        { value: 'JP_8', label: 'JP-8' },
        { value: 'AVGAS', label: 'AvGas' },
        { value: 'KEROSENE', label: 'Kerosene' },
        { value: 'SOLID', label: 'Solido' }
      ],
      helperText: 'Tipo di combustibile'
    },
    {
      name: 'assemblyTime',
      label: 'Tempo Assemblaggio',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di assemblaggio'
    },
    {
      name: 'testingTime',
      label: 'Tempo Test',
      type: 'number',
      required: true,
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di test funzionale'
    },
    {
      name: 'certificationReq',
      label: 'Certificazione Richiesta',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Indica se è richiesta certificazione'
    },
    {
      name: 'qualityChecks',
      label: 'Controlli Qualità',
      type: 'multiline',
      required: true,
      rows: 2,
      helperText: 'Controlli di qualità da effettuare'
    },
    {
      name: 'maintenanceReq',
      label: 'Requisiti Manutenzione',
      type: 'text',
      required: true,
      helperText: 'Requisiti di manutenzione'
    },
    {
      name: 'notes',
      label: 'Note',
      type: 'multiline',
      rows: 2,
      helperText: 'Note aggiuntive (opzionale)'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Potenza Media',
      value: (data) => {
        const powers = data.filter(item => item.powerRating).map(item => item.powerRating)
        return powers.length > 0 
          ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) 
          : 0
      },
      color: 'secondary'
    },
    {
      label: 'Tipi Motore',
      value: (data) => new Set(data.map(item => item.engineType)).size,
      color: 'success'
    },
    {
      label: 'Certificazione Richiesta',
      value: 'certificationRequired',
      color: 'warning'
    }
  ],
  actions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canImport: false,
    canExport: false
  }
}