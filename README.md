# opencode-title-gen

[![npm version](https://img.shields.io/npm/v/opencode-title-gen?color=369eff&labelColor=black&style=flat-square)](https://www.npmjs.com/package/opencode-title-gen)
[![License](https://img.shields.io/badge/license-MIT-white?labelColor=black&style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/wowuliao11/opencode-title-gen/ci.yml?label=CI&labelColor=black&style=flat-square)](https://github.com/wowuliao11/opencode-title-gen/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?labelColor=black&style=flat-square)](https://www.typescriptlang.org/)

Your OpenCode sessions are all called `New session - 2026-03-26T15:32:42.757Z`. Every single one.

This plugin fixes that. Session goes idle → AI reads the conversation → generates a meaningful title → done. Zero interaction.

---

## Skip This README

Paste this into your LLM agent:

```
Read this and set up the plugin: https://raw.githubusercontent.com/wowuliao11/opencode-title-gen/main/README.md
```

Or keep reading. Your call.

---

## Before / After

```
Before:                                        After:
├── New session - 2026-03-26T15:32:42.757Z     ├── Fix auth middleware token refresh
├── New session - 2026-03-26T14:18:03.221Z     ├── Add pagination to /api/users
├── New session - 2026-03-25T22:47:11.089Z     ├── Refactor DB connection pooling
├── New session - 2026-03-25T19:05:58.443Z     ├── Debug CI flaky test in auth.spec
└── New session - 2026-03-25T16:33:27.615Z     └── Set up ESLint v9 flat config
```

---

## How It Works

| Step | What happens                                                                                  |
| ---- | --------------------------------------------------------------------------------------------- |
| 1    | Listens for `session.idle` and `session.status` (type=idle) events                            |
| 2    | Counts idle events per session; triggers at threshold (default: 2)                            |
| 3    | Skips sub-sessions and sessions with custom titles                                            |
| 4    | Extracts conversation (first + last assistant message — saves ~60% tokens)                    |
| 5    | Creates a temporary sub-session, prompts the model for a concise title (3–7 words, ≤60 chars) |
| 6    | Updates the session title, cleans up the sub-session                                          |

Debounced. Locked per-session. No duplicate generation. No race conditions.

---

## Installation

### For LLM Agents

```bash
# Fetch and follow
curl -s https://raw.githubusercontent.com/wowuliao11/opencode-title-gen/main/README.md
```

### For Humans

**npm** (recommended):

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-title-gen"]
}
```

Then install:

```bash
npm install -g opencode-title-gen
```

**Local file** (development):

```json
{
  "plugin": ["file:///absolute/path/to/opencode-title-gen/dist/bundle.js"]
}
```

---

## Configuration

Create `~/.config/opencode/smart-title.jsonc`:

```jsonc
{
  // All fields optional. These are defaults.
  "enabled": true,
  "debug": false,
  // "model": "github-copilot/claude-haiku-4.5",
  "updateThreshold": 2,
  "maxTurns": 10,
  "maxCharsPerPart": 300,
  "debounceMs": 1500,
}
```

| Option            | Default          | What it does                                            |
| ----------------- | ---------------- | ------------------------------------------------------- |
| `enabled`         | `true`           | Kill switch                                             |
| `debug`           | `false`          | Verbose logging                                         |
| `model`           | _(your default)_ | Model for title generation, `providerID/modelID` format |
| `updateThreshold` | `2`              | Generate title after N idle events per session          |
| `maxTurns`        | `10`             | Max conversation turns fed to the model                 |
| `maxCharsPerPart` | `300`            | Truncate each message part to N chars                   |
| `debounceMs`      | `1500`           | Ignore rapid-fire idle events within this window        |

> **Tip**: Use a cheap, fast model. Haiku is perfect for this. You're generating 5-word titles, not writing essays.

---

## Debug

View plugin logs:

```bash
# Latest log file
tail -f ~/.local/share/opencode/log/$(ls -t ~/.local/share/opencode/log/ | head -1)

# Filter for this plugin
grep smart-title ~/.local/share/opencode/log/$(ls -t ~/.local/share/opencode/log/ | head -1)
```

Set `"debug": true` in config for verbose output.

---

## Architecture

```
src/
  index.ts           → Plugin entry point (registers hooks)
  types.ts           → SmartTitleConfig, ResolvedConfig, OpencodeClient
  config.ts          → JSONC config loader with defaults
  logger.ts          → Structured logger via client.app.log
  event-handler.ts   → Idle event handler: threshold, debounce, per-session lock
  title-generator.ts → Sub-session title generation with XML prompt
  utils.ts           → extractConversation, isDefaultTitle, cleanTitle
tests/
  utils.test.ts      → 24 unit tests (vitest)
```

10.9kb bundled. Zero runtime dependencies. ESM only.

---

## Development

```bash
pnpm install          # install deps
pnpm build            # TypeScript + esbuild bundle
pnpm test             # 24 tests, vitest
pnpm lint             # ESLint v9 flat config
pnpm format:check     # Prettier
pnpm typecheck        # strict mode (noUncheckedIndexedAccess, etc.)
```

**Tooling**: ESLint 9 + Prettier + Husky + lint-staged + commitlint (conventional commits). All pre-configured.

---

## Contributing

1. Fork → branch (`git checkout -b feat/my-feature`)
2. Make changes
3. `pnpm lint && pnpm test && pnpm build`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`)
5. Open a PR

---

## License

MIT

---

> This plugin is not affiliated with the OpenCode team. Built independently because I got tired of `New session - <timestamp>` titles.
