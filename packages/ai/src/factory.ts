import { getLogger, TokenMeter, withSpan } from '@lab/observability';
import { loadEnv, type Env } from '@lab/validation';
import type { z } from 'zod';
import { GeminiProvider } from './providers/gemini.js';
import { MockAIProvider } from './providers/mock.js';
import type {
  AIProvider,
  AIResponse,
  EmbedRequest,
  GenerateStructuredRequest,
  GenerateTextRequest,
  InvokeToolRequest,
  ToolSelection,
} from './types.js';

/**
 * Cross-cutting concerns live in a decorator rather than in each provider.
 *
 * WHY: budget enforcement, timing and token accounting must be impossible to
 * forget. If they lived inside GeminiProvider, the mock path would silently
 * lose them, and every eval run would report different numbers depending on
 * which mode it used.
 */
export class InstrumentedProvider implements AIProvider {
  readonly name: string;
  readonly mode;
  readonly textModel: string;
  readonly embeddingModel: string;

  private readonly log = getLogger('ai');

  constructor(
    private readonly inner: AIProvider,
    readonly meter: TokenMeter,
  ) {
    this.name = `${inner.name}+instrumented`;
    this.mode = inner.mode;
    this.textModel = inner.textModel;
    this.embeddingModel = inner.embeddingModel;
  }

  async generateText(request: GenerateTextRequest): Promise<AIResponse<string>> {
    return this.run('ai.generateText', request.task, () => this.inner.generateText(request));
  }

  async generateStructured<T extends z.ZodTypeAny>(
    request: GenerateStructuredRequest<T>,
  ): Promise<AIResponse<z.infer<T>>> {
    return this.run('ai.generateStructured', request.task, () =>
      this.inner.generateStructured(request),
    );
  }

  async embed(request: EmbedRequest): Promise<AIResponse<number[][]>> {
    return this.run('ai.embed', request.task, () => this.inner.embed(request));
  }

  async invokeTool(request: InvokeToolRequest): Promise<AIResponse<ToolSelection>> {
    return this.run('ai.invokeTool', request.task, () => this.inner.invokeTool(request));
  }

  private async run<T>(
    span: string,
    task: string,
    operation: () => Promise<AIResponse<T>>,
  ): Promise<AIResponse<T>> {
    // Checked BEFORE the call: refusing to spend is the whole point.
    this.meter.assertWithinBudget();

    const response = await withSpan(span, { task, mode: this.mode }, operation, this.log);
    this.meter.record(response.usage);

    if (response.degraded) {
      this.log.warn('ai response was degraded', { task, model: response.model });
    }
    return response;
  }
}

export interface CreateProviderOptions {
  readonly env?: Env;
  /** Share one meter across a request or an eval run to enforce a single budget. */
  readonly meter?: TokenMeter;
}

/**
 * The only supported way to obtain a provider.
 *
 * Note what this does NOT do: fall back to mock when a live call fails. A
 * silent downgrade would make a broken production deploy look healthy while
 * serving fabricated answers — the single worst failure mode this repository
 * can have.
 */
export function createAIProvider(options: CreateProviderOptions = {}): InstrumentedProvider {
  const env = options.env ?? loadEnv();
  const meter = options.meter ?? new TokenMeter(env.AI_SESSION_TOKEN_BUDGET);

  const inner: AIProvider =
    env.AI_MODE === 'live'
      ? new GeminiProvider({
          // Validated in packages/validation: AI_MODE=live requires this key.
          apiKey: env.GEMINI_API_KEY!,
          textModel: env.GEMINI_TEXT_MODEL,
          embeddingModel: env.GEMINI_EMBEDDING_MODEL,
          maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
          timeoutMs: env.AI_TIMEOUT_MS,
          maxRetries: env.AI_MAX_RETRIES,
        })
      : new MockAIProvider();

  return new InstrumentedProvider(inner, meter);
}
