# VAL-WH-G3: Stock Mutation Invariants Validation Report

```yaml
id: VAL-WH-G3
status: validated
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/21_execution_plans/EP-WH-G3.md
downstream:
  - docs/IMPLEMENTATION_STATE.md
  - TASKS.md
  - STATE.json
related_adrs: []
```

## Artifact Validated

WH-G3 stock mutation invariants implementation.

## Validation Scope

Planned scope:

- request contract validation;
- required reason code and actor/service identity;
- non-negative stock state;
- transactional stock update plus movement evidence;
- focused tests;
- build verification.

## Evidence

Historical evidence from `TASKS.md` and `docs/IMPLEMENTATION_STATE.md`:

- WH-G3 added stock mutation DTOs for set, increment, decrement, reserve, and unreserve.
- Each changed stock mutation requires `reasonCode` and `actor`.
- WH-G3 wrapped stock row writes and stock movement inserts in TypeORM transactions with write locks on existing stock rows.
- `npm test` passed.
- `npm run build` passed.
- WH-G3 deployed image `localhost:5000/warehouse-microservice:0350b8e`; rollout and production health check passed.

## Gate Evidence

Pre-coding gate evidence was not captured in IPS form at the time WH-G3 was implemented. This report backfills the WH-G3 chain from existing project evidence and establishes the IPS gate as mandatory for future coding.

```text
Gate: retrospective IPS backfill
Date: 2026-06-12
Goal: WH-G3
Task: WH-G3-T1, WH-G3-T2, WH-G3-T3
Repository root: remote-sync local documentation mirror
Git status: remote-sync is untracked in the local workspace
Remote status: WH-G3 completion evidence already recorded in TASKS.md
Execution plan: docs/21_execution_plans/EP-WH-G3.md
Context package: docs/13_context_packages/CP-WH-G3.md
Coding prompt: docs/14_prompts/PROMPT-WH-G3.md
Result: pass as historical backfill; future coding requires pre-coding gate before source edits
```

## Invariant Evidence

- Invariant 6, append-only movement evidence: movement inserts are wrapped with stock writes in transactions.
- Invariant 7, actor/reason/auth: DTOs require `reasonCode` and `actor`.
- Invariant 8, non-negative state: WH-G3 invariant tests passed.
- Invariant 9, deterministic state changes: transaction boundary and write locks added.
- Invariant 11, no production stock mutation: no agent stock mutation payload is recorded in WH-G3 evidence.
- Invariant 12, no deployment without approval: deployment evidence is recorded in completed task history.

## Sensitive-Data Scan Evidence

No secrets, real JWTs, raw production stock rows, customer identifiers, supplier records, or real order data are included in this report.

## Replay And Determinism Evidence

Transaction evidence is recorded in `TASKS.md`; stock row writes and movement inserts are covered by TypeORM transactions with write locks on existing stock rows.

## Passed Criteria

- Stock write requests use DTOs.
- Reason code and actor are required.
- Stock row writes and movement inserts are transactional.
- `npm test` passed.
- `npm run build` passed.
- Production rollout and health check passed.

## Failed Criteria

None recorded in the existing WH-G3 evidence.

## Deviations

The IPS gate was introduced after WH-G3 implementation. This report is a retrospective backfill, not original pre-coding evidence.

## Recommendation

WH-G3 is complete. Future implementation goals must capture IPS pre-coding gate evidence before source edits.
