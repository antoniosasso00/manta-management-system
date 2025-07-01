import { requireAuth } from '@/lib/auth-utils'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Container, Paper } from '@mui/material'

export default async function ChangePasswordPage() {
  await requireAuth()

  return (
    <DashboardLayout title="Cambia Password">
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <ChangePasswordForm />
        </Paper>
      </Container>
    </DashboardLayout>
  )
}