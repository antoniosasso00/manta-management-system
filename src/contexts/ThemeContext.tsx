'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeContextProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const resolveTheme = (themeMode: ThemeMode): 'light' | 'dark' => {
    if (themeMode === 'auto') {
      return getSystemTheme();
    }
    return themeMode;
  };

  const setTheme = async (newTheme: ThemeMode) => {
    setMode(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);

    // Salva in localStorage
    localStorage.setItem('theme-preference', newTheme);

    // Salva nelle preferenze utente via API
    try {
      await fetch('/api/auth/profile/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ui: { theme: newTheme }
        }),
      });
    } catch (error) {
      console.warn('Impossibile salvare preferenze tema:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  useEffect(() => {
    // Carica tema salvato in localStorage
    const savedTheme = localStorage.getItem('theme-preference') as ThemeMode | null;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setMode(savedTheme);
      setResolvedTheme(resolveTheme(savedTheme));
    } else {
      // Default: auto mode
      setMode('auto');
      setResolvedTheme(getSystemTheme());
    }

    // Ascolta cambiamenti preferenze sistema per auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (mode === 'auto') {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [mode]);

  // Aggiorna resolved theme quando mode cambia
  useEffect(() => {
    setResolvedTheme(resolveTheme(mode));
  }, [mode]);

  const value: ThemeContextType = {
    mode,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
}