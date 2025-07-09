import { ExtensionTableConfig } from '../types'

export const autoclaveConfig: ExtensionTableConfig = {
  entityName: 'part-autoclave',
  displayName: 'Configurazione Part-Autoclave',
  description: 'Associa part number a cicli di cura e parametri specifici per autoclavi',
  apiEndpoint: '/api/admin/part-autoclave',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'curingCycleId',
      label: 'Ciclo di Cura',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il ciclo di cura per questo part'
    },
    {
      name: 'vacuumLines',
      label: 'Numero Valvole',
      type: 'number',
      required: true,
      min: 0,
      helperText: 'Numero di valvole richieste per questo part'
    },
    {
      name: 'setupTime',
      label: 'Tempo Setup',
      type: 'number',
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di preparazione (opzionale)'
    },
    {
      name: 'loadPosition',
      label: 'Posizione Preferita',
      type: 'select',
      options: [
        { value: 'FONDO', label: 'Fondo' },
        { value: 'CENTRO', label: 'Centro' },
        { value: 'SOPRA', label: 'Sopra' },
        { value: 'LATERALE', label: 'Laterale' }
      ],
      helperText: 'Posizione preferita nell\'autoclave (opzionale)'
    },
    {
      name: 'notes',
      label: 'Note',
      type: 'multiline',
      rows: 3,
      helperText: 'Note specifiche per questo part (opzionale)'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Cicli Disponibili',
      value: (data) => new Set(data.map(item => item.curingCycleId)).size,
      color: 'secondary'
    },
    {
      label: 'Media Valvole',
      value: 'avgVacuumLines',
      color: 'success'
    },
    {
      label: 'Con Tempo Setup',
      value: 'withSetupTime',
      color: 'info'
    }
  ],
  actions: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canImport: true,
    canExport: true
  }
}