'use client'

import { useState, Suspense, useEffect } from 'react'
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
  Typography,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material'
import Link from 'next/link'
import { Button, Input, Logo } from '@/components/atoms'
import { loginSchema, LoginInput } from '@/domains/user/schemas/auth.schema'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)

  // Handle logout reasons and messages
  const reason = searchParams.get('reason')
  const message = searchParams.get('message')
  
  const getReasonMessage = (reason: string | null) => {
    switch (reason) {
      case 'timeout':
        return { type: 'warning' as const, message: 'Sessione scaduta per inattività. Effettua di nuovo il login.' }
      case 'account-disabled':
        return { type: 'error' as const, message: 'Account disattivato. Contatta l\'amministratore.' }
      case 'unauthorized':
        return { type: 'error' as const, message: 'Accesso non autorizzato. Effettua il login.' }
      case 'session-expired':
        return { type: 'info' as const, message: 'Sessione scaduta. Effettua nuovamente il login.' }
      default:
        return null
    }
  }
  
  const getSuccessMessage = (message: string | null) => {
    if (message) {
      return { type: 'success' as const, message }
    }
    return null
  }

  const reasonMessage = getReasonMessage(reason)
  const successMessage = getSuccessMessage(message)

  // Rate limiting logic
  const MAX_ATTEMPTS = 5
  const BLOCK_DURATION = 300000 // 5 minutes in milliseconds

  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts')
    const storedBlockTime = localStorage.getItem('blockTime')
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts))
    }
    
    if (storedBlockTime) {
      const blockTime = parseInt(storedBlockTime)
      const now = Date.now()
      
      if (now < blockTime) {
        setIsBlocked(true)
        setBlockTimeLeft(Math.ceil((blockTime - now) / 1000))
        
        const timer = setInterval(() => {
          const remaining = Math.ceil((blockTime - Date.now()) / 1000)
          if (remaining <= 0) {
            setIsBlocked(false)
            setBlockTimeLeft(0)
            setLoginAttempts(0)
            localStorage.removeItem('loginAttempts')
            localStorage.removeItem('blockTime')
            clearInterval(timer)
          } else {
            setBlockTimeLeft(remaining)
          }
        }, 1000)
        
        return () => clearInterval(timer)
      } else {
        localStorage.removeItem('blockTime')
        setLoginAttempts(0)
        localStorage.removeItem('loginAttempts')
      }
    }
  }, [])

  const getDetailedErrorMessage = (error: string) => {
    switch (error) {
      case 'CredentialsSignin':
        return {
          title: 'Credenziali non valide',
          message: 'Email o password errati. Verifica i tuoi dati e riprova.',
          suggestions: [
            'Controlla che l\'email sia scritta correttamente',
            'Verifica che la password sia corretta',
            'Assicurati che CAPS LOCK non sia attivo'
          ]
        }
      case 'AccountNotFound':
        return {
          title: 'Account non trovato',
          message: 'Nessun account trovato con questa email.',
          suggestions: [
            'Verifica l\'indirizzo email',
            'Registrati se non hai ancora un account'
          ]
        }
      case 'AccountDisabled':
        return {
          title: 'Account disabilitato',
          message: 'Il tuo account è stato disabilitato.',
          suggestions: [
            'Contatta l\'amministratore di sistema',
            'Verifica le email per comunicazioni'
          ]
        }
      case 'TooManyAttempts':
        return {
          title: 'Troppi tentativi',
          message: 'Hai superato il numero massimo di tentativi di accesso.',
          suggestions: [
            'Attendi qualche minuto prima di riprovare',
            'Usa "Password dimenticata?" se necessario'
          ]
        }
      default:
        return {
          title: 'Errore di accesso',
          message: 'Si è verificato un errore durante il login.',
          suggestions: [
            'Riprova tra qualche istante',
            'Controlla la tua connessione internet'
          ]
        }
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const watchedEmail = watch('email')
  const watchedPassword = watch('password')

  const onSubmit = async (data: LoginInput) => {
    if (isBlocked) {
      setError('TooManyAttempts')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)
        localStorage.setItem('loginAttempts', newAttempts.toString())
        
        if (newAttempts >= MAX_ATTEMPTS) {
          const blockTime = Date.now() + BLOCK_DURATION
          localStorage.setItem('blockTime', blockTime.toString())
          setIsBlocked(true)
          setBlockTimeLeft(Math.ceil(BLOCK_DURATION / 1000))
          setError('TooManyAttempts')
        } else {
          setError(result.error)
        }
      } else {
        // Login successful - reset attempts
        setLoginAttempts(0)
        localStorage.removeItem('loginAttempts')
        localStorage.removeItem('blockTime')
        
        const from = searchParams.get('from') || '/'
        router.push(from)
        router.refresh()
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('NetworkError')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const errorDetails = error ? getDetailedErrorMessage(error) : null

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

          <Typography variant="h4" component="h1" textAlign="center" sx={{ mb: 3 }}>
            Accesso
          </Typography>

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {/* Success messages */}
          {successMessage && (
            <Alert severity={successMessage.type} sx={{ mb: 2 }}>
              {successMessage.message}
            </Alert>
          )}

          {/* Session/logout reasons */}
          {reasonMessage && (
            <Alert severity={reasonMessage.type} sx={{ mb: 2 }}>
              {reasonMessage.message}
            </Alert>
          )}

          {/* Rate limiting warning */}
          {isBlocked && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Account temporaneamente bloccato
              </Typography>
              <Typography variant="body2">
                Troppi tentativi di accesso falliti. Riprova tra {formatTime(blockTimeLeft)}.
              </Typography>
              <Box sx={{ mt: 1 }}>
                <MuiLink component={Link} href="/forgot-password" variant="body2">
                  Password dimenticata?
                </MuiLink>
              </Box>
            </Alert>
          )}

          {/* Login attempts warning */}
          {loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && !isBlocked && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Tentativo {loginAttempts} di {MAX_ATTEMPTS}. 
                {loginAttempts >= 3 && (
                  <span> Attenzione: l&apos;account verrà bloccato temporaneamente dopo {MAX_ATTEMPTS} tentativi falliti.</span>
                )}
              </Typography>
            </Alert>
          )}

          {/* Detailed error messages */}
          {errorDetails && !isBlocked && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {errorDetails.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {errorDetails.message}
              </Typography>
              {errorDetails.suggestions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Suggerimenti:
                  </Typography>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {errorDetails.suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <Typography variant="body2">{suggestion}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Input
              margin="normal"
              required
              fullWidth
              id="email"
              label="Indirizzo Email"
              autoComplete="email"
              autoFocus
              disabled={isBlocked}
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
              disabled={isBlocked}
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />

            {/* Form validation feedback */}
            {(watchedEmail || watchedPassword) && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Stato form:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Email: ${watchedEmail ? 'Inserita' : 'Richiesta'}`}
                    color={watchedEmail && !errors.email ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip
                    label={`Password: ${watchedPassword ? 'Inserita' : 'Richiesta'}`}
                    color={watchedPassword && !errors.password ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              loading={isLoading}
              disabled={isBlocked || !isValid}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box textAlign="center" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} href="/register" variant="body2">
                Non hai un account? Registrati
              </MuiLink>
              <MuiLink component={Link} href="/forgot-password" variant="body2">
                Password dimenticata?
              </MuiLink>
            </Box>

            {/* Security notice */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Per la tua sicurezza, l&apos;account verrà bloccato temporaneamente dopo {MAX_ATTEMPTS} tentativi di accesso falliti.
              </Typography>
            </Alert>
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