# Pack Token Efficiency Evidence

Generated: 2026-05-12

## Bottom Line

Use DeepPlanning as reliability evidence and CloudWatch as token evidence.

The local DeepPlanning run proves Pack can handle compatible travel-planning cases through the local planner harness, but it does not emit token usage fields. CloudWatch does emit planner token metrics, so any token or energy claim should be based on CloudWatch token records or a new benchmark with token accounting enabled.

## Local DeepPlanning Run

- Source: `PackServer/tmp/qwen-travel-hermetic-benchmark/2026-04-23T19-09-50-566Z/benchmark-summary.json`
- Dataset: Qwen DeepPlanning travelplanning query set
- Execution mode: `local_handler`
- Runnable cases: 2 of 120
- Delivery rate: 100%
- Average core score: 0.882
- Average processing duration: 6.09s
- Token usage fields: not present

Interpretation: this is a reliability signal, not a token-savings measurement.

## CloudWatch Token Baseline

Window checked: last 14 days from 2026-05-12, `us-east-1`.

### Production Planner

- Log group: `/aws/lambda/prod-travel-planner`
- Completed metric records: 72
- Zero-token records: 17
- Zero-token record rate: 23.6%
- Nonzero-token records: 55
- Nonzero average total tokens: 33,506
- Nonzero p50 total tokens: 32,556
- Nonzero p90 total tokens: 57,574
- Nonzero average LLM calls: 6.98

### Dev Planner

- Log group: `/aws/lambda/dev-travel-planner`
- Completed metric records: 284
- Zero-token records: 53
- Zero-token record rate: 18.7%
- Nonzero-token records: 231
- Nonzero average total tokens: 35,784
- Nonzero p50 total tokens: 32,919
- Nonzero p90 total tokens: 48,224
- Nonzero average LLM calls: 5.54

## Defensible Claims

- Some Pack planner runs complete with zero model tokens when structured and deterministic paths can finish the task.
- In the checked production sample, 17 of 72 completed planner metric records used zero model tokens.
- In the checked production sample, planner runs that did use a model averaged about 33.5k total tokens.
- Pack can use the nonzero-run average as the current baseline for future token-efficiency improvements.

## Claims To Avoid For Now

- Do not say Pack uses a blanket `X% less energy` than competitors.
- Do not say the DeepPlanning local run proves a token-savings percentage.
- Do not translate tokens into energy unless the estimate is tied to a specific model/provider methodology.

## Next Benchmark

Run the same DeepPlanning-compatible cases through:

1. A chat-only baseline that receives the full task context each turn.
2. Pack's structured-context path with token accounting enabled.
3. A deterministic-only path where the planner can finish from structured facts.

Then compare input tokens, output tokens, cache-read tokens, cache-write tokens, total model calls, corrections, and final rubric score.
