# PROMPT-WH-G16 - Paid Fulfillment Handoff

```yaml
id: PROMPT-WH-G16
status: draft
owner: warehouse-fulfillment-owner
created: 2026-07-02
last_updated: 2026-07-02
completeness_level: complete
upstream:
  - docs/13_context_packages/CP-WH-G16.md
downstream:
  - docs/12_validation/VAL-WH-G16.md
related_adrs: []
```

## Task Summary

Implement a Warehouse-owned paid-order fulfillment handoff/pick-ticket contract and keep existing reservation fulfillment stock behavior intact.

## Execution Plan Link

`docs/21_execution_plans/EP-WH-G16.md`

## Required Context

Read the W1 plan, Warehouse invariants, current reservation fulfill path, and Orders Warehouse client shape before coding.

## Allowed Changes

Fulfillment module files, migration, contract docs, IPS docs, and focused tests.

## Forbidden Changes

Do not edit `public/index.html`, `public/landing.css`, Orders code, identity code, deploy scripts, or runtime secrets.

## Implementation Instructions

Add a fulfillment order API that validates fulfilled reservation ids, stores dispatch data, and handles idempotent replay by central order id and reservation ids. Add explicit cancel and return handoff states without hidden stock mutation.

## Acceptance Criteria

Fulfillment handoff requires reservation ids, stores delivery address and line items, rejects non-equivalent replay, and preserves current fulfill idempotency.

## Validation Commands

- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`

## Expected Output

Source/docs changes only. No deploy and no push.
