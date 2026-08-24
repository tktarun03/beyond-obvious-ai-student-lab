import { z } from 'zod';

/**
 * The shape a tool-selecting model must return, in mock mode and live mode alike.
 *
 * `confidence` and `missingFields` exist so the caller can refuse to act: a
 * low-confidence selection, or one missing a required argument, becomes a
 * clarifying question to the user rather than a guessed API call.
 */
export const toolSelectionSchema = z.object({
  toolName: z.string().min(1).nullable(),
  args: z.record(z.unknown()).default({}),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1).max(400),
  missingFields: z.array(z.string()).default([]),
});

export type ToolSelectionOutput = z.infer<typeof toolSelectionSchema>;
