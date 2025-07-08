/**
 * Touch Target Audit Utilities per Gestione Produzione
 * Verifica conformità WCAG 2.1 AA (44px minimum touch targets)
 */

export interface TouchTargetAuditResult {
  component: string;
  element: string;
  currentSize: { width: number; height: number };
  meetsStandard: boolean;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export const TOUCH_TARGET_STANDARDS = {
  WCAG_AA: 44, // WCAG 2.1 AA minimum (44x44px)
  APPLE_HIG: 44, // Apple Human Interface Guidelines
  MATERIAL_DESIGN: 48, // Material Design recommended
  INDUSTRIAL_COMFORT: 48, // Comfortable for industrial gloves
} as const;

/**
 * Audit results per componenti esistenti
 */
export const TOUCH_TARGET_AUDIT: TouchTargetAuditResult[] = [
  // ✅ CONFORMI
  {
    component: 'theme.ts',
    element: 'MuiButton.root',
    currentSize: { width: 200, height: 44 },
    meetsStandard: true,
    recommendation: 'Già conforme WCAG 2.1 AA',
    severity: 'low'
  },
  {
    component: 'theme.ts',
    element: 'MuiIconButton.root',
    currentSize: { width: 44, height: 44 },
    meetsStandard: true,
    recommendation: 'Già conforme WCAG 2.1 AA',
    severity: 'low'
  },
  {
    component: 'NavigationItem.tsx',
    element: 'ListItemButton',
    currentSize: { width: 200, height: 44 },
    meetsStandard: true,
    recommendation: 'Già conforme WCAG 2.1 AA',
    severity: 'low'
  },
  {
    component: 'ActionButton.tsx',
    element: 'Button (inherited from theme)',
    currentSize: { width: 200, height: 44 },
    meetsStandard: true,
    recommendation: 'Eredita correttamente da theme',
    severity: 'low'
  },

  // ⚠️ DA VERIFICARE
  {
    component: 'DataTable.tsx',
    element: 'TableSortLabel',
    currentSize: { width: 0, height: 0 },
    meetsStandard: false,
    recommendation: 'Verificare dimensioni effettive e aggiungere padding se necessario',
    severity: 'medium'
  },
  {
    component: 'StatusChip.tsx',
    element: 'Chip component',
    currentSize: { width: -1, height: 32 },
    meetsStandard: false,
    recommendation: 'Aumentare altezza a 44px se interattivo',
    severity: 'medium'
  },
  {
    component: 'FilterPanel.tsx',
    element: 'FormControl selects',
    currentSize: { width: -1, height: -1 },
    meetsStandard: false,
    recommendation: 'Verificare altezza inputs e aumentare se < 44px',
    severity: 'medium'
  },
  {
    component: 'ConfirmActionDialog.tsx',
    element: 'Dialog action buttons',
    currentSize: { width: -1, height: -1 },
    meetsStandard: true,
    recommendation: 'Dovrebbe ereditare da theme, verificare visivamente',
    severity: 'low'
  },

  // 🔴 NON CONFORMI
  {
    component: 'Various components',
    element: 'MUI Checkbox default',
    currentSize: { width: 42, height: 42 },
    meetsStandard: false,
    recommendation: 'Override MUI Checkbox per raggiungere 44px',
    severity: 'high'
  },
  {
    component: 'Various components',
    element: 'MUI Radio default',
    currentSize: { width: 42, height: 42 },
    meetsStandard: false,
    recommendation: 'Override MUI Radio per raggiungere 44px',
    severity: 'high'
  },
  {
    component: 'QR Scanner (future)',
    element: 'Camera controls',
    currentSize: { width: 0, height: 0 },
    meetsStandard: false,
    recommendation: 'Assicurare controlli camera siano almeno 48px per uso con guanti',
    severity: 'high'
  },
];

/**
 * Genera report di audit per touch targets
 */
export function generateTouchTargetReport(): {
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    needsVerification: number;
  };
  recommendations: {
    immediate: TouchTargetAuditResult[];
    shortTerm: TouchTargetAuditResult[];
    monitoring: TouchTargetAuditResult[];
  };
  themeOverrides: string;
} {
  const compliant = TOUCH_TARGET_AUDIT.filter(item => item.meetsStandard);
  const nonCompliant = TOUCH_TARGET_AUDIT.filter(item => !item.meetsStandard);
  const highSeverity = nonCompliant.filter(item => item.severity === 'high');
  const mediumSeverity = nonCompliant.filter(item => item.severity === 'medium');
  const lowSeverity = TOUCH_TARGET_AUDIT.filter(item => item.severity === 'low');

  const themeOverrides = `
// Aggiunte necessarie al theme.ts per conformità WCAG 2.1 AA
components: {
  // ... existing components
  MuiCheckbox: {
    styleOverrides: {
      root: {
        padding: '12px', // Aumenta area touch a 48px (24px + 12px padding * 2)
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        padding: '12px', // Aumenta area touch a 48px
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      },
    },
  },
  MuiTableSortLabel: {
    styleOverrides: {
      root: {
        minHeight: 44,
        '& .MuiTableSortLabel-icon': {
          fontSize: '1.2rem',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        height: 44, // Solo se il chip è interattivo
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
      },
    },
  },
}`;

  return {
    summary: {
      total: TOUCH_TARGET_AUDIT.length,
      compliant: compliant.length,
      nonCompliant: nonCompliant.length,
      needsVerification: mediumSeverity.length,
    },
    recommendations: {
      immediate: highSeverity,
      shortTerm: mediumSeverity,
      monitoring: lowSeverity,
    },
    themeOverrides,
  };
}

