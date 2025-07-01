import { requireAdmin } from '@/lib/auth-utils'
import { UserManagement } from '@/components/auth/UserManagement'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Container } from '@mui/material'

export default async function AdminUsersPage() {
  await requireAdmin()

  return (
    <DashboardLayout 
      title="Gestione Utenti"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Amministrazione', href: '/admin' },
        { label: 'Utenti' }
      ]}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <UserManagement />
      </Container>
    </DashboardLayout>
  )
}