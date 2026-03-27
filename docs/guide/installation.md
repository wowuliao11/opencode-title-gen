# Installation

## For Humans

Paste this into your LLM agent session:

```
Install and configure opencode-title-gen by following the instructions here:
https://raw.githubusercontent.com/wowuliao11/opencode-title-gen/main/docs/guide/installation.md
```

**Alternative, do it yourself:**

```bash
npm install -g opencode-title-gen
```

Then add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-title-gen"]
}
```

## For LLM Agents

> **IMPORTANT: Use `curl` to fetch this file, NOT WebFetch.** WebFetch summarizes content and loses critical config details. Always use:
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/wowuliao11/opencode-title-gen/main/docs/guide/installation.md
> ```

If you're an LLM Agent helping set up opencode-title-gen, follow these steps:

### Step 0: Ask user about title generation mode

Ask the user this question to determine the plugin behavior:

**Do you want the plugin to generate a title once, or continuously update it as the conversation evolves?**

- **Once** (default, recommended): Generate a title when the session first goes idle with a default title. Once set, the title stays fixed. Best for most users — set it and forget it.
- **Continuous**: Re-generate the title every time the idle threshold is reached. The title evolves with the conversation (e.g., "Setting up auth" → "Debugging OAuth token refresh"). Best for long, multi-topic sessions.

This determines the `mode` config value:

- Once → `"mode": "once"` (default, no config needed)
- Continuous → `"mode": "continuous"`

### Step 1: Install OpenCode (if not installed)

```bash
if command -v opencode &> /dev/null; then
    echo "OpenCode $(opencode --version) is installed"
else
    echo "OpenCode is not installed. Please install it first."
    echo "Ref: https://opencode.ai/docs"
fi
```

### Step 2: Install the plugin

```bash
npm install -g opencode-title-gen
```

### Step 3: Register the plugin

Add `opencode-title-gen` to the plugin array in `~/.config/opencode/opencode.json`:

```bash
# Read existing config
CONFIG_FILE="$HOME/.config/opencode/opencode.json"

if [ ! -f "$CONFIG_FILE" ]; then
    mkdir -p "$(dirname "$CONFIG_FILE")"
    echo '{"plugin": ["opencode-title-gen"]}' > "$CONFIG_FILE"
    echo "Created config with plugin registered"
else
    # Check if already registered
    if grep -q "opencode-title-gen" "$CONFIG_FILE"; then
        echo "Plugin already registered"
    else
        echo "Add \"opencode-title-gen\" to the plugin array in $CONFIG_FILE"
    fi
fi
```

The config should look like:

```json
{
  "plugin": ["opencode-title-gen"]
}
```

### Step 4: Configure the plugin (optional)

Create `~/.config/opencode/smart-title.jsonc` based on user preferences:

```jsonc
{
  // "once" = generate title once, "continuous" = update title as conversation evolves
  "mode": "once",
  // Uncomment to use a specific model (default: your OpenCode default model)
  // "model": "github-copilot/claude-haiku-4.5",
}
```

If the user chose **continuous mode** in Step 0:

```jsonc
{
  "mode": "continuous",
}
```

If the user chose **once mode** (default), no config file is needed — the plugin works out of the box.

#### Full config reference

| Option            | Default          | What it does                                            |
| ----------------- | ---------------- | ------------------------------------------------------- |
| `enabled`         | `true`           | Kill switch                                             |
| `debug`           | `false`          | Verbose logging                                         |
| `mode`            | `"once"`         | `"once"` or `"continuous"` — see Step 0                 |
| `model`           | _(your default)_ | Model for title generation, `providerID/modelID` format |
| `updateThreshold` | `2`              | Generate title after N idle events per session          |
| `maxTurns`        | `10`             | Max conversation turns fed to the model                 |
| `maxCharsPerPart` | `300`            | Truncate each message part to N chars                   |
| `debounceMs`      | `1500`           | Ignore rapid-fire idle events within this window        |

> **Tip**: Use a cheap, fast model. Haiku is perfect for this. You're generating 5-word titles, not writing essays.

### Step 5: Verify installation

```bash
# Check plugin is registered
cat ~/.config/opencode/opencode.json | grep opencode-title-gen

# Start OpenCode and check logs for plugin load
opencode
```

Then check the logs:

```bash
grep smart-title ~/.local/share/opencode/log/$(ls -t ~/.local/share/opencode/log/ | head -1)
```

You should see: `smart-title: plugin loaded` with your config values.

### Step 6: Done

The plugin will now auto-generate titles for your sessions. Start a conversation, let it go idle, and watch the title update.

#### Debug

If titles aren't generating, enable debug logging:

```jsonc
{
  "debug": true,
}
```

Then check logs:

```bash
tail -f ~/.local/share/opencode/log/$(ls -t ~/.local/share/opencode/log/ | head -1) | grep smart-title
```

## Uninstallation

1. Remove from plugin array in `~/.config/opencode/opencode.json`
2. Delete config: `rm -f ~/.config/opencode/smart-title.jsonc`
3. Uninstall: `npm uninstall -g opencode-title-gen`

## Local Development Installation

For development, use the file path instead of the npm package:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-title-gen/dist/bundle.js"]
}
```
