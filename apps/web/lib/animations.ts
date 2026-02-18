/**
 * EIOS Enterprise Design System - Animation Utilities
 * 
 * Framer Motion variants and animation presets for premium UX
 * Inspired by: Linear, Vercel, Notion
 */

import { Variants, Transition, type AnimationProps } from 'framer-motion';

// ============================================
// EASING PRESETS
// ============================================

export const easings = {
  // Smooth transitions (standard)
  smooth: [0.4, 0, 0.2, 1],
  smoothOut: [0, 0, 0.2, 1],
  smoothIn: [0.4, 0, 1, 1],
  
  // Spring physics (bouncy)
  spring: [0.34, 1.56, 0.64, 1],
  springTight: [0.175, 0.885, 0.32, 1.275],
  
  // Premium feel (expo out)
  premium: [0.23, 1, 0.32, 1],
  premiumOut: [0.19, 1, 0.22, 1],
  
  // Linear (for continuous animations)
  linear: [0, 0, 1, 1],
  
  // Bounce
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// ============================================
// DURATION PRESETS
// ============================================

export const durations = {
  instant: 0.05,
  fast: 0.1,
  normal: 0.2,
  medium: 0.3,
  slow: 0.5,
  slower: 0.8,
  slowest: 1.2,
} as const;

// ============================================
// STAGGER PRESETS
// ============================================

export const staggers = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
  slower: 0.12,
} as const;

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransitions: Record<string, Variants> = {
  // Fade in with subtle Y translation
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.premium,
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: {
        duration: durations.fast,
      }
    },
  },
  
  // Simple fade
  fade: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: durations.normal,
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: durations.fast,
      }
    },
  },
  
  // Slide from right
  slideRight: {
    initial: { opacity: 0, x: 30 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: durations.medium,
        ease: easings.premium,
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: {
        duration: durations.fast,
      }
    },
  },
  
  // Scale and fade
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: durations.medium,
        ease: easings.spring,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: {
        duration: durations.fast,
      }
    },
  },
  
  // Premium page transition (Linear-like)
  premium: {
    initial: { opacity: 0, y: 8, scale: 0.995 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: durations.slow,
        ease: easings.premium,
      }
    },
    exit: { 
      opacity: 0, 
      y: -4,
      transition: {
        duration: durations.fast,
      }
    },
  },
};

// ============================================
// LIST ITEM ENTRANCE
// ============================================

export const listItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 12,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * staggers.normal,
      duration: durations.normal,
      ease: easings.premium,
    },
  }),
  exit: (i: number = 0) => ({
    opacity: 0,
    x: -10,
    transition: {
      delay: i * 0.02,
      duration: durations.fast,
    },
  }),
};

// ============================================
// STAGGER CONTAINER
// ============================================

export const staggerContainer = (staggerChildren: number = staggers.normal): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerChildren * 0.5,
      staggerDirection: -1,
    },
  },
});

// ============================================
// CARD ENTRANCE
// ============================================

export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 16,
    scale: 0.98,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * staggers.slow,
      duration: durations.medium,
      ease: easings.premium,
    },
  }),
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: durations.normal,
      ease: easings.spring,
    },
  },
  tap: {
    scale: 0.99,
    transition: {
      duration: durations.instant,
    },
  },
};

// ============================================
// MODAL/Dialog
// ============================================

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: durations.fast,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: durations.fast,
      delay: 0.05,
    }
  },
};

export const modalContentVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.96,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: durations.medium,
      ease: easings.spring,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    y: 10,
    transition: {
      duration: durations.fast,
    }
  },
};

// ============================================
// DROPDOWN / POPOVER
// ============================================

export const dropdownVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -8,
    scale: 0.96,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: durations.fast,
      ease: easings.smoothOut,
    }
  },
  exit: { 
    opacity: 0, 
    y: -4,
    scale: 0.98,
    transition: {
      duration: durations.instant,
    }
  },
};

// ============================================
// TOAST / NOTIFICATION
// ============================================

export const toastVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: durations.medium,
      ease: easings.spring,
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    scale: 0.95,
    transition: {
      duration: durations.normal,
    }
  },
};

// ============================================
// HOVER EFFECTS
// ============================================

export const hoverEffects = {
  // Scale up slightly
  scale: {
    scale: 1.02,
    transition: { duration: durations.fast, ease: easings.smooth },
  },
  
  // Lift up
  lift: {
    y: -2,
    transition: { duration: durations.fast, ease: easings.smooth },
  },
  
  // Glow effect
  glow: {
    boxShadow: '0 0 20px rgba(217, 70, 102, 0.3)',
    transition: { duration: durations.normal },
  },
  
  // Subtle background change
  highlight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    transition: { duration: durations.fast },
  },
};

