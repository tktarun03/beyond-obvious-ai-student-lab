export type AstraEffort = "low" | "medium" | "high" | "xhigh" | "max";

export type TaskRisk = "low" | "medium" | "high" | "critical";
export type TaskComplexity = "simple" | "moderate" | "complex" | "extreme";

export interface TaskProfile {
  complexity: TaskComplexity;
  risk: TaskRisk;
  ambiguousRequirements?: boolean;
  multiSystem?: boolean;
  requiresResearch?: boolean;
  requiresVerification?: boolean;
  highVolume?: boolean;
  latencySensitive?: boolean;
}

export interface PromptInput {
  role?: string;
  objective: string;
  context?: string[];
  constraints?: string[];
  nonGoals?: string[];
  successCriteria?: string[];
  verification?: string[];
  outputContract?: string[];
}

/**
 * A deliberately explainable heuristic.
 *
 * Important: reasoning effort is a tuning knob, not a substitute for a
 * well-scoped task, relevant context, clear constraints and verification.
 */
export function chooseAstraEffort(task: TaskProfile): AstraEffort {
  if (task.highVolume && task.latencySensitive && task.risk === "low") {
    return "low";
  }

  if (task.complexity === "extreme" && (task.risk === "high" || task.risk === "critical")) {
    return "max";
  }

  const hardSignals = [
    task.ambiguousRequirements,
    task.multiSystem,
    task.requiresResearch,
    task.requiresVerification,
  ].filter(Boolean).length;

  if (task.complexity === "complex" && hardSignals >= 3) return "xhigh";
  if (task.complexity === "complex" || task.risk === "high" || hardSignals >= 2) return "high";
  if (task.complexity === "moderate" || task.risk === "medium" || hardSignals === 1) return "medium";

  return "low";
}

function section(title: string, lines?: string[]): string {
  if (!lines?.length) return "";
  return `${title}\n${lines.map((line) => `- ${line}`).join("\n")}`;
}

/** Build a compact, reusable engineering prompt. */
export function buildEngineeringPrompt(input: PromptInput): string {
  const blocks = [
    input.role ? `ROLE\n${input.role}` : "",
    `OBJECTIVE\n${input.objective}`,
    section("CONTEXT", input.context),
    section("CONSTRAINTS", input.constraints),
    section("NON-GOALS", input.nonGoals),
    section("SUCCESS CRITERIA", input.successCriteria),
    section("VERIFY", input.verification),
    section("OUTPUT CONTRACT", input.outputContract),
    `WORKING RULES\n- Distinguish verified facts from assumptions.\n- Do not invent missing evidence.\n- Prefer the smallest safe solution before proposing broad rewrites.\n- Surface material trade-offs and failure modes.\n- Provide concise conclusions and evidence; do not attempt to expose hidden chain-of-thought.`,
  ].filter(Boolean);

  return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// Examples
// ---------------------------------------------------------------------------

const indiaExamPortal: TaskProfile = {
  complexity: "complex",
  risk: "high",
  ambiguousRequirements: true,
  multiSystem: true,
  requiresVerification: true,
};

console.log("Exam portal effort:", chooseAstraEffort(indiaExamPortal));

console.log(
  buildEngineeringPrompt({
    role: "Act as a senior distributed-systems architect.",
    objective: "Design an India-scale exam-results portal for a severe read-traffic spike.",
    context: [
      "Traffic may reach 3 million requests in the first 10 minutes.",
      "Results are read-heavy and mostly immutable after publication.",
      "Many users are on mobile networks.",
    ],
    constraints: [
      "Must degrade gracefully under overload.",
      "Avoid a hard dependency on a single cloud vendor.",
      "Keep the design operationally realistic for a small platform team.",
    ],
    successCriteria: [
      "Architecture identifies cache boundaries and failure domains.",
      "Load-test plan validates the assumed peak.",
      "Recovery and observability paths are explicit.",
    ],
    verification: [
      "Identify assumptions that materially affect capacity.",
      "Check overload, cache-miss storms and origin/database saturation.",
    ],
    outputContract: [
      "Request-flow diagram in Mermaid.",
      "Component responsibilities.",
      "Failure modes and mitigations.",
      "Load-test and rollout checklist.",
    ],
  }),
);

const bulkFormatting: TaskProfile = {
  complexity: "simple",
  risk: "low",
  highVolume: true,
  latencySensitive: true,
};

console.log("Bulk formatting effort:", chooseAstraEffort(bulkFormatting));

/**
 * Suggested API mapping (pseudo-code):
 *
 * const response = await client.responses.create({
 *   model: "gpt-6-astra",
 *   reasoning: { effort: chooseAstraEffort(task) },
 *   input: buildEngineeringPrompt(prompt),
 * });
 *
 * Keep live SDK code aligned with the current official OpenAI API docs.
 */
