import { requireAuth } from '@/lib/auth-utils'
import { ProfileForm } from '@/components/auth/ProfileForm'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Container, Paper } from '@mui/material'

export default async function ProfilePage() {
  const session = await requireAuth()

  return (
    <DashboardLayout title="Profilo Utente">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <ProfileForm user={session.user} />
        </Paper>
      </Container>
    </DashboardLayout>
  )
}