// ============================================
// LOADING STATES
// ============================================

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

export const shimmerVariants: Variants = {
  animate: {
    x: ['-100%', '100%'],
    transition: {
      duration: 1.5,
      ease: easings.smooth,
      repeat: Infinity,
      repeatDelay: 0.5,
    },
  },
};

export const spinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// ============================================
// BUTTON INTERACTIONS
// ============================================

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: durations.fast, ease: easings.spring },
  },
  tap: { 
    scale: 0.98,
    transition: { duration: durations.instant },
  },
  disabled: { 
    opacity: 0.5,
    scale: 1,
  },
};

// ============================================
// TAB SWITCHING
// ============================================

export const tabUnderlineVariants: Variants = {
  initial: { scaleX: 0 },
  animate: { 
    scaleX: 1,
    transition: {
      duration: durations.normal,
      ease: easings.premium,
    }
  },
  exit: { 
    scaleX: 0,
    transition: {
      duration: durations.fast,
    }
  },
};

// ============================================
// ACCORDION
// ============================================

export const accordionContentVariants: Variants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: { duration: durations.normal, ease: easings.smooth },
      opacity: { duration: durations.fast },
    }
  },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: { duration: durations.normal, ease: easings.smooth },
      opacity: { duration: durations.fast, delay: 0.05 },
    }
  },
};

export const accordionIconVariants: Variants = {
  collapsed: { rotate: 0 },
  expanded: { 
    rotate: 180,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    }
  },
};

// ============================================
// DRAWER / SHEET
// ============================================

export const drawerVariants: Record<string, Variants> = {
  left: {
    hidden: { x: '-100%' },
    visible: { 
      x: 0,
      transition: {
        duration: durations.medium,
        ease: easings.premium,
      }
    },
    exit: { 
      x: '-100%',
      transition: {
        duration: durations.normal,
        ease: easings.smoothIn,
      }
    },
  },
  right: {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: {
        duration: durations.medium,
        ease: easings.premium,
      }
    },
    exit: { 
      x: '100%',
      transition: {
        duration: durations.normal,
        ease: easings.smoothIn,
      }
    },
  },
  bottom: {
    hidden: { y: '100%' },
    visible: { 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.premium,
      }
    },
    exit: { 
      y: '100%',
      transition: {
        duration: durations.normal,
        ease: easings.smoothIn,
      }
    },
  },
};

// ============================================
// NUMBER COUNTING ANIMATION
// ============================================

export const countUpTransition: Transition = {
  duration: 1,
  ease: easings.premium,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a staggered animation for list items
 */
export function createStaggerVariants(
  staggerDelay: number = staggers.normal,
  baseDelay: number = 0
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: (i: number = 0) => ({
      opacity: 1,
      transition: {
        delay: baseDelay + i * staggerDelay,
      },
    }),
  };
}

/**
 * Create a fade variant with custom direction
 */
export function createFadeVariant(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20
): Variants {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };
  
  return {
    hidden: { 
      opacity: 0, 
      ...directions[direction],
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.premium,
      }
    },
  };
}

/**
 * Spring animation configuration
 */
export function createSpringConfig(
  stiffness: number = 300,
  damping: number = 30
): { type: 'spring'; stiffness: number; damping: number } {
  return {
    type: 'spring',
    stiffness,
    damping,
  };
}

// ============================================
// REDUCED MOTION
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation props respecting reduced motion preference
 */
export function getAnimationProps(
  props: AnimationProps,
  respectReducedMotion: boolean = true
): AnimationProps {
  if (respectReducedMotion && prefersReducedMotion()) {
    return {
      ...props,
      transition: { duration: 0 },
    };
  }
  return props;
}

// ============================================
// PRESET COMBINATIONS
// ============================================

export const presets = {
  // List entrance with stagger
  listEntrance: {
    container: staggerContainer(staggers.normal),
    item: listItemVariants,
  },
  
  // Card grid entrance
  cardGrid: {
    container: staggerContainer(staggers.slow),
    item: cardVariants,
  },
  
  // Modal appearance
  modal: {
    overlay: modalOverlayVariants,
    content: modalContentVariants,
  },
  
  // Page transition
  page: pageTransitions.premium,
  
  // Toast notification
  toast: toastVariants,
  
  // Dropdown menu
  dropdown: dropdownVariants,
} as const;
