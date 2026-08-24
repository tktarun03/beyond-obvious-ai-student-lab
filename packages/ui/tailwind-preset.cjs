/**
 * Tailwind preset that exposes the design tokens as utilities.
 *
 * The CSS custom properties in tokens.css remain the single source of truth —
 * this file only teaches Tailwind their names. That ordering matters: if the
 * hex values lived here instead, the plain-CSS component layer and the utility
 * classes would drift apart the first time someone edited one of them.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        amber: {
          200: 'var(--lab-amber-200)',
          400: 'var(--lab-amber-400)',
          500: 'var(--lab-amber-500)',
          600: 'var(--lab-amber-600)',
        },
        deck: {
          0: 'var(--lab-deck-000)',
          100: 'var(--lab-deck-100)',
          200: 'var(--lab-deck-200)',
          300: 'var(--lab-deck-300)',
          400: 'var(--lab-deck-400)',
        },
        frost: {
          0: 'var(--lab-frost-000)',
          100: 'var(--lab-frost-100)',
          200: 'var(--lab-frost-200)',
          300: 'var(--lab-frost-300)',
        },
        verified: 'var(--lab-verified)',
        caution: 'var(--lab-caution)',
        info: 'var(--lab-info)',
        focus: 'var(--lab-focus)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        hairline: 'var(--hairline)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
      },
      fontFamily: {
        display: 'var(--lab-font-display)',
        body: 'var(--lab-font-body)',
        data: 'var(--lab-font-data)',
      },
      borderRadius: {
        1: 'var(--lab-radius-1)',
        2: 'var(--lab-radius-2)',
        3: 'var(--lab-radius-3)',
      },
      boxShadow: {
        lift1: 'var(--lab-lift-1)',
        lift2: 'var(--lab-lift-2)',
        lift3: 'var(--lab-lift-3)',
      },
      maxWidth: { container: 'var(--lab-container)' },
      transitionTimingFunction: {
        out: 'var(--lab-ease-out)',
        punch: 'var(--lab-ease-punch)',
      },
    },
  },
};
