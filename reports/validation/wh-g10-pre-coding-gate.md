# WH-G10 Pre-Coding Gate

Gate: pre-coding
Date: 2026-06-13
Goal: WH-G10
Task: WH-G10-T1
Repository root: /home/ssf/Documents/Github/warehouse-microservice
Git status: checked before coding
Execution plan: docs/intent-preservation/execution-plans/EP-WH-G10.md
Context package: docs/intent-preservation/context-packages/CP-WH-G10.md
Coding prompt: docs/intent-preservation/coding-prompts/PROMPT-WH-G10.md
Invariants checked: Auth owns login/JWT/RBAC; warehouse remains stock authority; server API guards remain authoritative; no production stock mutation; no deployment without owner approval.
Sensitive-data classification: credentials entered by user only; no secrets written to docs, logs, or frontend config.
Contract/schema impact: frontend consumes Auth login/register contract; no warehouse schema/API change.
Replay/determinism impact: none for stock state; browser auth state only.
Validation commands: node --check public/admin/app.js; node --check public/landing.js; npm run build.
Result: pass-with-documented-risk because registration can create a user but does not grant warehouse admin rights; UI must clearly block non-admin users.
