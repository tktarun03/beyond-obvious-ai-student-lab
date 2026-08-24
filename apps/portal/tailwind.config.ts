import type { Config } from 'tailwindcss';
import preset from '@lab/ui/tailwind-preset';

/**
 * Tailwind is a convenience layer here, not the design system. The system is
 * the token file and the component classes in @lab/ui; the preset simply makes
 * the same tokens reachable from a utility class so one-off layout tweaks do
 * not require inventing new CSS.
 */
const config: Config = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
