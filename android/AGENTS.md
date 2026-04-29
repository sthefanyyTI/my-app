# AGENTS.md

Guidance for Codex agents working in this project.

## Operating Rules

- Read `docs/CURRENT_STATE.md` and `docs/ARCHITECTURE.md` before making changes.
- Preserve existing application behavior unless the task explicitly asks for a behavior change.
- Do not delete project files during analysis or bootstrap work.
- Do not overwrite user-authored documentation; append or create new files instead.
- Prefer commands already used by the project and respect the detected package manager.
- Keep changes small, reviewable, and aligned with the detected stack.

## Documentation

- Use `docs/CURRENT_STATE.md` for the current implementation state, known problems, risks, and improvement opportunities.
- Use `docs/ARCHITECTURE.md` for high-level architecture, module boundaries, data flow, and integration notes.
- Use `prompts/` for reusable prompts and project-specific operating instructions.
