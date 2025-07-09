import { ExtensionTableConfig } from '../types'

export const cleanroomConfig: ExtensionTableConfig = {
  entityName: 'part-cleanroom',
  displayName: 'Configurazione Part-Cleanroom',
  description: 'Parametri specifici per la laminazione in camera bianca',
  apiEndpoint: '/api/admin/part-cleanroom',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'layupSequence',
      label: 'Sequenza Laminazione',
      type: 'text',
      required: true,
      helperText: 'Sequenza di laminazione (es: [0/45/90/-45]s)'
    },
    {
      name: 'fiberOrientation',
      label: 'Orientamento Fibre',
      type: 'select',
      required: true,
      options: [
        { value: 'UNIDIREZIONALE', label: 'Unidirezionale' },
        { value: 'BIASSIALE', label: 'Biassiale' },
        { value: 'TESSUTO', label: 'Tessuto' },
        { value: 'MISTO', label: 'Misto' }
      ],
      helperText: 'Tipo di orientamento delle fibre'
    },
    {
      name: 'resinType',
      label: 'Tipo Resina',
      type: 'select',
      required: true,
      options: [
        { value: 'EPOSSIDICA', label: 'Epossidica' },
        { value: 'BISMALEIMIDE', label: 'Bismaleimide' },
        { value: 'POLYIMIDE', label: 'Polyimide' },
        { value: 'PHENOLIC', label: 'Fenolica' }
      ],
      helperText: 'Tipo di resina utilizzata'
    },
    {
      name: 'prepregCode',
      label: 'Codice Prepreg',
      type: 'text',
      required: true,
      helperText: 'Codice identificativo del prepreg'
    },
    {
      name: 'roomTemperature',
      label: 'Temperatura Camera',
      type: 'number',
      required: true,
      min: 15,
      max: 30,
      unit: '°C',
      helperText: 'Temperatura della camera bianca'
    },
    {
      name: 'humidity',
      label: 'Umidità',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      unit: '%',
      helperText: 'Percentuale di umidità'
    },
    {
      name: 'shelfLife',
      label: 'Shelf Life',
      type: 'number',
      required: true,
      min: 1,
      unit: 'giorni',
      helperText: 'Vita utile del prepreg a temperatura ambiente'
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
      name: 'cycleTime',
      label: 'Tempo Ciclo',
      type: 'number',
      min: 0,
      unit: 'minuti',
      helperText: 'Tempo di laminazione (opzionale)'
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
      label: 'Tipi Resina',
      value: (data) => new Set(data.map(item => item.resinType)).size,
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