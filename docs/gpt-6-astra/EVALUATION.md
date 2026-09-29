# Measure usefulness and efficiency

This workbook measures a real task outcome. Passing `astra:check` means the local
router, prompt packaging and CLI work; it says nothing about an AI model's accuracy.
The repository includes **no live-model benchmark results**.

## Define a comparison before running it

Choose two or three scenarios and write the acceptance checks first. Fix the model ID,
prompt revision, input fixture, available tools and output format. Change one variable:
prompt structure, context selection, model, or effort. Use new conversations and record
the environment so hidden history does not confound the comparison.

For each condition, repeat runs (start with three). These small samples are classroom
observations, not statistically reliable rankings. Randomize run order, preserve failed
runs and review outputs without looking at the condition when practical.

## Score one answer

| Dimension    | 0                                  | 1                             | 2                                                                    |
| ------------ | ---------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Correctness  | Core behavior is wrong             | Partly correct; material gaps | All four scenario checks are satisfied                               |
| Evidence     | Invented claims or ignored fixture | Some claims lack support      | Claims trace to supplied evidence; uncertainty is clear              |
| Constraints  | Violates a hard constraint         | Minor omissions               | Respects scope, data and output constraints                          |
| Verification | No meaningful verification         | Useful but incomplete plan    | Appropriate tests/checks; executed versus proposed clearly separated |
| Usability    | Cannot act on it                   | Needs substantial editing     | Concise, actionable output for the intended learner                  |

Local classroom pass rule: at least **8/10**, correctness **2**, and no hard-constraint
violation. Keep each dimension and the four check decisions, not just the total.
A proposed patch must be tested before counting it as a working implementation.
A second human reviewer should resolve disagreements for shared results.

## Record efficiency honestly

Start from [the blank CSV](../../examples/gpt-6-astra/evaluation-template.csv).
Record elapsed time, retries and observed API usage only when available. For manual
ChatGPT use, leave token/cost fields empty when the product does not expose them;
do not estimate tokens from word counts or infer API cost from subscription price.

- Completion rate = accepted tasks / attempted tasks.
- Mean cost per accepted task = total measured cost across **all** attempts / accepted tasks.
- If no tasks pass, cost per accepted task is **undefined**, not zero.
- Include retries, reasoning/tool costs and billable cache activity when the API exposes them.
- Compare latency distributions only with enough observations; report individual times for tiny samples.
- Report the pricing source, currency and observation date; do not embed stale rates in code.

Example arithmetic using **invented classroom costs, not model prices**: six attempts
cost 0.30 currency units in total and three are accepted. The cost per accepted task
is 0.10 units, including unsuccessful attempts. No savings claim follows without a
baseline measured on the same workload.

## Improve before increasing effort

1. Use deterministic code for fixed-rule operations.
2. Fix missing evidence, ambiguity and acceptance criteria.
3. Remove duplicate or irrelevant context; retain critical constraints.
4. Request only the output needed for the next decision.
5. Test an efficient model or lower effort on the same rubric.
6. Raise effort only if it improves accepted outcomes enough for your latency/cost budget.
7. Stop when the acceptance criteria are satisfied; avoid endless self-review loops.

Record both wins and regressions. Never describe the router's recommendation as a
measured optimum. Keep a sanitized report with enough detail for another learner to reproduce it.
