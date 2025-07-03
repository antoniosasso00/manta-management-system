'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Container,
  Alert,
  Link as MuiLink,
  Paper,
} from '@mui/material'
import Link from 'next/link'
import { Button, Input, Logo } from '@/components/atoms'
import { loginSchema, LoginInput } from '@/domains/user/schemas/auth.schema'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle logout reasons
  const reason = searchParams.get('reason')
  const getReasonMessage = (reason: string | null) => {
    switch (reason) {
      case 'timeout':
        return { type: 'warning' as const, message: 'Sessione scaduta per inattività. Effettua di nuovo il login.' }
      case 'account-disabled':
        return { type: 'error' as const, message: 'Account disattivato. Contatta l\'amministratore.' }
      default:
        return null
    }
  }

  const reasonMessage = getReasonMessage(reason)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        const from = searchParams.get('from') || '/'
        router.push(from)
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Logo size="large" showText={true} />
          </Box>

          {reasonMessage && (
            <Alert severity={reasonMessage.type} sx={{ mb: 2 }}>
              {reasonMessage.message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Input
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <Input
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              loading={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Box textAlign="center" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} href="/register" variant="body2">
                Don&apos;t have an account? Sign Up
              </MuiLink>
              <MuiLink component={Link} href="/forgot-password" variant="body2">
                Forgot your password?
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}