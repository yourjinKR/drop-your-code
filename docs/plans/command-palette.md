# Command Palette Implementation Plan

**Goal.** Add keyboard-first access to the editor's existing language, appearance, workspace, and image-output actions.

**Architecture.** `App` owns workspace and palette mode. A typed command registry connects the existing actions to one modal dialog. The Properties select and palette share one language request controller and feedback area.

**References.** [PRD](../product/PRD.md), [UI specification](../architecture/design/ui-spec.md), and the attached command palette brief and wireframe.

## Implementation

- [x] Add `useLanguageChange` in `src/editor` to apply only the latest successful language request. Keep the Properties select and editor status synchronized and expose loading, failure, and retry through the workspace feedback area.
- [x] Let `useSnapshotExport` accept explicit options for download commands. Keep toolbar options, copy activation, feedback, and busy behavior shared. Reuse the canvas reset action for both entry points.
- [x] Add a typed registry and ranked search in `src/commands`. Generate all language actions from `languageIds` and reuse the same chooser for languages, syntax themes, and keymaps.
- [x] Present the chooser in a native modal dialog with search focus, a scrollable listbox, keyboard hints, and a visible close control. Open All Commands with `Ctrl+Shift+.` on Windows/Linux or `Cmd+Shift+.` on macOS and provide a `Commands` button beside Keymap. Search for an alias such as `py` and press Enter to apply the language from All Commands.
- [x] Verify alias ranking, shared language request races and retry, focus and selection, IME and held keys, existing editor presets, and all four download formats. Update the product, interaction, and architecture documentation.

## Verification

- `npm run typecheck`, `npm run test`, and `npm run build`
- `npm run test:browser -- --project=chromium` with the palette, editor, canvas, and output coverage
- Run the palette spec on Firefox and WebKit. The file-download check selects Firefox's save handler for byte verification. The clipboard read check uses Chromium permissions.

The shortcut handler leaves browser defaults such as Print with the host and respects composition. The `Commands` button provides access when the host reserves the palette shortcut. The modal keeps focus within the palette while it is open. Applying `Focus Editor` or toggling Properties follows the destination's existing focus behavior.
