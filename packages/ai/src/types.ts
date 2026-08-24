import type { TokenUsage } from '@lab/observability';
import type { z } from 'zod';

/**
 * The provider seam.
 *
 * Nothing outside packages/ai imports a vendor SDK. That single rule buys three
 * things a portfolio project is normally missing:
 *   1. `AI_MODE=mock` is a real, complete implementation — not a stub — so the
 *      whole repository runs, tests and evaluates with no key and no cost.
 *   2. Swapping model vendors is a change in one directory.
 *   3. Retries, timeouts, budgets and token accounting are applied once, so no
 *      project can accidentally ship without them.
 */

export type AIMode = 'mock' | 'live';

export interface AIMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

/** An image or document handed to a multimodal model. */
export interface AIMediaPart {
  readonly mimeType: string;
  /** base64, without a data: prefix. */
  readonly data: string;
}

export interface AIResponse<T> {
  readonly value: T;
  readonly usage: TokenUsage;
  readonly model: string;
  readonly mode: AIMode;
  readonly latencyMs: number;
  /**
   * Set when the provider had to fall back (for example, structured output
   * failed validation and a repair attempt was made). The UI is allowed to
   * treat a degraded response differently.
   */
  readonly degraded?: boolean;
}

export interface BaseRequest {
  /**
   * A stable identifier for the *kind* of call, e.g. 'rag.answer'.
   * Used to route mock fixtures, to group logs and to attribute cost.
   * Required, because "which prompt was that?" is unanswerable without it.
   */
  readonly task: string;
  readonly messages: readonly AIMessage[];
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  readonly media?: readonly AIMediaPart[];
  readonly signal?: AbortSignal;
}

export type GenerateTextRequest = BaseRequest;

export interface GenerateStructuredRequest<T extends z.ZodTypeAny> extends BaseRequest {
  /**
   * The contract the model output must satisfy. Validation is not optional:
   * an unvalidated model response is untrusted input that has already been
   * given the shape of trusted data.
   */
  readonly schema: T;
  readonly schemaName: string;
  /** Retry once with the validation error appended before giving up. */
  readonly repairOnInvalid?: boolean;
}

export interface EmbedRequest {
  readonly task: string;
  readonly inputs: readonly string[];
  readonly signal?: AbortSignal;
}

export interface ToolDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  readonly name: string;
  /** Written for the model, not for a human reader. Say when NOT to use it. */
  readonly description: string;
  readonly parameters: T;
  /**
   * State-changing tools must be confirmed by a person before execution.
   * The runtime enforces this; it is not left to prompt wording.
   */
  readonly mutating: boolean;
}

export interface ToolSelection {
  readonly toolName: string | null;
  readonly args: Record<string, unknown>;
  readonly confidence: number;
  /** Why this tool, in one sentence, for the audit trail and the review UI. */
  readonly rationale: string;
  /** Fields the model could not fill and must ask the user about. */
  readonly missingFields: readonly string[];
}

export interface InvokeToolRequest {
  readonly task: string;
  readonly messages: readonly AIMessage[];
  readonly tools: readonly ToolDefinition[];
  readonly signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: string;
  readonly mode: AIMode;
  readonly textModel: string;
  readonly embeddingModel: string;

  generateText(request: GenerateTextRequest): Promise<AIResponse<string>>;

  generateStructured<T extends z.ZodTypeAny>(
    request: GenerateStructuredRequest<T>,
  ): Promise<AIResponse<z.infer<T>>>;

  embed(request: EmbedRequest): Promise<AIResponse<number[][]>>;

  /**
   * Chooses a tool and extracts its arguments. Deliberately does NOT execute
   * anything: execution is the caller's decision, after a confirmation gate.
   */
  invokeTool(request: InvokeToolRequest): Promise<AIResponse<ToolSelection>>;
}
