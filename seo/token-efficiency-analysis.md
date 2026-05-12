# Pack Token Efficiency Evidence

Generated: 2026-05-12

## Bottom Line

Do not publish a percentage energy or token-savings claim yet.

The real local corpus/run found for this work is the 100-case Pack DeeperBench phased run generated on 2026-05-12. It records planner token totals in the local aggregate and matching broader AI-call totals in CloudWatch for the same planning window. Those numbers are valid run evidence, but they are not a competitor or chat-only baseline.

## Real Corpus And Run

- Local aggregate: `PackServer/tmp/pack-deeperbench-phased-full-20260512T121746Z/aggregate.json`
- Case rows: `PackServer/tmp/pack-deeperbench-phased-full-20260512T121746Z/cases.jsonl`
- Prompt set: `PackServer/benchmarks/travel-context/corpus-seeds/hard-100.json`
- Prompt hash: `a80f7947e3bc5df35d83c398561be868e74995cd5917cf653f26d17fae05a7a9`
- Run window: 2026-05-12T12:17:54.291Z to 2026-05-12T14:32:40.545Z
- Case count: 100
- Completed cases: 24
- Planner success count: 31
- Average score: 0.4525

## Local Aggregate Token Totals

These are the planner-result metrics stored in the local run artifact.

- Planner input tokens: 21,850,202
- Planner output tokens: 70,339
- Planner cached tokens: 1,210,985
- Planner total tokens: 21,920,541
- Planner estimated cost: $41.197036
- Subject-filter input tokens: 13,187,384
- Subject-filter output tokens: 918,705
- Known model tokens in local artifact: 36,026,630

Important caveat: 61 of 100 cases have zero planner tokens in the local case rows because they failed or short-circuited before a planner LLM result was recorded. Do not use those rows as evidence of zero-token planning.

For attempted planner rows only:

- Attempted planner rows: 39
- Average planner tokens per attempted row: 562,065
- Median planner tokens per attempted row: 558,043
- Average planner cost per attempted row: $1.056334
- Median planner cost per attempted row: $1.049013

## CloudWatch Cross-Check

CloudWatch was used only to cross-check real AI-call totals for the same benchmark windows. Do not expose log group names or environment labels in public copy.

Extraction window, 2026-05-10T23:50:00Z to 2026-05-12T12:13:00Z:

- AI call rows: 14,160
- Input tokens: 38,723,291
- Output tokens: 3,853,582
- Cache-read tokens: 56,705,760
- Cache-write tokens: 289,770
- Total tokens: 99,572,403
- Estimated model cost: $70.330821

Planning window, 2026-05-12T12:17:00Z to 2026-05-12T14:33:00Z:

- AI call rows: 696
- Input tokens: 22,770,047
- Output tokens: 395,461
- Cache-read tokens: 1,890,830
- Cache-write tokens: 148,460
- Total tokens: 25,204,798
- Estimated model cost: $42.6833

The local aggregate planner token total is 86.97% of the CloudWatch planning-window total. That means the local planner field is useful, but it does not represent every AI call made during the planning window.

## Defensible Internal Takeaways

- Pack has a real 100-case benchmark corpus and run artifact with token and cost accounting.
- Pack's benchmark exercises private context, calendar grounding, email grounding, group travel, public events, flights, hotels, red-herring avoidance, and preference handling.
- The Qwen DeepPlanning travel benchmark runner now supports full-planner token accounting. A one-case smoke run recorded nonzero token metrics in `PackServer/tmp/qwen-token-accounting-full-planner-smoke-3/benchmark-summary.json`.
- The current run is a reliability and accounting baseline, not proof of reduced energy versus competitors.
- Any public token or energy percentage needs a same-corpus baseline, ideally chat-only versus Pack structured planning.

## DeepPlanning Token Accounting Check

This is a runner validation, not a broad benchmark result.

- Benchmark: Qwen DeepPlanning travelplanning case 22
- Runner mode: full planner
- Artifact: `PackServer/tmp/qwen-token-accounting-full-planner-smoke-3/benchmark-summary.json`
- Token accounting available: yes
- Total LLM calls: 4
- Input tokens: 956
- Output tokens: 1,760
- Cached tokens: 28,428
- Total tokens: 31,144
- Estimated model cost: $0.027327

This confirms the DeepPlanning path can now produce real token totals. Use a larger same-corpus run before making aggregate claims.

## Claims To Avoid

- Do not claim Pack uses X% less energy than competitors from this evidence.
- Do not claim zero-token planning from failed or short-circuited rows.
- Do not compare local aggregate planner tokens against CloudWatch totals as a savings percentage.
- Do not expose environment names, log group names, S3 paths, internal account details, or raw trace identifiers in public copy.

## Next Benchmark Required

Run the same 100 prompts through:

1. A chat-only baseline that receives the same task context.
2. Pack's structured travel-planning path with full AI-call accounting.
3. The same scoring rubric and the same token/cost rollup.

Only after that can Pack publish a measured percent fewer tokens, percent lower estimated model cost, or percent lower estimated AI energy for this workflow.
