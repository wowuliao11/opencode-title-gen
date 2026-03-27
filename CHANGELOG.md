# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-03-27

### Added

- **Title generation mode** (`"once"` | `"continuous"`)
  - `once` (default): generate title only when session has a default title; once set, never update
  - `continuous`: re-generate title every time the idle threshold is reached
- Agent-friendly installation guide (`docs/guide/installation.md`)

### Changed

- README fully rewritten in oh-my-openagent style (AI-friendly, Before/After, feature table)
- Installation docs separated into `docs/guide/installation.md`

## [0.1.1] - 2026-03-26

### Fixed

- README: corrected default session title from "Untitled" to "New session - {timestamp}" format
- README: fixed event type description (listens to both `session.idle` and `session.status`)
- README: corrected max title length from 50 to 60 characters
- README: removed hardcoded model reference, clarified it uses OpenCode's default model
- README: updated config example and footer links

## [0.1.0] - 2026-03-26

### Added

- Initial release
- Auto-generate session titles on `session.idle` event
- Sub-session based title generation (uses OpenCode's built-in model routing)
- Debounce and in-flight locking to prevent race conditions
- JSONC config file support (`~/.config/opencode/smart-title.jsonc`)
- Configurable model override, max turns, max chars per message
- Structured logging via `client.app.log()`
- Skip child sessions and sessions with custom titles
