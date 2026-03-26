# Changelog

All notable changes to this project will be documented in this file.

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
