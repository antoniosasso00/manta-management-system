'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/contexts/ThemeContext';
import { createLightTheme, createDarkTheme } from '@/lib/theme';

interface DynamicThemeProviderProps {
  children: ReactNode;
}

export function DynamicThemeProvider({ children }: DynamicThemeProviderProps) {
  const { resolvedTheme } = useTheme();
  
  const theme = resolvedTheme === 'dark' ? createDarkTheme() : createLightTheme();
  
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}