/**
 * Valida dimensioni touch target
 */
export function validateTouchTarget(
  width: number,
  height: number,
  standard: keyof typeof TOUCH_TARGET_STANDARDS = 'WCAG_AA'
): {
  isValid: boolean;
  standard: number;
  recommendation?: string;
} {
  const minSize = TOUCH_TARGET_STANDARDS[standard];
  const isValid = width >= minSize && height >= minSize;

  return {
    isValid,
    standard: minSize,
    recommendation: !isValid 
      ? `Aumentare dimensioni a minimo ${minSize}x${minSize}px`
      : undefined,
  };
}

/**
 * Helper per CSS touch-friendly utilities
 */
export const TOUCH_TARGET_CSS_UTILITIES = {
  // Classe base per touch targets
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  
  // Classe per touch targets comodi (48px)
  touchTargetComfortable: {
    minHeight: '48px',
    minWidth: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  
  // Classe per elementi industriali (uso con guanti)
  touchTargetIndustrial: {
    minHeight: '52px',
    minWidth: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    border: '2px solid transparent',
    '&:focus': {
      borderColor: 'var(--mes-primary)',
      outline: 'none',
    },
  },
} as const;

/**
 * Test automatico per touch targets (browser environment)
 */
export function auditDOMTouchTargets(): TouchTargetAuditResult[] {
  if (typeof window === 'undefined') {
    console.warn('auditDOMTouchTargets can only run in browser environment');
    return [];
  }

  const results: TouchTargetAuditResult[] = [];
  
  // Selettori per elementi interattivi
  const interactiveSelectors = [
    'button',
    '[role="button"]',
    'a[href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[tabindex]:not([tabindex="-1"])',
    '.MuiIconButton-root',
    '.MuiButton-root',
    '.MuiChip-clickable',
  ];

  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const computed = window.getComputedStyle(element);
      
      // Considera padding per area touch effettiva
      const paddingX = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
      const paddingY = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
      
      const effectiveWidth = rect.width || (parseFloat(computed.minWidth) + paddingX);
      const effectiveHeight = rect.height || (parseFloat(computed.minHeight) + paddingY);
      
      const validation = validateTouchTarget(effectiveWidth, effectiveHeight);
      
      results.push({
        component: `DOM Element ${index + 1}`,
        element: `${selector} (${element.tagName.toLowerCase()})`,
        currentSize: { 
          width: Math.round(effectiveWidth), 
          height: Math.round(effectiveHeight) 
        },
        meetsStandard: validation.isValid,
        recommendation: validation.recommendation || 'Conforme',
        severity: validation.isValid ? 'low' : (effectiveHeight < 40 ? 'high' : 'medium'),
      });
    });
  });

  return results;
}

/**
 * Raccomandazioni specifiche per Gestione Produzione
 */
export const MES_TOUCH_TARGET_GUIDELINES = {
  // Operatori usano smartphone personali
  mobileOperators: {
    minSize: 44,
    recommendedSize: 48,
    description: 'Per operatori con smartphone in ambiente industriale',
  },
  
  // Scanner QR dedicati
  qrScanners: {
    minSize: 48,
    recommendedSize: 52,
    description: 'Per dispositivi QR scanner industriali',
  },
  
  // Tablet di reparto
  departmentTablets: {
    minSize: 44,
    recommendedSize: 48,
    description: 'Per tablet condivisi nei reparti',
  },
  
  // Uso con guanti
  withGloves: {
    minSize: 52,
    recommendedSize: 56,
    description: 'Per operatori con guanti di protezione',
  },
} as const;