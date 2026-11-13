# Phase 1 Task 6 — Code window and editor settings

**Goal:** Finish the Phase 1 editor with a basic code window, independent UI and syntax themes, line numbers, and line wrapping.

**Spec:** [Phase 1 plan](phase-1-editor-foundation.md), [design system](../architecture/design/design-system.md), [UI specification](../architecture/design/ui-spec.md), and [wireframes](../architecture/design/wireframes.md).

- [x] Add `src/theme/basicThemes.ts` with `getBasicTheme(id)` and plain color data. Map syntax tokens to CodeMirror styles and reconfigure theme, line numbers and wrapping in their existing compartments. Verify that the same editor, code, selection and Undo survive the changes.
- [x] Add `CodeWindow` and `EditorSettings`. Give the code frame a centered `untitled` title, decorative window controls and a local language icon. Keep the default code frame opaque and the two palettes legible.
- [x] Apply the documented semantic tokens and compact workspace layout. Dock `Properties` from 1024 px and place it below the editor on narrower screens. Keep `uiTheme` and panel visibility outside the workspace reducer. Transfer focus between the collapse and restore controls and keep the editor mounted.
- [x] Test the four theme combinations, long line scrolling and wrapping, keyboard access, and the complete edit flow with a 300-line sample and literal HTML. Measure local production startup, edit response and bundle size. [Verification results](../verification/task-6-editor-window.md)

Phase 2 owns snapshot rendering and export. Phase 3 owns persistence and the full responsive panel behavior.
