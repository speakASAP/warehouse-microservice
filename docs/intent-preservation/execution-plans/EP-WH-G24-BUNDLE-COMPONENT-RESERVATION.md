# EP-WH-G24-BUNDLE-COMPONENT-RESERVATION

## Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation

## Plan

1. Read Warehouse reservation/stock ownership docs and Catalog bundle contracts.
2. Add Warehouse-owned contract resolving component-line reservation sign-off.
3. Add explicit DTO fail-closed fields for bundle aggregate reservation attempts.
4. Add focused tests proving rejection and preserving normal component-line reservation forwarding.
5. Add a static verifier for the contract/source/test boundary.
6. Run focused Jest, verifier, build, and `git diff --check`.
7. Update state/task/validation evidence and commit/push only if validation passes.

## Parallel Execution

This task is a single-file-boundary Warehouse worker lane because source, tests, and contract docs must agree. External Orders/Payments/FlipFlop lanes remain dependency-gated and must not edit Warehouse files in parallel.

Integration owner: Catalog commerce integration owner.
Validation owner: Warehouse reservation owner for this repo, final integration validator cross-repo.
Merge order: Warehouse sign-off after Catalog aggregate contract and before final checkout smoke.
