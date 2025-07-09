'use client'

import { ReactNode } from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
// import { SessionTimeout } from '@/components/auth/SessionTimeout'
import { ThemeContextProvider } from '@/contexts/ThemeContext'
import { DynamicThemeProvider } from '@/components/providers/DynamicThemeProvider'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/it'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AppRouterCacheProvider>
      <SessionProvider 
        basePath="/api/auth"
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeContextProvider>
            <DynamicThemeProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
                <CssBaseline />
                {/* <SessionTimeout timeoutMinutes={120} warningMinutes={10} /> */}
                {children}
              </LocalizationProvider>
            </DynamicThemeProvider>
          </ThemeContextProvider>
        </QueryClientProvider>
      </SessionProvider>
    </AppRouterCacheProvider>
  )
}