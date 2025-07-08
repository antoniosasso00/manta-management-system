import { createTheme } from '@mui/material/styles'
import { Roboto } from 'next/font/google'

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const baseThemeConfig = {
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 44, // Mobile-friendly touch target
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: 44, // WCAG 2.1 AA compliant
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Mobile-friendly touch target
          minWidth: 44,
        },
      },
    },
    // WCAG 2.1 AA Compliance - Touch Target Optimization
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: '12px', // Aumenta area touch a 48px (24px + 12px padding * 2)
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '12px', // Aumenta area touch a 48px
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '8px 12px',
          '& .MuiTableSortLabel-icon': {
            fontSize: '1.2rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-clickable': {
            minHeight: 44,
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: 44,
          },
          '& .MuiSelect-select': {
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          },
        },
      },
    },
    // Industrial environment optimizations
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '12px 16px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '8px 16px',
        },
      },
    },
  },
} as const;

export const createLightTheme = () => createTheme({
  ...baseThemeConfig,
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#9a0036',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
});

export const createDarkTheme = () => createTheme({
  ...baseThemeConfig,
  palette: {
    mode: 'dark',
    // Contrasto ottimizzato per WCAG AAA compliance
    contrastThreshold: 4.5,
    tonalOffset: 0.2,
    primary: {
      main: '#82b1ff', // Più morbido del precedente #90caf9
      light: '#b6e3ff',
      dark: '#5281cb',
      contrastText: '#000000', // Nero per massimo contrasto
    },
    secondary: {
      main: '#f48caf', // Rosa più desaturato
      light: '#ffbddf',
      dark: '#bf5c81',
      contrastText: '#000000',
    },
    error: {
      main: '#f28b82', // Rosso più morbido per dark mode
      light: '#ffbdba',
      dark: '#cf5c56',
      contrastText: '#000000',
    },
    warning: {
      main: '#fcc02e', // Giallo-arancione più visibile
      light: '#fff350',
      dark: '#c79100',
      contrastText: '#000000',
    },
    info: {
      main: '#81d4fa', // Blu informativo più morbido
      light: '#b6ffff',
      dark: '#4fa3c7',
      contrastText: '#000000',
    },
    success: {
      main: '#81c784', // Verde più morbido
      light: '#b2fab4',
      dark: '#519657',
      contrastText: '#000000',
    },
    background: {
      default: '#121212', // Material Design raccomandato
      paper: '#1e1e1e',
      // Aggiunta di livelli di elevazione per profondità visiva
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)', // 95% opacità per contrasto ottimale
      secondary: 'rgba(255, 255, 255, 0.75)', // 75% invece di 70% per WCAG compliance
      disabled: 'rgba(255, 255, 255, 0.5)', // Chiaro per stato disabilitato
    },
    divider: 'rgba(255, 255, 255, 0.12)', // Divisori sottili ma visibili
    action: {
      active: 'rgba(255, 255, 255, 0.75)',
      hover: 'rgba(255, 255, 255, 0.08)', // Hover leggero
      selected: 'rgba(255, 255, 255, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(255, 255, 255, 0.16)', // Focus più visibile per accessibilità
    },
  },
  components: {
    // Ereditiamo i componenti base e aggiungiamo ottimizzazioni specifiche per dark mode
    ...baseThemeConfig.components,
    
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            // Gradient sottile per profondità nei paper
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }),
        }),
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08))',
            backdropFilter: 'blur(8px)',
          }),
        }),
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          }),
        }),
      },
    },

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            '&:hover': {
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08))',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
          }),
        }),
      },
    },

    MuiTextField: {
      ...baseThemeConfig.components?.MuiTextField,
      styleOverrides: {
        ...baseThemeConfig.components?.MuiTextField?.styleOverrides,
        root: ({ theme }) => ({
          ...baseThemeConfig.components?.MuiTextField?.styleOverrides?.root,
          ...(theme.palette.mode === 'dark' && {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)', // Bordo più visibile
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.4)', // Hover più evidente
              },
              '&.Mui-focused fieldset': {
                borderColor: '#82b1ff', // Colore primario per focus
                borderWidth: '2px',
              },
              '&.Mui-error fieldset': {
                borderColor: '#f28b82', // Colore errore ottimizzato
              },
            },
          }),
        }),
      },
    },

    MuiCheckbox: {
      ...baseThemeConfig.components?.MuiCheckbox,
      styleOverrides: {
        ...baseThemeConfig.components?.MuiCheckbox?.styleOverrides,
        root: ({ theme }) => ({
          ...baseThemeConfig.components?.MuiCheckbox?.styleOverrides?.root,
          ...(theme.palette.mode === 'dark' && {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)', // Hover ottimizzato per dark
            },
            '&.Mui-checked': {
              '&:hover': {
                backgroundColor: 'rgba(130, 177, 255, 0.12)', // Hover per checked state
              },
            },
          }),
        }),
      },
    },

    MuiRadio: {
      ...baseThemeConfig.components?.MuiRadio,
      styleOverrides: {
        ...baseThemeConfig.components?.MuiRadio?.styleOverrides,
        root: ({ theme }) => ({
          ...baseThemeConfig.components?.MuiRadio?.styleOverrides?.root,
          ...(theme.palette.mode === 'dark' && {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&.Mui-checked': {
              '&:hover': {
                backgroundColor: 'rgba(130, 177, 255, 0.12)',
              },
            },
          }),
        }),
      },
    },

    MuiButton: {
      ...baseThemeConfig.components?.MuiButton,
      styleOverrides: {
        ...baseThemeConfig.components?.MuiButton?.styleOverrides,
        root: ({ theme, ownerState }) => ({
          ...baseThemeConfig.components?.MuiButton?.styleOverrides?.root,
          ...(theme.palette.mode === 'dark' && ownerState?.variant === 'outlined' && {
            borderColor: 'rgba(255, 255, 255, 0.23)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          }),
        }),
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)', // Divisori tabella più visibili
          }),
        }),
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...(theme.palette.mode === 'dark' && {
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }),
        }),
      },
    },
  },
});

// Manteniamo i temi statici per compatibilità
export const theme = createLightTheme();
export const darkTheme = createDarkTheme();