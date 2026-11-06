
# Drop Your Code — Agent Guidelines

## Product
Drop Your Code is a fast, client-only code snapshot editor.

The product requirements are defined in `docs/product/PRD.md`.

## Core Constraints
- Keep the application fully static and deployable to Vercel.
- Do not introduce a backend, database, or authentication.
- Never transmit user code or code history to external services.
- Prioritize editor responsiveness and image export fidelity.
- Preserve IntelliJ and VS Code keyboard preset behavior.
- Support PNG, SVG, JPG, and WebP exports.
- Keep the code window opaque when the outer background is transparent.

## Documentation
Read relevant documentation based on the task:
- Product features: `docs/product/PRD.md`
- Architecture changes: `docs/architecture/overview.md`
- Important technical decisions: `docs/architecture/decisions/`
- UI work: `docs/design/ui-spec.md`
- Testing: `docs/testing/strategy.md`

Do not read every document for unrelated changes.

## Engineering
- Use TypeScript with strict type checking.
- Keep editor interactions separate from snapshot rendering.
- Keep image export logic separate from React UI components.
- Prefer simple, maintainable solutions over new abstractions.
- Do not add dependencies without a clear justification.
- Avoid unrelated refactoring.

## Verification
- Run relevant checks before reporting completion.
- Verify user-facing changes in a browser when practical.
- Test export changes across all affected formats.
- Report the commands executed and any remaining limitations.
- Do not claim tests passed unless they were actually run.

## Workflow
- For substantial features, create a focused plan in `docs/plans/`.
- Keep each implementation task independently testable.
- Update relevant documentation when behavior or architecture changes.
- Do not commit, push, or deploy unless requested.
