# Sources and model-claim freshness

Last checked: **27 September 2026**. Recheck before integrating an API or publishing
new model-specific guidance. Account availability and ChatGPT controls can differ
from API capabilities.

| Source                                                                                       | What it supports                                                              |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [GPT-6 Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra) | Model ID `gpt-6-astra`; effort values `low`, `medium`, `high`, `xhigh`, `max` |
| [GPT-6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)           | Model-specific workflow guidance; Astra does not support `none` effort        |
| [Reasoning documentation](https://developers.openai.com/api/docs/guides/reasoning)           | Effort trade-offs; use Responses for Astra tool calling                       |
| [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)       | Explicit task instructions and relevant context                               |

The scenario inputs, manual rubric, efficiency workflow and effort router are original
teaching material for this repository. They are **not official benchmarks or OpenAI
prescriptions**. API support does not imply a particular ChatGPT plan exposes the same
controls. This module does not make live requests, install an OpenAI SDK or promise a
latency, accuracy, price or savings figure.

For updates, cite the exact official page, add the observation date, and explain which
claim changed. Review linked model documentation rather than copying search snippets.
