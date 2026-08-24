export type Difficulty = 'BEGINNER+' | 'INTERMEDIATE' | 'ADVANCED';

export interface InterviewQuestion {
  readonly question: string;
  /** Points a strong answer would touch. NOT a script to memorise. */
  readonly discussionPoints: readonly string[];
}

export interface ProjectEntry {
  readonly slug: string;
  readonly number: string;
  readonly name: string;
  /** The problem, in the user's words, not the technology's. */
  readonly problem: string;
  readonly whyItMatters: string;
  readonly difficulty: Difficulty;
  readonly estimatedHours: string;
  readonly port: number;
  readonly directory: string;
  readonly technologies: readonly string[];
  readonly capabilities: readonly string[];
  readonly challenges: readonly { title: string; level: Difficulty }[];
  readonly interviewQuestions: readonly InterviewQuestion[];
}

/**
 * The catalogue is data, not markup.
 *
 * It drives the portal, the per-project pages and the docs index, so a project
 * cannot be renamed in one place and go stale in three others. It is also the
 * fixture the portal tests assert against.
 */
export const PROJECTS: readonly ProjectEntry[] = [
  {
    slug: 'knowledge-copilot',
    number: '01',
    name: 'AI Knowledge Copilot',
    problem:
      'A team keeps its answers in documents nobody rereads. People ask each other instead of searching, and the same question gets answered differently twice.',
    whyItMatters:
      'Retrieval-augmented generation is the single most requested AI skill in graduate job descriptions, and almost every portfolio version of it skips the two parts that matter: citations you can click, and the discipline to answer "I do not know".',
    difficulty: 'INTERMEDIATE',
    estimatedHours: '10–14 hours',
    port: 3001,
    directory: 'projects/01-knowledge-copilot',
    technologies: [
      'Next.js App Router',
      'Chunking + embeddings',
      'Hybrid retrieval',
      'Grounded generation',
      'Citations',
      'Grounding evals',
    ],
    capabilities: [
      'Upload and parse documents',
      'Chunk, embed and index per user',
      'Retrieve, then answer only from what was retrieved',
      'Cite every claim, and refuse when the sources cannot support one',
      'Measure grounding, citation validity and retrieval recall',
    ],
    challenges: [
      { title: 'Add BM25 and fuse it with vector scores', level: 'INTERMEDIATE' },
      { title: 'Add a reranking pass over the top 20 candidates', level: 'ADVANCED' },
      { title: 'Grow the eval set to 30 cases, including adversarial ones', level: 'INTERMEDIATE' },
      { title: 'Stream the answer token by token', level: 'INTERMEDIATE' },
      { title: 'Handle multilingual queries against English documents', level: 'ADVANCED' },
      {
        title: 'Improve the citation hover so the exact sentence is highlighted',
        level: 'BEGINNER+',
      },
      { title: 'Share a document with another user, read-only', level: 'ADVANCED' },
      {
        title: 'Compare three chunking strategies and publish the eval table',
        level: 'INTERMEDIATE',
      },
    ],
    interviewQuestions: [
      {
        question:
          'Walk me through what happens between the user pressing Enter and the answer appearing.',
        discussionPoints: [
          'Validation and auth at the route boundary before any AI cost is incurred',
          'Query embedding, candidate retrieval, score fusion, context assembly',
          'Prompt construction: what is system, what is fenced untrusted data',
          'Validation of the model output before it reaches the UI',
        ],
      },
      {
        question: 'How do you stop the model inventing an answer?',
        discussionPoints: [
          'Grounding rules in the system prompt, and why prompt wording alone is not a control',
          'Citation ids checked against the retrieved set, so a fabricated id is caught in code',
          'An explicit abstention sentence that scores as CORRECT in the eval suite',
          'What is still possible: a fluent answer that cites a real chunk but misreads it',
        ],
      },
      {
        question:
          'Your retrieval returns the wrong chunk. How do you find out, and how do you fix it?',
        discussionPoints: [
          'retrieval_recall in the eval report separates a retrieval failure from a generation failure',
          'Chunk size and overlap trade-offs; the bigram signal in the embedding',
          'Hybrid lexical + dense retrieval, and reranking as the next lever',
        ],
      },
      {
        question: 'What is prompt injection, and which part of this system is exposed to it?',
        discussionPoints: [
          'An uploaded document is attacker-controlled text that reaches the model',
          'Fencing untrusted content and instructing the model to treat it as data',
          'Why that is mitigation, not prevention — and what a stronger answer looks like',
        ],
      },
      {
        question: 'Why does every repository method take an ownerId?',
        discussionPoints: [
          'Broken object-level authorization is the most common serious bug in this class of app',
          'Making the owner mandatory in the type signature rather than remembered per handler',
          'Returning null instead of 403, so the API does not confirm a row exists',
        ],
      },
      {
        question: 'What happens when the AI service is down?',
        discussionPoints: [
          'Timeout, bounded retry with jitter, and why non-retryable errors are not retried',
          'The UI shows a retryable error and keeps the uploaded documents intact',
          'Why the system does NOT silently fall back to mock responses',
        ],
      },
      {
        question: 'How do you know a change to the prompt made things better?',
        discussionPoints: [
          'The eval suite, its scorers, and the thresholds that fail CI',
          'Prompt versioning, so a score can be attributed to a specific prompt',
          'The limits of a 12-case suite and what you would add first',
        ],
      },
      {
        question: 'Why embeddings rather than keyword search? When would keyword search win?',
        discussionPoints: [
          'Synonyms and paraphrase versus exact identifiers, codes and rare terms',
          'The hashing embedding used in mock mode is purely lexical — a deliberate teaching seam',
          'Hybrid retrieval as the answer most production systems reach',
        ],
      },
      {
        question: 'This has to serve 10,000 documents per user. What breaks first?',
        discussionPoints: [
          'In-memory cosine over every chunk is O(n) per query',
          'A real vector index (HNSW/IVF), a managed vector store, and the cost of each',
          'Embedding cost and cache strategy on re-upload',
        ],
      },
      {
        question: 'What would you redesign given another month?',
        discussionPoints: [
          'An honest answer that names a specific weakness rather than adding features',
          'Evidence from the eval report that motivates the choice',
        ],
      },
    ],
  },
  {
    slug: 'document-intelligence',
    number: '02',
    name: 'Document Intelligence',
    problem:
      'Someone retypes invoice totals into a spreadsheet. It takes an afternoon a week and the errors are found a quarter later.',
    whyItMatters:
      'Extraction is where AI meets money, which is why nobody sane lets it write to a ledger unchecked. This project is about the review step: confidence, validation states, and an audit trail that shows who changed what.',
    difficulty: 'INTERMEDIATE',
    estimatedHours: '12–16 hours',
    port: 3002,
    directory: 'projects/02-document-intelligence',
    technologies: [
      'Multimodal extraction',
      'Zod schema validation',
      'Confidence handling',
      'Human review UI',
      'Audit log',
      'Extraction evals',
    ],
    capabilities: [
      'Upload a synthetic invoice as PDF or image',
      'Extract to a typed schema, never to free text',
      'Apply business rules: line items must sum to the total',
      'Route to accepted, requires review, or invalid',
      'Let a human correct any field, and record every correction',
    ],
    challenges: [
      { title: 'Detect duplicate invoices before they are saved', level: 'INTERMEDIATE' },
      { title: 'Support a second document type end to end', level: 'ADVANCED' },
      { title: 'Calibrate confidence against the eval set', level: 'ADVANCED' },
      { title: 'Export accepted records to CSV and JSON', level: 'BEGINNER+' },
      { title: 'Bulk upload with per-file progress and partial failure', level: 'INTERMEDIATE' },
      { title: 'Add a validation rule engine driven by configuration', level: 'ADVANCED' },
      { title: 'Show the source region for a field on hover', level: 'ADVANCED' },
      { title: 'Add keyboard-only review: tab, correct, approve', level: 'BEGINNER+' },
    ],
    interviewQuestions: [
      {
        question: 'The model returns a total of 1,240.00 with confidence 0.94. Do you save it?',
        discussionPoints: [
          'Confidence is a self-report, not a measurement, until it is calibrated',
          'The arithmetic check that does not need the model to be honest',
          'Threshold choice as a business decision about the cost of each error direction',
        ],
      },
      {
        question: 'How does your schema validation differ from your business validation?',
        discussionPoints: [
          'Zod answers "is this the right shape"; rules answer "is this possible"',
          'Line items summing to the total is not expressible in a type',
          'Both must run before a record can leave requires_review',
        ],
      },
      {
        question: 'Where does the audit trail come from, and what would an auditor ask of it?',
        discussionPoints: [
          'Append-only entries, who, when, old value, new value',
          'Why the AI original is never overwritten by the correction',
          'What is missing: signatures, retention, tamper evidence',
        ],
      },
      {
        question: 'What stops a malicious PDF from doing damage here?',
        discussionPoints: [
          'Magic-byte checking, size caps, MIME allowlist and why each alone is bypassable',
          'The file is never executed, and the filename never becomes a path',
          'Prompt injection from document text into the extraction prompt',
        ],
      },
      {
        question: 'How do you measure whether extraction is good?',
        discussionPoints: [
          'Per-field accuracy against a labelled set, not a single overall number',
          'Which fields matter: a wrong total costs more than a wrong supplier address',
          'Calibration as a separate score from accuracy',
        ],
      },
      {
        question: 'Two users upload the same invoice. What should happen?',
        discussionPoints: [
          'Content hashing, and why filename matching is not enough',
          'Per-user isolation means a duplicate is per-user, not global',
          'The UX of a soft warning versus a hard block',
        ],
      },
      {
        question: 'Why is the extracted value editable at all?',
        discussionPoints: [
          'The system is a drafting assistant, not an authority',
          'The corrections are training data for the next iteration',
          'Editability plus audit is what makes the automation acceptable to a finance team',
        ],
      },
      {
        question: 'What happens if the model returns JSON that does not match your schema?',
        discussionPoints: [
          'One repair attempt with the specific failure quoted, then a hard failure',
          'Why partial coercion is worse than rejection',
          'The record enters an invalid state a human can still rescue',
        ],
      },
      {
        question: 'How would this handle 5,000 documents a day?',
        discussionPoints: [
          'Queue and worker rather than request-scoped extraction',
          'Idempotency keys, retry semantics and dead letters',
          'Cost per document, and where batching helps',
        ],
      },
      {
        question: 'What would you redesign given another month?',
        discussionPoints: ['A specific, evidence-backed weakness rather than a feature list'],
      },
    ],
  },
  {
    slug: 'india-voice-assistant',
    number: '03',
    name: 'India Multilingual Voice Assistant',
    problem:
      'Rescheduling an appointment means calling a number, waiting, and speaking English. In Tamil or Hindi, over a patchy line, it often means not rescheduling at all.',
    whyItMatters:
      'Most voice demos are speech-to-chat. This one performs a controlled state change — it identifies intent, extracts the fields, checks availability, asks for confirmation, and only then calls a tool.',
    difficulty: 'ADVANCED',
    estimatedHours: '14–18 hours',
    port: 3003,
    directory: 'projects/03-india-voice-assistant',
    technologies: [
      'Web Speech API',
      'Intent + slot extraction',
      'Tool registry',
      'Confirmation gate',
      'i18n (en / ta / hi)',
      'Multilingual evals',
    ],
    capabilities: [
      'Speak or type — the text path is a first-class fallback, not a degraded mode',
      'Recognise intent and extract the fields a tool needs',
      'Ask for exactly the missing field rather than restarting',
      'Require explicit confirmation before any state change',
      'Run the same evaluation suite in three languages',
    ],
    challenges: [
      { title: 'Add a fourth language end to end', level: 'INTERMEDIATE' },
      { title: 'Handle code-switching mid-sentence', level: 'ADVANCED' },
      { title: 'Resolve ambiguous dates such as "next Friday"', level: 'INTERMEDIATE' },
      { title: 'Recover when the user interrupts the confirmation', level: 'ADVANCED' },
      {
        title: 'Add an eval case set per language with a per-language threshold',
        level: 'INTERMEDIATE',
      },
      { title: 'Announce state changes to a screen reader correctly', level: 'BEGINNER+' },
      { title: 'Add a tool the assistant must learn to NOT call', level: 'INTERMEDIATE' },
      { title: 'Offline transcript export for a support handover', level: 'BEGINNER+' },
    ],
    interviewQuestions: [
      {
        question: 'Why does the model not execute the tool directly?',
        discussionPoints: [
          'Selection and execution are separate steps by design',
          'A mutating tool cannot run without an explicit human confirmation',
          'The failure this prevents: a misheard sentence silently moving an appointment',
        ],
      },
      {
        question:
          'The user says "move it to tomorrow" and the slot is taken. What does the system do?',
        discussionPoints: [
          'Availability is checked before confirmation is offered, not after',
          'Alternatives are proposed with the same tool contract',
          'Why the assistant never confirms something it has not verified',
        ],
      },
      {
        question: 'How do you add a language without touching the workflow code?',
        discussionPoints: [
          'The locale bundle, the recognition language tag, the prompt language hint',
          'What does NOT generalise: date formats, name order, honorifics',
        ],
      },
      {
        question: 'Speech recognition is unavailable in the browser. Then what?',
        discussionPoints: [
          'Feature detection, and the text path being the same code path',
          'Why "voice-only" is an accessibility failure, not a product decision',
        ],
      },
      {
        question: 'How do you evaluate a conversation?',
        discussionPoints: [
          'Tool-selection accuracy and slot extraction as separate scores',
          'Task completion over a multi-turn script',
          'Why per-language thresholds are set separately',
        ],
      },
      {
        question: 'What are the privacy implications of this feature?',
        discussionPoints: [
          'Audio never leaves the browser in this build; the transcript does',
          'What you would have to tell a user before shipping it',
          'Retention of transcripts and the reason to keep it short',
        ],
      },
      {
        question: 'The model picks the wrong tool 1 in 10 times. Is that shippable?',
        discussionPoints: [
          'It depends entirely on whether the wrong tool is reversible',
          'The confirmation gate converts a wrong action into a wrong question',
          'Confidence thresholds and asking rather than guessing',
        ],
      },
      {
        question: 'How is the conversation state kept, and what breaks if the user reloads?',
        discussionPoints: [
          'Server-held state keyed by user versus client state',
          'Idempotency of the confirm step',
        ],
      },
      {
        question: 'Which part of this would you not trust in production?',
        discussionPoints: ['A specific named weakness, with the evidence that led to it'],
      },
      {
        question: 'What would you redesign given another month?',
        discussionPoints: ['Prioritised by evaluated failure rate, not by interest'],
      },
    ],
  },
  {
    slug: 'engineering-agent',
    number: '04',
    name: 'Software Engineering Agent',
    problem:
      'Code review catches what a reviewer has time to look for. The boring, repeated findings — a hardcoded URL, a missing test, a button with no accessible name — are the ones that slip through.',
    whyItMatters:
      'Every company is building one of these right now, and most get the governance wrong. This one cannot modify anything without human approval, and it says how confident it is in every finding.',
    difficulty: 'ADVANCED',
    estimatedHours: '14–20 hours',
    port: 3004,
    directory: 'projects/04-engineering-agent',
    technologies: [
      'Static rule engine',
      'AI review pass',
      'Proposed diffs',
      'Generated tests',
      'Approval workflow',
      'False-positive evals',
    ],
    capabilities: [
      'Analyse a bundled sample repository that contains deliberate defects',
      'Combine deterministic rules with an AI pass, and label which found what',
      'Explain what, why it matters, the fix, the confidence and the affected file',
      'Propose a test that would fail before the fix and pass after',
      'Require human approval before any change is written, ever',
    ],
    challenges: [
      { title: 'Replace the regex rules with an AST-based analysis', level: 'ADVANCED' },
      { title: 'Add three accessibility rules with fixtures', level: 'INTERMEDIATE' },
      { title: 'Flag dependencies with known advisories', level: 'INTERMEDIATE' },
      { title: 'Generate a pull-request summary from approved findings', level: 'BEGINNER+' },
      { title: 'Render a real side-by-side diff', level: 'INTERMEDIATE' },
      { title: 'Build a labelled false-positive eval set', level: 'ADVANCED' },
      { title: 'Score a repository and track the score over time', level: 'INTERMEDIATE' },
      {
        title: 'Let a reviewer reject a finding with a reason that trains the prompt',
        level: 'ADVANCED',
      },
    ],
    interviewQuestions: [
      {
        question: 'Why can this agent not apply its own fix?',
        discussionPoints: [
          'Blast radius: an agent with write access is only as safe as its worst finding',
          'The approval gate, the path allowlist and the sandbox output directory',
          'What you would need before relaxing that — and why "the model is good now" is not it',
        ],
      },
      {
        question: 'Static rules and an AI pass find overlapping issues. How do you present that?',
        discussionPoints: [
          'Deduplication by file, line and rule family',
          'A deterministic finding is more trustworthy than an AI one and is labelled as such',
          'Confidence as a first-class field on every finding',
        ],
      },
      {
        question: 'What is your false-positive rate, and why does it matter more than recall here?',
        discussionPoints: [
          'A reviewer who dismisses three bad findings stops reading the fourth',
          'The eval set with deliberately clean files that must produce no findings',
          'Precision as the metric this tool is actually judged on',
        ],
      },
      {
        question: 'How do you generate a test that is worth having?',
        discussionPoints: [
          'It must fail before the fix — otherwise it proves nothing',
          'The difference between a test and an assertion of current behaviour',
          'Why the generated test is a proposal a human must read',
        ],
      },
      {
        question: 'The agent reads source files. What is the security risk?',
        discussionPoints: [
          'Source code is untrusted input to the prompt; a comment can carry an injection',
          'Path traversal in the file selector and the allowlist that prevents it',
          'Never analysing a URL a user supplies',
        ],
      },
      {
        question: 'How would you extend this to a real repository?',
        discussionPoints: [
          'Read-only clone, a bot account with least privilege, a comment-only integration first',
          'Rate limits and cost per pull request',
        ],
      },
      {
        question: 'Which of your rules would you delete first?',
        discussionPoints: ['Evidence of low precision, and the willingness to remove a feature'],
      },
      {
        question: 'How do you keep this from being a linter with a language model attached?',
        discussionPoints: [
          'The AI pass targets what a rule cannot express: intent, duplication, naming, missing cases',
          'Being honest that some findings ARE lint, and that this is fine',
        ],
      },
      {
        question: 'What does confidence mean here, numerically?',
        discussionPoints: ['Calibration, and what a 0.7 should mean if you measured it'],
      },
      {
        question: 'What would you redesign given another month?',
        discussionPoints: ['A specific weakness, ideally one the eval report exposes'],
      },
    ],
  },
  {
    slug: 'data-decision-assistant',
    number: '05',
    name: 'Data Decision Assistant',
    problem:
      'A dashboard shows attendance dropped in three schools. Nobody can say why, so nothing is decided, and the dashboard is opened again next month.',
    whyItMatters:
      'The hard part of analytics AI is not the chart, it is keeping the observation, the interpretation and the recommendation visibly separate so a human can disagree with exactly one of them.',
    difficulty: 'BEGINNER+',
    estimatedHours: '8–12 hours',
    port: 3005,
    directory: 'projects/05-data-decision-assistant',
    technologies: [
      'CSV import + validation',
      'Anomaly detection',
      'Accessible SVG charts',
      'Evidence-linked explanation',
      'Decision state',
      'Explanation evals',
    ],
    capabilities: [
      'Import a synthetic public-services dataset and validate every row',
      'Detect anomalies with a method you can explain in one sentence',
      'Separate OBSERVATION, AI INTERPRETATION and POSSIBLE ACTION on screen',
      'Attach the rows that support each interpretation',
      'Record a human decision: accepted, rejected, needs more data',
    ],
    challenges: [
      {
        title: 'Import a different open dataset and keep the pipeline working',
        level: 'BEGINNER+',
      },
      { title: 'Add seasonal decomposition before anomaly detection', level: 'ADVANCED' },
      { title: 'Show which rows drove each interpretation, inline', level: 'INTERMEDIATE' },
      { title: 'Add a natural-language filter over the dataset', level: 'ADVANCED' },
      {
        title: 'Add data-quality indicators: missingness, staleness, outliers',
        level: 'INTERMEDIATE',
      },
      { title: 'Make the charts usable at 200% zoom on a phone', level: 'BEGINNER+' },
      { title: 'Add a simple forecast with a stated uncertainty band', level: 'ADVANCED' },
      { title: 'Benchmark two anomaly methods against labelled data', level: 'INTERMEDIATE' },
    ],
    interviewQuestions: [
      {
        question: 'Why separate observation from interpretation on screen?',
        discussionPoints: [
          'An observation is checkable arithmetic; an interpretation is a guess with a reason',
          'A reader must be able to accept one and reject the other',
          'What goes wrong when a dashboard states a cause as a fact',
        ],
      },
      {
        question: 'Explain your anomaly detection to a non-technical stakeholder.',
        discussionPoints: [
          'Rolling median and MAD in one sentence, and why not a plain z-score',
          'What it will miss: a slow drift, a seasonal dip, a step change',
          'The threshold as a dial between noise and blindness',
        ],
      },
      {
        question: 'How do you stop the AI explanation from inventing a cause?',
        discussionPoints: [
          'It only receives the computed statistics, never a free-text prompt about the domain',
          'Every interpretation must cite the row ids that support it',
          'The eval scores whether cited evidence actually exists',
        ],
      },
      {
        question: 'A row has a missing value. What happens?',
        discussionPoints: [
          'Rejected at import with the row number and the reason',
          'Why silently coercing to zero is the worst available option',
          'Partial import with a visible rejection report',
        ],
      },
      {
        question: 'How is your chart accessible?',
        discussionPoints: [
          'A real table with the same numbers, always present',
          'Anomalies encoded by shape, label and text, not only by colour',
          'The validated contrast of the marks against both surfaces',
        ],
      },
      {
        question: 'What does the human decision state actually buy you?',
        discussionPoints: [
          'It closes the loop: a recommendation nobody acted on is a measurable outcome',
          'Rejected recommendations are the most valuable evaluation data in the system',
        ],
      },
      {
        question: 'Your dataset is 2 million rows. What changes?',
        discussionPoints: [
          'Aggregation server-side, sampling for the chart, pagination for the table',
          'Anomaly detection on the aggregate, drill-down on demand',
        ],
      },
      {
        question:
          'What is the difference between a correlation you found and a cause you suggested?',
        discussionPoints: [
          'Confounders, and the phrasing rules the UI enforces',
          'Why "possible action" is phrased as an experiment, not an instruction',
        ],
      },
      {
        question: 'How do you know your explanations are any good?',
        discussionPoints: ['Evidence validity, abstention, and a human review sample'],
      },
      {
        question: 'What would you redesign given another month?',
        discussionPoints: ['One specific weakness with the evidence behind it'],
      },
    ],
  },
];

export const findProject = (slug: string): ProjectEntry | undefined =>
  PROJECTS.find((project) => project.slug === slug);

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  'BEGINNER+': 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};
