# Agent Gap Filling Rules

Agents may fill operational gaps only when the answer follows directly from repository evidence, existing system behavior, or preserved intent.

Agents may:

- choose the earliest ready goal;
- split a goal into implementation tasks;
- add execution plans, context packages, coding prompts, and validation reports;
- tighten acceptance criteria without changing business meaning;
- add tests that prove documented behavior;
- document unknowns as blockers.

Agents must ask the owner when:

- product ownership boundaries would change;
- production stock data would be mutated;
- deployment should be performed;
- catalog, auth, order, or supplier contracts are ambiguous in a way that affects behavior;
- a task would remove or rewrite append-only business evidence.

Agents must not:

- invent stock semantics that conflict with the intent plan;
- bypass auth or service identity requirements;
- mark work complete without validation evidence;
- silently change completed goal history;
- revert unrelated human or agent changes.

