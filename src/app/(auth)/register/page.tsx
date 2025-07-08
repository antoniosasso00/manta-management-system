'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Container,
  Typography,
  Alert,
  Link as MuiLink,
  Paper,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material'
import Link from 'next/link'
import { Button, Input, Logo } from '@/components/atoms'
import { registerSchema, RegisterInput } from '@/domains/user/schemas/auth.schema'
import { validatePassword, getPasswordStrength } from '@/lib/password-validation'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const watchedPassword = watch('password')
  const watchedConfirmPassword = watch('confirmPassword')
  const watchedEmail = watch('email')
  const watchedName = watch('name')

  const passwordValidation = watchedPassword ? validatePassword(watchedPassword) : null
  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : null

  const getDetailedErrorMessage = (error: string) => {
    switch (error) {
      case 'EmailAlreadyExists':
        return {
          title: 'Email già registrata',
          message: 'Esiste già un account con questo indirizzo email.',
          suggestions: [
            'Usa un indirizzo email diverso',
            'Vai al login se hai già un account',
            'Usa "Password dimenticata?" se non ricordi la password'
          ]
        }
      case 'WeakPassword':
        return {
          title: 'Password troppo debole',
          message: 'La password non soddisfa i requisiti di sicurezza.',
          suggestions: [
            'Usa almeno 8 caratteri',
            'Includi lettere maiuscole e minuscole',
            'Aggiungi numeri e caratteri speciali'
          ]
        }
      case 'ValidationError':
        return {
          title: 'Errore di validazione',
          message: 'Alcuni campi contengono errori.',
          suggestions: [
            'Controlla tutti i campi evidenziati',
            'Assicurati che le password coincidano',
            'Verifica il formato dell\'email'
          ]
        }
      default:
        return {
          title: 'Errore di registrazione',
          message: 'Si è verificato un errore durante la registrazione.',
          suggestions: [
            'Riprova tra qualche istante',
            'Controlla la tua connessione internet',
            'Contatta il supporto se il problema persiste'
          ]
        }
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          name: data.name,
        }),
      })

      if (response.ok) {
        router.push('/login?message=Registrazione completata. Effettua il login.')
      } else {
        const result = await response.json()
        setError(result.error || result.message || 'Errore durante la registrazione')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('NetworkError')
    } finally {
      setIsLoading(false)
    }
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
            Registrazione
          </Typography>

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {/* Detailed error messages */}
          {errorDetails && (
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
              id="name"
              label="Nome Completo"
              autoComplete="name"
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register('name')}
            />
            
            <Input
              margin="normal"
              required
              fullWidth
              id="email"
              label="Indirizzo Email"
              autoComplete="email"
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
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />

            {/* Password strength indicator */}
            {watchedPassword && passwordStrength && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" component="span" sx={{ mb: 1 }}>
                  Sicurezza password: 
                  <Chip
                    label={passwordStrength.level === 'weak' ? 'Debole' : 
                          passwordStrength.level === 'medium' ? 'Media' :
                          passwordStrength.level === 'strong' ? 'Forte' : 'Molto forte'}
                    color={passwordStrength.level === 'weak' ? 'error' : 
                           passwordStrength.level === 'medium' ? 'warning' :
                           passwordStrength.level === 'strong' ? 'primary' : 'success'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                
                {passwordValidation && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Requisiti:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {passwordValidation.checks.map((check, index) => (
                        <Chip
                          key={index}
                          label={check.label}
                          color={check.passed ? 'success' : 'default'}
                          size="small"
                          variant={check.passed ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
            
            <Input
              margin="normal"
              required
              fullWidth
              label="Conferma Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Password match indicator */}
            {watchedPassword && watchedConfirmPassword && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Chip
                  label={watchedPassword === watchedConfirmPassword ? 'Password coincidenti' : 'Password non coincidenti'}
                  color={watchedPassword === watchedConfirmPassword ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            )}

            {/* Form validation feedback */}
            {(watchedName || watchedEmail || watchedPassword || watchedConfirmPassword) && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Completamento form:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Nome: ${watchedName ? 'Inserito' : 'Richiesto'}`}
                    color={watchedName && !errors.name ? 'success' : 'default'}
                    size="small"
                  />
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
                  <Chip
                    label={`Conferma: ${watchedConfirmPassword ? 'Inserita' : 'Richiesta'}`}
                    color={watchedConfirmPassword && !errors.confirmPassword ? 'success' : 'default'}
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
              disabled={!isValid}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box textAlign="center">
              <MuiLink component={Link} href="/login" variant="body2">
                Hai già un account? Accedi
              </MuiLink>
            </Box>

            {/* Security notice */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Le password devono contenere almeno 8 caratteri con lettere maiuscole, minuscole, numeri e caratteri speciali.
              </Typography>
            </Alert>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}