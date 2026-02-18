/**
 * EIOS Enterprise Design System - Theme Configuration
 * 
 * Inspired by: Linear, Vercel, Notion, Figma
 * Philosophy: Warm, sophisticated, accessible, premium
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Base - Warm Cream (replacing stark white)
  cream: {
    50: '#FDFCF8',
    100: '#FAF9F4',
    200: '#F5F3EA',
    300: '#EDE9DC',
    400: '#E2DCC8',
    500: '#D4CCB0',
    600: '#B8AD8A',
    700: '#9C9168',
    800: '#7A7152',
    900: '#5A543D',
    950: '#3D3929',
  },
  
  // Primary - Deep Charcoal (sophisticated, readable)
  charcoal: {
    50: '#F6F6F6',
    100: '#E7E7E7',
    200: '#D1D1D1',
    300: '#B0B0B0',
    400: '#888888',
    500: '#6D6D6D',
    600: '#5D5D5D',
    700: '#4F4F4F',
    800: '#454545',
    900: '#2A2A2A',
    950: '#1A1A1A',
  },
  
  // Accent - Warm Rose (elegant, inviting)
  rose: {
    50: '#FDF2F4',
    100: '#FCE7EB',
    200: '#F8D0D9',
    300: '#F2AAB9',
    400: '#E97891',
    500: '#D94666',
    600: '#C4355A',
    700: '#A6284A',
    800: '#8B2543',
    900: '#77233D',
    950: '#42101F',
  },
  
  // Success - Soft Sage
  sage: {
    50: '#F4F7F4',
    100: '#E3EBE3',
    200: '#C5D8C5',
    300: '#9BB89B',
    400: '#729672',
    500: '#527A52',
    600: '#3D5F3D',
    700: '#324C32',
    800: '#2A3D2A',
    900: '#233323',
    950: '#111A11',
  },
  
  // Warning - Warm Amber
  amber: {
    50: '#FDF9F3',
    100: '#FAF0E0',
    200: '#F3DEC0',
    300: '#EAC594',
    400: '#DEA560',
    500: '#D48A3E',
    600: '#C67030',
    700: '#A55629',
    800: '#854526',
    900: '#6C3922',
    950: '#3A1C0F',
  },
  
  // Error - Soft Coral
  coral: {
    50: '#FDF4F3',
    100: '#FBE8E5',
    200: '#F7D5CF',
    300: '#F0B8AE',
    400: '#E58F80',
    500: '#D65F4F',
    600: '#C44A3B',
    700: '#A43B30',
    800: '#88332D',
    900: '#722E2A',
    950: '#3E1513',
  },
  
  // Info - Soft Blue
  blue: {
    50: '#F2F7FC',
    100: '#E1EDF9',
    200: '#C9DFF3',
    300: '#A4CBEA',
    400: '#76B0DE',
    500: '#5494D4',
    600: '#4079C6',
    700: '#3664B1',
    800: '#315391',
    900: '#2B4676',
    950: '#1E2D4A',
  },
  
  // Neutral - Stone (for borders, dividers)
  stone: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
    950: '#0C0A09',
  },
} as const;

// ============================================
// SEMANTIC TOKENS
// ============================================

export const semantic = {
  background: {
    primary: colors.cream[50],
    secondary: colors.cream[100],
    tertiary: colors.cream[200],
    inverse: colors.charcoal[900],
    overlay: 'rgba(26, 26, 26, 0.5)',
    modal: '#FFFFFF',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  
  foreground: {
    primary: colors.charcoal[900],
    secondary: colors.charcoal[700],
    tertiary: colors.charcoal[500],
    inverse: colors.cream[50],
    muted: colors.charcoal[400],
    disabled: colors.charcoal[300],
  },
  
  border: {
    subtle: colors.cream[300],
    default: colors.stone[200],
    strong: colors.stone[300],
    focus: colors.rose[500],
  },
  
  status: {
    success: colors.sage[600],
    warning: colors.amber[600],
    error: colors.coral[600],
    info: colors.blue[600],
    pending: colors.amber[500],
    active: colors.rose[600],
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Font families
  fontFamily: {
    sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  },
  
  // Font sizes (using major third scale: 1.25)
  fontSize: {
    '2xs': ['0.625rem', { lineHeight: '0.875rem' }],    // 10px
    xs: ['0.75rem', { lineHeight: '1rem' }],             // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],         // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],            // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],         // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],          // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],           // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],      // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],        // 36px
    '5xl': ['3rem', { lineHeight: '1.15' }],             // 48px
    '6xl': ['3.75rem', { lineHeight: '1.1' }],           // 60px
    '7xl': ['4.5rem', { lineHeight: '1.05' }],           // 72px
  },
  
  // Font weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================
// SPACING (4px grid system)
// ============================================

export const spacing = {
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

// ============================================
// SHADOWS & ELEVATION
// ============================================

export const shadows = {
  // Elevation system
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
  
  // Premium shadows (warm tint)
  premium: {
    sm: '0 1px 3px 0 rgb(42 42 42 / 0.04), 0 1px 2px -1px rgb(42 42 42 / 0.04)',
    md: '0 4px 6px -1px rgb(42 42 42 / 0.04), 0 2px 4px -2px rgb(42 42 42 / 0.04)',
    lg: '0 10px 15px -3px rgb(42 42 42 / 0.04), 0 4px 6px -4px rgb(42 42 42 / 0.04)',
    xl: '0 20px 25px -5px rgb(42 42 42 / 0.04), 0 8px 10px -6px rgb(42 42 42 / 0.04)',
  },
  
  // Focus rings
  ring: {
    default: '0 0 0 2px hsl(var(--ring))',
    primary: `0 0 0 2px ${colors.rose[500]}33`,
    error: `0 0 0 2px ${colors.coral[500]}33`,
    success: `0 0 0 2px ${colors.sage[500]}33`,
  },
} as const;

// ============================================
// ANIMATION TIMING
// ============================================

export const animation = {
  // Duration (in seconds)
  duration: {
    instant: 0.05,
    fast: 0.1,
    normal: 0.2,
    medium: 0.3,
    slow: 0.5,
    slower: 0.8,
  },
  
  // Easing functions
  easing: {
    // Linear
    linear: 'linear',
    
    // Standard easings
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    
    // Custom bezier curves (from Linear, Vercel)
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
    
    // Spring physics
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'spring-tight': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    
    // Premium feel
    premium: 'cubic-bezier(0.23, 1, 0.32, 1)',
    'premium-out': 'cubic-bezier(0.19, 1, 0.22, 1)',
  },
  
  // Stagger delays
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  xs: '0.125rem',    // 2px
  sm: '0.25rem',     // 4px
  md: '0.375rem',    // 6px
  DEFAULT: '0.5rem', // 8px
  lg: '0.625rem',    // 10px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  skipLink: 700,
  toast: 800,
  tooltip: 900,
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  // Standard transitions
  colors: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, fill 0.2s ease, stroke 0.2s ease',
  opacity: 'opacity 0.2s ease',
  transform: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 0.2s ease',
  all: 'all 0.2s ease',
  
  // Premium transitions
  premium: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
  'premium-fast': 'all 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
} as const;

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const layout = {
  // Container widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  },
  
  // Sidebar widths
  sidebar: {
    collapsed: '64px',
    expanded: '256px',
  },
  
  // Header heights
  header: {
    sm: '56px',
    md: '64px',
    lg: '72px',
  },
  
  // Touch targets
  touchTarget: {
    sm: '32px',
    md: '40px',
    lg: '44px',
  },
} as const;

// ============================================
// CSS VARIABLES GENERATOR
// ============================================

export function generateCSSVariables(): string {
  return `
    :root {
      /* Colors */
      --color-cream-50: ${colors.cream[50]};
      --color-cream-100: ${colors.cream[100]};
      --color-cream-200: ${colors.cream[200]};
      --color-cream-300: ${colors.cream[300]};
      --color-cream-400: ${colors.cream[400]};
      --color-cream-500: ${colors.cream[500]};
      
      --color-charcoal-900: ${colors.charcoal[900]};
      --color-charcoal-700: ${colors.charcoal[700]};
      --color-charcoal-500: ${colors.charcoal[500]};
      --color-charcoal-400: ${colors.charcoal[400]};
      --color-charcoal-300: ${colors.charcoal[300]};
      
      --color-rose-500: ${colors.rose[500]};
      --color-rose-600: ${colors.rose[600]};
      --color-rose-400: ${colors.rose[400]};
      
      --color-sage-600: ${colors.sage[600]};
      --color-amber-600: ${colors.amber[600]};
      --color-coral-600: ${colors.coral[600]};
      --color-blue-600: ${colors.blue[600]};
      
      /* Shadows */
      --shadow-xs: ${shadows.xs};
      --shadow-sm: ${shadows.sm};
      --shadow-md: ${shadows.md};
      --shadow-lg: ${shadows.lg};
      --shadow-xl: ${shadows.xl};
      
      /* Animation */
      --ease-smooth: ${animation.easing.smooth};
      --ease-spring: ${animation.easing.spring};
      --ease-premium: ${animation.easing.premium};
      
      /* Transitions */
      --transition-colors: ${transitions.colors};
      --transition-premium: ${transitions.premium};
    }
  `;
}

// ============================================
// TYPE EXPORTS
// ============================================

export type ColorScale = keyof typeof colors.cream;
export type SpacingToken = keyof typeof spacing;
export type ShadowToken = keyof typeof shadows;
export type AnimationDuration = keyof typeof animation.duration;
export type AnimationEasing = keyof typeof animation.easing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ZIndexToken = keyof typeof zIndex;
