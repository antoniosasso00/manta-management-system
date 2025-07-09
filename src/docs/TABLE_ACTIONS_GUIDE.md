# Guida alle Azioni Standardizzate delle Tabelle

Questa guida mostra come utilizzare il sistema standardizzato di azioni per le tabelle nell'applicazione MES Aerospazio.

## Componenti Principali

### 1. TableActions
Componente che gestisce le azioni su ogni riga della tabella (visualizza, modifica, elimina).

```tsx
import { TableActions } from '@/components/molecules/TableActions'

// Utilizzo base
<TableActions
  item={row}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  variant="auto" // 'inline' | 'menu' | 'auto'
  size="small"
/>
```

### 2. DetailDialog
Dialog generico per visualizzare i dettagli di un elemento.

```tsx
import { DetailDialog } from '@/components/molecules/DetailDialog'

// Utilizzo
<DetailDialog
  open={viewDialogOpen}
  onClose={() => setViewDialogOpen(false)}
  title={item.name}
  subtitle="Dettagli"
  sections={[
    {
      title: 'Informazioni Generali',
      fields: [
        {
          label: 'Nome',
          value: item.name,
          size: { xs: 12, sm: 6 }
        },
        {
          label: 'Stato',
          value: <Chip label={item.status} color="primary" />,
          type: 'custom',
          size: { xs: 12, sm: 6 }
        }
      ]
    },
    {
      title: 'Date',
      fields: [
        {
          label: 'Creato il',
          value: item.createdAt,
          type: 'date',
          size: { xs: 12, sm: 6 }
        }
      ]
    }
  ]}
/>
```

### 3. DataManagementTemplate
Template completo che integra automaticamente le azioni.

```tsx
<DataManagementTemplate
  data={items}
  columns={columns}
  onView={handleView}    // Abilita visualizzazione
  onEdit={handleEdit}    // Abilita modifica
  onDelete={handleDelete} // Abilita eliminazione
  actionsVariant="auto"  // Controllo visualizzazione azioni
/>
```

## Esempio Completo

```tsx
export default function MyPage() {
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewItem, setViewItem] = useState<Item | null>(null)

  const handleView = (item: Item) => {
    setViewItem(item)
    setViewDialogOpen(true)
  }

  const handleEdit = (item: Item) => {
    // Logica per aprire form di modifica
  }

  const handleDelete = async (item: Item) => {
    // Logica per eliminare l'elemento
  }

  return (
    <>
      <DataManagementTemplate
        data={items}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DetailDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false)
          setViewItem(null)
        }}
        title={viewItem?.name || ''}
        sections={/* dettagli elemento */}
      />
    </>
  )
}
```

## Tipi di Campo per DetailDialog

- **text** (default): Testo semplice
- **chip**: Visualizza come Chip Material-UI
- **boolean**: Mostra "Sì" o "No"
- **date**: Formatta data in italiano con ora
- **currency**: Formatta come valuta EUR
- **custom**: Per componenti React personalizzati

## Personalizzazione

### Azioni Custom
```tsx
const customActions: TableAction[] = [
  {
    id: 'print',
    label: 'Stampa',
    icon: <PrintIcon />,
    onClick: (item) => handlePrint(item),
    color: 'primary'
  },
  {
    id: 'archive',
    label: 'Archivia',
    icon: <ArchiveIcon />,
    onClick: (item) => handleArchive(item),
    disabled: (item) => item.status === 'archived',
    hidden: (item) => !item.canArchive
  }
]

<DataManagementTemplate
  customActions={customActions}
  // ...
/>
```

### Varianti di Visualizzazione

- **inline**: Mostra sempre icone inline
- **menu**: Mostra sempre menu dropdown
- **auto**: Inline su desktop, menu su mobile (default)

## Best Practices

1. **Consistenza**: Usa sempre lo stesso ordine per le azioni (Visualizza → Modifica → Elimina)
2. **Feedback**: Mostra sempre loading/success/error states
3. **Conferme**: Usa sempre dialog di conferma per azioni distruttive
4. **Accessibilità**: Le azioni devono avere tooltip e aria-labels
5. **Responsive**: Su mobile preferisci il menu dropdown per risparmiare spazio