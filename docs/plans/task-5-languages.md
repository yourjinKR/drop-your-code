# Phase 1 Task 5 — Manual language selection

**Goal:** Select any of the 14 initial languages and highlight code without replacing the open document or its edit history.

**Spec:** [Phase 1, Task 5](phase-1-editor-foundation.md#작업-5--초기-언어-전체와-수동-선택강조), [UI specification](../architecture/design/ui-spec.md), PRD FR-LANG-01 and the manual portion of FR-LANG-02.

- [x] Write integration tests for an out-of-order load, failure followed by retry, and a selection/Undo that survives language changes. Confirm the baseline fails before the language registry and control exist.
- [x] Add `src/editor/languages.ts` with an explicit, exhaustive registry and `loadLanguage(id: LanguageId): Promise<LanguageSupport | null>`. Dynamically import the official CodeMirror packages; adapt Kotlin and Shell via `StreamLanguage`. Reuse pending and successful requests; evict failures. Use the fixture corpus in `tests/fixtures/code/` to check real tokenization, language indentation and comments in unit tests.
- [x] Render one `Language` control in `Properties` → `Code`; retain the last applied language in the status bar during loading and on failure. Only the latest successful request updates manual settings and the language compartment. Keep the same editor instance and use a fixed highlight palette for the current dark code surface.
- [x] In Chromium, use the production build to cover all fixtures, editing commands and Undo, load races, failed chunk isolation, and language reuse during an offline session. Record build sizes, language quality and network limitations in [the verification report](../verification/task-5-languages.md). Run typecheck, the full test suite, production build and Chromium suite before the task PR.

No detection, full offline asset preparation, editor-theme selector, snapshot rendering, or persistence changes in this task.
