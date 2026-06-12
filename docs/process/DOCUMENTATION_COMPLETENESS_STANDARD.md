# Documentation Completeness Standard

Goal documents, plans, prompts, and validation reports must be specific enough for another session to resume without chat history.

Major IPS documents should include a metadata block:

```yaml
id: DOC-ID
status: draft | reviewed | approved | deprecated
owner: warehouse-owner
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
completeness_level: skeletal | partial | complete | validated
upstream:
  - path/to/upstream.md
downstream:
  - path/to/downstream.md
related_adrs: []
```

## Required Sections For Goal Files

- Objective
- Current Evidence
- Scope
- Non-Goals
- Acceptance Criteria
- Required Reading
- Implementation Notes
- Validation
- Risks
- Completion Report Requirements

## Required Sections For Execution Plans

- Metadata
- Upstream Traceability
- Goal Impact
- Project Invariants
- Sensitive-Data Handling
- Contract Validation Plan
- Replay/Determinism Plan
- Scope
- Non-Goals
- Files To Inspect
- Files To Create
- Files To Modify
- Files That Must Not Be Modified
- Implementation Steps
- Test Plan
- Validation Plan
- Gate Commands
- Documentation Updates
- Rollback Plan
- Agent Handoff Prompt
- Completion Checklist

## Required Sections For Task Documents

- Objective
- Upstream Links
- Goal Impact
- Project Invariant Impact
- Sensitive-Data Classification
- Contract/Schema Impact
- Replay/Determinism Impact
- Scope
- Non-Goals
- Acceptance Criteria
- Required Context
- Validation Task
- Required Gates

## Required Sections For Context Packages

- Task Summary
- Source Documents
- Relevant Files
- Current Behavior
- Required Behavior
- Constraints
- Known Risks
- Validation Commands

## Required Sections For Coding Prompts

- Task Summary
- Execution Plan Link
- Required Context
- Allowed Changes
- Forbidden Changes
- Implementation Instructions
- Acceptance Criteria
- Validation Commands
- Expected Output

## Required Sections For Validation Reports

- Artifact Validated
- Validation Scope
- Evidence
- Gate Evidence
- Invariant Evidence
- Sensitive-Data Scan Evidence
- Replay And Determinism Evidence
- Passed Criteria
- Failed Criteria
- Deviations
- Recommendation

## Marker Policy

Use explicit markers when a section is intentionally pending:

- `TBD_OWNER_DECISION`
- `TBD_AFTER_INSPECTION`
- `BLOCKED`
- `[MISSING: describe what is missing and who should provide it]`
- `[UNKNOWN: describe what is unknown and how to discover it]`

Do not leave vague placeholders such as "todo" in authoritative docs.
