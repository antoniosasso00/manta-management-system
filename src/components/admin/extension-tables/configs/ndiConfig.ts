import { ExtensionTableConfig } from '../types'

export const ndiConfig: ExtensionTableConfig = {
  entityName: 'part-ndi',
  displayName: 'Configurazione Part-NDI',
  description: 'Parametri per controlli non distruttivi',
  apiEndpoint: '/api/admin/part-ndi',
  fields: [
    {
      name: 'partId',
      label: 'Part Number',
      type: 'autocomplete',
      required: true,
      helperText: 'Seleziona il part number da configurare'
    },
    {
      name: 'inspectionMethod',
      label: 'Metodo Ispezione',
      type: 'select',
      required: true,
      options: [
        { value: 'ULTRASUONI', label: 'Ultrasuoni' },
        { value: 'RADIOGRAFIA', label: 'Radiografia' },
        { value: 'CORRENTI_INDOTTE', label: 'Correnti Indotte' },
        { value: 'TERMOGRAFIA', label: 'Termografia' },
        { value: 'PENETRANTI', label: 'Liquidi Penetranti' },
        { value: 'MAGNETOSCOPIA', label: 'Magnetoscopia' }
      ],
      helperText: 'Metodo di controllo non distruttivo'
    },
    {
      name: 'acceptanceCriteria',
      label: 'Criteri Accettazione',
      type: 'text',
      required: true,
      helperText: 'Criteri di accettazione per il controllo'
    },
    {
      name: 'criticalAreas',
      label: 'Aree Critiche',
      type: 'multiline',
      required: true,
      rows: 2,
      helperText: 'Aree critiche da controllare'
    },
    {
      name: 'inspectionTime',
      label: 'Tempo Ispezione',
      type: 'number',
      required: true,
      min: 1,
      unit: 'minuti',
      helperText: 'Tempo stimato per l\'ispezione'
    },
    {
      name: 'requiredCerts',
      label: 'Certificazioni Richieste',
      type: 'text',
      required: true,
      helperText: 'Certificazioni richieste per l\'operatore'
    },
    {
      name: 'calibrationReq',
      label: 'Calibrazione Richiesta',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Indica se è richiesta la calibrazione degli strumenti'
    }
  ],
  stats: [
    {
      label: 'Configurazioni Totali',
      value: 'count',
      color: 'primary'
    },
    {
      label: 'Tempo Ispezione Medio',
      value: (data) => {
        const times = data.filter(item => item.inspectionTime).map(item => item.inspectionTime)
        return times.length > 0 
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) 
          : 0
      },
      color: 'secondary'
    },
    {
      label: 'Metodi Utilizzati',
      value: (data) => new Set(data.map(item => item.inspectionMethod)).size,
      color: 'success'
    },
    {
      label: 'Calibrazione Richiesta',
      value: (data) => data.filter(item => item.calibrationReq).length,
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