import { AppError, estimateTokens, shortHash } from '@lab/shared';
import type { z } from 'zod';
import { hashingEmbedding, MOCK_EMBEDDING_DIMENSIONS } from '../embedding.js';
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
 * The mock provider is a first-class implementation, not a placeholder.
 *
 * Design rules it must keep:
 *   • deterministic — the same request always yields the same response, so eval
 *     scores are comparable between runs and CI never flakes;
 *   • honest — it can return "I don't have enough information", low confidence,
 *     and malformed-then-repaired output, because a mock that only ever returns
 *     the happy path teaches students to build UIs that only handle the happy path;
 *   • free — no network, no key, no bill.
 */

export type MockHandler = (request: BaseRequest) => unknown;

const handlers = new Map<string, MockHandler>();

/**
 * Projects register their own fixtures for their own tasks. Keeping fixtures
 * next to the feature they describe is what stops this file becoming a
 * thousand-line switch statement.
 */
export function registerMockHandler(task: string, handler: MockHandler): void {
  handlers.set(task, handler);
}

export function clearMockHandlers(): void {
  handlers.clear();
}

export function hasMockHandler(task: string): boolean {
  return handlers.has(task);
}

const usageFor = (request: { messages?: readonly { content: string }[] }, output: string) => ({
  inputTokens: estimateTokens((request.messages ?? []).map((m) => m.content).join('\n')),
  outputTokens: estimateTokens(output),
});

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';
  readonly mode = 'mock' as const;
  readonly textModel = 'mock-text';
  readonly embeddingModel = 'mock-embedding';

  async generateText(request: GenerateTextRequest): Promise<AIResponse<string>> {
    const handler = handlers.get(request.task);
    const raw = handler ? handler(request) : this.defaultText(request);
    const value = typeof raw === 'string' ? raw : JSON.stringify(raw);
    return this.wrap(value, usageFor(request, value));
  }

  async generateStructured<T extends z.ZodTypeAny>(
    request: GenerateStructuredRequest<T>,
  ): Promise<AIResponse<z.infer<T>>> {
    const handler = handlers.get(request.task);
    if (!handler) {
      throw new AppError(
        'AI_INVALID_OUTPUT',
        `No mock fixture registered for structured task "${request.task}"`,
        {
          userMessage:
            'This feature has no offline sample response yet. Register a mock handler, or set AI_MODE=live.',
          details: { task: request.task, schemaName: request.schemaName },
        },
      );
    }

    const produced = handler(request);
    const parsed = request.schema.safeParse(produced);
    if (!parsed.success) {
      // Mirrors the live provider: an output that fails its schema is discarded,
      // never coerced. A half-parsed AI response is worse than no response.
      throw new AppError('AI_INVALID_OUTPUT', 'Mock fixture failed its own schema', {
        details: { task: request.task, issues: parsed.error.issues.slice(0, 3) },
      });
    }

    const serialised = JSON.stringify(parsed.data);
    return this.wrap(parsed.data, usageFor(request, serialised));
  }

  async embed(request: EmbedRequest): Promise<AIResponse<number[][]>> {
    const vectors = request.inputs.map((input) =>
      hashingEmbedding(input, MOCK_EMBEDDING_DIMENSIONS),
    );
    return {
      value: vectors,
      usage: {
        inputTokens: request.inputs.reduce((n, i) => n + estimateTokens(i), 0),
        outputTokens: 0,
      },
      model: this.embeddingModel,
      mode: this.mode,
      latencyMs: 0,
    };
  }

  async invokeTool(request: InvokeToolRequest): Promise<AIResponse<ToolSelection>> {
    const handler = handlers.get(request.task);
    if (handler) {
      const selection = handler(request) as ToolSelection;
      return this.wrap(selection, usageFor(request, JSON.stringify(selection)));
    }

    // Fallback: pick the tool whose name or description shares the most words
    // with the latest user turn. Crude on purpose — projects that care about
    // tool selection register a real fixture and evaluate it.
    const utterance = [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const words = new Set(utterance.toLowerCase().split(/\W+/).filter(Boolean));
    let best: { name: string; score: number } | null = null;
    for (const tool of request.tools) {
      const terms = `${tool.name} ${tool.description}`.toLowerCase().split(/\W+/);
      const score = terms.filter((t) => t.length > 3 && words.has(t)).length;
      if (!best || score > best.score) best = { name: tool.name, score };
    }

    const selection: ToolSelection = {
      toolName: best && best.score > 0 ? best.name : null,
      args: {},
      confidence: best && best.score > 0 ? Math.min(0.6, 0.3 + best.score * 0.1) : 0.1,
      rationale: best?.score
        ? `Lexical overlap with "${best.name}" in the user's message.`
        : 'No tool matched the request confidently.',
      missingFields: [],
    };
    return this.wrap(selection, usageFor(request, JSON.stringify(selection)));
  }

  /**
   * Deterministic text for a task with no registered fixture. It is obviously
   * synthetic on purpose: a student should never mistake mock output for a
   * model's real answer while demoing.
   */
  private defaultText(request: GenerateTextRequest): string {
    const last = [...request.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const fingerprint = shortHash(`${request.task}:${last}`);
    return [
      `[mock:${request.task}] This is a deterministic offline response (${fingerprint}).`,
      '',
      "I don't have enough information in the provided documents.",
      '',
      'Set AI_MODE=live with a GEMINI_API_KEY to see a real model answer, or register a',
      'mock fixture for this task so the offline experience matches the feature.',
    ].join('\n');
  }

  private wrap<T>(value: T, usage: { inputTokens: number; outputTokens: number }): AIResponse<T> {
    return { value, usage, model: this.textModel, mode: this.mode, latencyMs: 0 };
  }
}
