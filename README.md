# @vemdev/mcp-server

Official [VEM](https://vem.dev) MCP Server — gives AI agents (Claude, Cursor, Copilot, etc.) durable project memory via the [Model Context Protocol](https://modelcontextprotocol.io).

Agents can read tasks, record decisions, search context, and sync snapshots to the cloud — all through structured MCP tools.

---

## Quick start

```sh
npx @vemdev/mcp-server@latest --api-key <your-api-key>
```

Get your API key from **[app.vem.dev](https://app.vem.dev) → Settings → API Keys**.

---

## MCP host configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vem": {
      "command": "npx",
      "args": ["@vemdev/mcp-server@latest", "--api-key", "nk_your_key_here"]
    }
  }
}
```

### Cursor / VS Code

Add to your MCP settings:

```json
{
  "vem": {
    "command": "npx",
    "args": ["@vemdev/mcp-server@latest", "--api-key", "nk_your_key_here"]
  }
}
```

---

## Authentication

There are three ways to provide your API key, in priority order:

### 1. `--api-key` flag (recommended for MCP hosts)

Pass the key directly when starting the server:

```sh
npx @vemdev/mcp-server@latest --api-key nk_your_key_here
```

The key is saved to `~/.vem/config.json` on first run, so subsequent starts
without the flag will reuse it automatically.

### 2. `VEM_API_KEY` environment variable

Useful in CI or when you prefer not to store the key on disk:

```sh
VEM_API_KEY=nk_your_key_here npx @vemdev/mcp-server@latest
```

Or in your MCP host config:

```json
{
  "mcpServers": {
    "vem": {
      "command": "npx",
      "args": ["@vemdev/mcp-server@latest"],
      "env": {
        "VEM_API_KEY": "nk_your_key_here"
      }
    }
  }
}
```

### 3. `vem login` CLI (if you already use the CLI)

If you have the VEM CLI installed and have already logged in, the MCP server
picks up the saved key automatically — no extra config needed:

```sh
npx @vemdev/cli@latest login nk_your_key_here
npx @vemdev/mcp-server@latest   # key is read from ~/.vem/config.json
```

---

## Getting an API key

1. Go to **[app.vem.dev](https://app.vem.dev)** and sign in
2. Navigate to **Settings → API Keys**
3. Click **Create key** and copy the `nk_...` token
4. Pass it to the server via any of the methods above

---

## Available tools

| Tool | Description |
|---|---|
| `get_active_tasks` | List all active tasks in the project |
| `add_task` | Create a new task |
| `start_task` | Transition a task to in-progress |
| `complete_task` | Mark a task as done with evidence |
| `update_task` | Update task fields (title, status, priority) |
| `delete_task` | Delete a task |
| `get_task_details` | Get full details of a specific task |
| `get_task_context` | Get ephemeral context for a task |
| `update_task_context` | Update ephemeral context for a task |
| `get_context` | Read `CONTEXT.md` (project summary) |
| `update_current_state` | Update `CURRENT_STATE.md` |
| `list_decisions` | List recorded architectural decisions |
| `add_decision` | Record a new architectural decision |
| `search_memory` | Semantic search across project memory |
| `ask_question` | Ask a question about the project context |
| `get_changelog` | Read recent changelog entries |
| `apply_vem_update` | Apply a structured `vem_update` block |
| `sync_push` | Push a memory snapshot to the cloud |
| `sync_pull` | Pull the latest snapshot from the cloud |
| `get_subtasks` | List subtasks of a task |
| `list_agent_sessions` | List recorded agent sessions |
| `save_session_stats` | Save session stats for a task |

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VEM_API_KEY` | — | API key (alternative to `--api-key` flag) |
| `VEM_API_URL` | `https://api.vem.dev` | VEM API endpoint |
| `VEM_AGENT_NAME` | `mcp-agent` | Agent name shown in the dashboard |

---

## License

MIT
