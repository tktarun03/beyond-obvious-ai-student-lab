import { AppError } from '@lab/shared';
import { getLogger } from '@lab/observability';
import type { z } from 'zod';
import { withRetry } from '../retry.js';
import { toolSelectionSchema } from '../tool-selection.js';
import type {
  AIProvider,
  AIResponse,
  BaseRequest,
  EmbedRequest,
  GenerateStructuredRequest,
  GenerateTextRequest,
  InvokeToolRequest,
  ToolSelection,
} from '../types.js';

/**
 * The one file in this repository allowed to know that Gemini exists.
 *
 * The SDK is imported dynamically so that AI_MODE=mock works even when
 * @google/genai is not installed — a contributor with no interest in live mode
 * should not have to download a vendor SDK to run the tests.
 */

export interface GeminiConfig {
  readonly apiKey: string;
  readonly textModel: string;
  readonly embeddingModel: string;
  readonly maxOutputTokens: number;
  readonly timeoutMs: number;
  readonly maxRetries: number;
}

type GenAIClient = {
  models: {
    generateContent(args: unknown): Promise<unknown>;
    embedContent(args: unknown): Promise<unknown>;
  };
};

const log = getLogger('ai:gemini');

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  readonly mode = 'live' as const;
  readonly textModel: string;
  readonly embeddingModel: string;

  private client: GenAIClient | null = null;

  constructor(private readonly config: GeminiConfig) {
    this.textModel = config.textModel;
    this.embeddingModel = config.embeddingModel;
  }

  private async getClient(): Promise<GenAIClient> {
    if (this.client) return this.client;
    try {
      // The specifier lives in a variable so bundlers treat this as optional.
      const moduleName = '@google/genai';
      const mod = (await import(moduleName)) as {
        GoogleGenAI: new (options: { apiKey: string }) => GenAIClient;
      };
      this.client = new mod.GoogleGenAI({ apiKey: this.config.apiKey });
      return this.client;
    } catch (cause) {
      throw new AppError('AI_UNAVAILABLE', 'The @google/genai SDK is not installed', {
        cause,
        userMessage:
          'Live AI mode is not available in this install. Run "npm install @google/genai", or set AI_MODE=mock.',
      });
    }
  }

  async generateText(request: GenerateTextRequest): Promise<AIResponse<string>> {
    const started = performance.now();
    const { text, usage } = await this.call(request, {});
    return {
      value: text,
      usage,
      model: this.textModel,
      mode: this.mode,
      latencyMs: Math.round(performance.now() - started),
    };
  }

  async generateStructured<T extends z.ZodTypeAny>(
    request: GenerateStructuredRequest<T>,
  ): Promise<AIResponse<z.infer<T>>> {
    const started = performance.now();

    // Ask for JSON at the transport level AND describe the contract in the
    // prompt. Belt and braces: responseMimeType constrains the decoder, the
    // prompt constrains the content, and zod is the only thing we actually trust.
    const first = await this.call(request, { responseMimeType: 'application/json' });
    const attempt = safeParseJson(first.text);
    const parsed = attempt.ok ? request.schema.safeParse(attempt.value) : null;

    if (parsed?.success) {
      return {
        value: parsed.data,
        usage: first.usage,
        model: this.textModel,
        mode: this.mode,
        latencyMs: Math.round(performance.now() - started),
      };
    }

    const problem = attempt.ok
      ? (parsed?.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') ??
        'unknown schema failure')
      : 'response was not valid JSON';

    if (!request.repairOnInvalid) {
      throw new AppError('AI_INVALID_OUTPUT', `Structured output rejected: ${problem}`, {
        details: { task: request.task, schemaName: request.schemaName },
      });
    }

    // One repair attempt, quoting the specific failure back to the model.
    // More than one rarely helps and doubles the bill.
    log.warn('structured output failed validation, attempting repair', {
      task: request.task,
      problem,
    });
    const repair = await this.call(
      {
        ...request,
        messages: [
          ...request.messages,
          { role: 'assistant', content: first.text.slice(0, 4000) },
          {
            role: 'user',
            content: `That response did not satisfy the required schema (${problem}). Reply again with ONLY valid JSON matching the schema. No prose, no markdown fence.`,
          },
        ],
      },
      { responseMimeType: 'application/json' },
    );

    const repaired = safeParseJson(repair.text);
    const revalidated = repaired.ok ? request.schema.safeParse(repaired.value) : null;
    if (!revalidated?.success) {
      throw new AppError('AI_INVALID_OUTPUT', 'Structured output rejected after one repair', {
        details: { task: request.task, schemaName: request.schemaName, problem },
      });
    }

    return {
      value: revalidated.data,
      usage: {
        inputTokens: first.usage.inputTokens + repair.usage.inputTokens,
        outputTokens: first.usage.outputTokens + repair.usage.outputTokens,
      },
      model: this.textModel,
      mode: this.mode,
      latencyMs: Math.round(performance.now() - started),
      degraded: true,
    };
  }

  async embed(request: EmbedRequest): Promise<AIResponse<number[][]>> {
    const started = performance.now();
    const client = await this.getClient();

    const raw = await withRetry(
      () =>
        client.models.embedContent({
          model: this.embeddingModel,
          contents: request.inputs.map((text) => ({ parts: [{ text }] })),
        }),
      { maxRetries: this.config.maxRetries, timeoutMs: this.config.timeoutMs },
    );

    const embeddings = (raw as { embeddings?: { values?: number[] }[] }).embeddings ?? [];
    if (embeddings.length !== request.inputs.length) {
      throw new AppError('AI_INVALID_OUTPUT', 'Embedding count did not match input count', {
        details: { expected: request.inputs.length, received: embeddings.length },
      });
    }

    return {
      value: embeddings.map((e) => e.values ?? []),
      usage: { inputTokens: 0, outputTokens: 0 },
      model: this.embeddingModel,
      mode: this.mode,
      latencyMs: Math.round(performance.now() - started),
    };
  }

  async invokeTool(request: InvokeToolRequest): Promise<AIResponse<ToolSelection>> {
    // Tool *selection* is expressed as structured output rather than the SDK's
    // native function calling, for two reasons: mock and live modes then return
    // the identical shape, and nothing can execute a tool as a side effect of a
    // model call. Execution stays an explicit decision made by the caller.
    const catalogue = request.tools
      .map(
        (tool) =>
          `- ${tool.name}${tool.mutating ? ' (CHANGES DATA - requires user confirmation)' : ''}: ${tool.description}`,
      )
      .join('\n');

    const selection = await this.generateStructured({
      task: request.task,
      schema: toolSelectionSchema,
      schemaName: 'ToolSelection',
      repairOnInvalid: true,
      messages: [
        {
          role: 'system',
          content: [
            'You select at most one tool. Available tools:',
            catalogue,
            '',
            'Return toolName: null when no tool fits.',
            'List any required argument you could not determine in missingFields',
            'rather than inventing a value.',
            'confidence is your honest probability from 0 to 1 that this is the',
            'right tool with the right arguments.',
          ].join('\n'),
        },
        ...request.messages,
      ],
    });

    return selection as AIResponse<ToolSelection>;
  }

  /** The single place where a request actually crosses the network. */
  private async call(
    request: BaseRequest,
    extraConfig: Record<string, unknown>,
  ): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }> {
    const client = await this.getClient();

    const systemInstruction = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const contents: { role: string; parts: unknown[] }[] = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }] as unknown[],
      }));

    if (request.media?.length) {
      contents.push({
        role: 'user',
        parts: request.media.map((media) => ({
          inlineData: { mimeType: media.mimeType, data: media.data },
        })),
      });
    }

    const raw = await withRetry(
      () =>
        client.models.generateContent({
          model: this.textModel,
          contents,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            temperature: request.temperature ?? 0.2,
            maxOutputTokens: Math.min(
              request.maxOutputTokens ?? this.config.maxOutputTokens,
              this.config.maxOutputTokens,
            ),
            ...extraConfig,
          },
        }),
      { maxRetries: this.config.maxRetries, timeoutMs: this.config.timeoutMs },
    );

    const response = raw as {
      text?: string;
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    const text =
      response.text ??
      response.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ??
      '';

    if (!text.trim()) {
      // An empty completion usually means a safety block or a truncation.
      // Treating it as a soft failure beats handing "" to the UI.
      throw new AppError('AI_INVALID_OUTPUT', 'Model returned an empty completion', {
        details: { task: request.task },
        userMessage: 'The AI returned nothing usable. Try rephrasing, or try again.',
      });
    }

    return {
      text,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}

/**
 * Models sometimes wrap JSON in a markdown fence despite being told not to.
 * Recovering from that is cheap; failing the whole request over it is not.
 */
function safeParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return { ok: true, value: JSON.parse(cleaned) };
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (!match) return { ok: false };
    try {
      return { ok: true, value: JSON.parse(match[0]) };
    } catch {
      return { ok: false };
    }
  }
}
