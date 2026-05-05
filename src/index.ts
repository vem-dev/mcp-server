#!/usr/bin/env node
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, readlink, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
	applyVemUpdate,
	CHANGELOG_DIR,
	ConfigService,
	CURRENT_STATE_FILE,
	CycleService,
	computeSessionStats,
	DECISIONS_DIR,
	getRepoRoot,
	getVemDir,
	listAllAgentSessions,
	ScalableLogService,
	SyncService,
	TaskService,
	UsageMetricsService,
} from "@vem/core";

const server = new Server(
	{
		name: "vem-mcp",
		version: "0.1.0",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

const taskService = new TaskService();
const cycleService = new CycleService();
const configService = new ConfigService();
const syncService = new SyncService();
const metricsService = new UsageMetricsService();

const API_URL = process.env.VEM_API_URL || "http://localhost:3002";

async function trackHeartbeat(toolName: string, taskId?: string) {
	try {
		const apiKey = await configService.getApiKey();
		if (!apiKey) return;

		const projectId = await configService.getProjectId();
		const agentName = process.env.VEM_AGENT_NAME || "mcp-agent";

		await metricsService.syncToCloud({
			apiUrl: API_URL,
			apiKey,
			projectId,
			headers: await buildDeviceHeaders(configService),
			force: true,
			event: {
				featureFlag: "agent_heartbeat",
				metadata: {
					agentName,
					taskId,
					command: `mcp:${toolName}`,
				},
			},
		});
	} catch {
		// Silently fail
	}
}

// --- Git helper functions (matching CLI patterns) ---

function getGitHash(): string | null {
	try {
		return execSync("git rev-parse HEAD").toString().trim() || null;
	} catch {
		return null;
	}
}

function getGitRemote(): string | null {
	try {
		return execSync("git remote get-url origin").toString().trim() || null;
	} catch {
		return null;
	}
}

function getCommits(limit = 50) {
	try {
		const output = execSync(
			`git log -n ${limit} --pretty=format:"%H|%an|%cI|%s"`,
		).toString();
		return output
			.split("\n")
			.map((line) => {
				const [hash, author, date, ...msgParts] = line.split("|");
				return {
					hash,
					author_name: author,
					committed_at: date,
					message: msgParts.join("|"),
				};
			})
			.filter((c) => c.hash && c.message);
	} catch {
		return [];
	}
}

async function isVemDirty(): Promise<boolean> {
	try {
		const root = await getRepoRoot();
		const status = execSync("git status --porcelain .vem", { cwd: root })
			.toString()
			.trim();
		return status.length > 0;
	} catch {
		return false;
	}
}

async function computeVemHash(): Promise<string | null> {
	try {
		const vemDir = await getVemDir();
		const hash = createHash("sha256");

		const walk = async (currentDir: string) => {
			const entries = await readdir(currentDir, { withFileTypes: true });
			entries.sort((a, b) => a.name.localeCompare(b.name));
			for (const entry of entries) {
				if (entry.name === "queue") continue;
				const fullPath = join(currentDir, entry.name);
				const relPath = relative(vemDir, fullPath).split("\\").join("/");
				if (
					relPath === "queue" ||
					relPath.startsWith("queue/") ||
					relPath === "config.json" ||
					relPath === "current_context.md" ||
					relPath === "task_context.md"
				) {
					continue;
				}
				if (entry.isDirectory()) {
					hash.update(`dir:${relPath}\0`);
					await walk(fullPath);
				} else if (entry.isFile()) {
					hash.update(`file:${relPath}\0`);
					const data = await readFile(fullPath);
					hash.update(data);
				} else if (entry.isSymbolicLink()) {
					const target = await readlink(fullPath);
					hash.update(`link:${relPath}\0${target}\0`);
				}
			}
		};

		await walk(vemDir);
		return hash.digest("hex");
	} catch {
		return null;
	}
}

function normalizeForSnapshotHash(value: unknown): unknown {
	if (typeof value === "string") return value.normalize("NFC");
	if (Array.isArray(value))
		return value.map((entry) => normalizeForSnapshotHash(entry));
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		const normalized: Record<string, unknown> = {};
		for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
			const next = normalizeForSnapshotHash(record[key]);
			if (next !== undefined) normalized[key] = next;
		}
		return normalized;
	}
	if (typeof value === "number" && !Number.isFinite(value)) return null;
	return value;
}

function computeSnapshotHashFromPayload(snapshot: any): string {
	const sortedTasks = Array.isArray(snapshot?.tasks?.tasks)
		? [...snapshot.tasks.tasks].sort((a: any, b: any) =>
				String(a?.id || "").localeCompare(String(b?.id || "")),
			)
		: [];
	const canonical = normalizeForSnapshotHash({
		tasks: { tasks: sortedTasks },
		context: snapshot?.context || "",
		decisions: snapshot?.decisions || "",
		changelog: snapshot?.changelog || "",
		current_state: snapshot?.current_state || "",
	});
	return createHash("sha256")
		.update(JSON.stringify(canonical), "utf8")
		.digest("hex");
}

async function buildDeviceHeaders(cs: ConfigService) {
	const { deviceId, deviceName } = await cs.getOrCreateDeviceId();
	const projectOrgId = await cs.getProjectOrgId();
	return {
		"X-Vem-Device-Id": deviceId,
		"X-Vem-Device-Name": deviceName,
		"X-Vem-Client": "mcp-server",
		...(projectOrgId ? { "X-Org-Id": projectOrgId } : {}),
	};
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "get_active_tasks",
				description:
					"Get list of VEM tasks from project memory. Use this to know what to do. Defaults to active tasks only.",
				inputSchema: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["todo", "in-progress", "done", "all"],
							description:
								"Filter tasks by status. Default is to exclude done tasks.",
						},
					},
				},
			},
			{
				name: "get_task_details",
				description:
					"Get detailed information about a specific task by its ID.",
				inputSchema: {
					type: "object",
					properties: {
						id: { type: "string", description: "The TASK-XXX id" },
					},
					required: ["id"],
				},
			},
			{
				name: "add_task",
				description: "Add a new task to VEM memory.",
				inputSchema: {
					type: "object",
					properties: {
						title: { type: "string" },
						description: { type: "string" },
						priority: {
							type: "string",
							enum: ["low", "medium", "high", "critical"],
						},
						type: {
							type: "string",
							enum: ["feature", "bug", "chore", "spike", "enabler"],
						},
						parent_id: {
							type: "string",
							description: "Optional parent task ID",
						},
						validation_steps: {
							type: "array",
							items: { type: "string" },
							description: "List of commands or steps to validate completion",
						},
						reasoning: {
							type: "string",
							description: "Reasoning for creating this task.",
						},
					},
					required: ["title"],
				},
			},
			{
				name: "complete_task",
				description: "Mark a task as done in VEM memory.",
				inputSchema: {
					type: "object",
					properties: {
						id: { type: "string", description: "The TASK-XXX id" },
						evidence: {
							type: "string",
							description: "Proof of completion (file path, test command, etc)",
						},
						reasoning: {
							type: "string",
							description:
								"Why is this task considered done? Explain your reasoning.",
						},
					},
					required: ["id", "evidence", "reasoning"],
				},
			},
			{
				name: "start_task",
				description:
					"Mark a task as in-progress and attach the current agent session to it. Call this when you start working on a task. Returns the full task object so you can get its context.",
				inputSchema: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "The TASK-XXX id to start",
						},
						session_id: {
							type: "string",
							description: "The current agent session ID",
						},
						source: {
							type: "string",
							enum: ["copilot", "claude", "gemini"],
							description:
								"Which AI tool is running (copilot | claude | gemini)",
						},
						session_summary: {
							type: "string",
							description:
								"Optional brief summary of what this session intends to do",
						},
					},
					required: ["id"],
				},
			},
			{
				name: "get_context",
				description:
					"Read the project's CONTEXT.md and CURRENT_STATE.md. Always call this at the start of a session to load project context.",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "list_decisions",
				description:
					"List architectural decisions recorded in VEM memory. Read these before making significant design choices to avoid conflicts.",
				inputSchema: {
					type: "object",
					properties: {
						limit: {
							type: "number",
							description:
								"Number of recent decisions to return (default: 20, max: 50)",
							default: 20,
						},
					},
				},
			},
			{
				name: "update_current_state",
				description:
					"Update CURRENT_STATE.md with a summary of latest progress and next steps. Call this after completing meaningful work.",
				inputSchema: {
					type: "object",
					properties: {
						content: {
							type: "string",
							description:
								"The new content for CURRENT_STATE.md (replaces existing content)",
						},
					},
					required: ["content"],
				},
			},
			{
				name: "search_memory",
				description:
					"Semantic search over project memory (tasks, context, decisions).",
				inputSchema: {
					type: "object",
					properties: {
						query: {
							type: "string",
							description:
								"The search query (e.g. 'auth tasks', 'database schema')",
						},
					},
					required: ["query"],
				},
			},
			{
				name: "ask_question",
				description:
					"Ask a natural language question about the project codebase and memory (commits, diffs, tasks).",
				inputSchema: {
					type: "object",
					properties: {
						question: {
							type: "string",
							description:
								"The question to ask (e.g. 'How does authentication work?')",
						},
						path: {
							type: "string",
							description:
								"Optional file path to limit the scope of the search",
						},
					},
					required: ["question"],
				},
			},
			{
				name: "update_task",
				description:
					"Update a task's status, priority, or other fields. Use this to start working on a task, block it, or update its priority.",
				inputSchema: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "The TASK-XXX id",
						},
						status: {
							type: "string",
							enum: ["todo", "in-progress", "blocked"],
							description:
								"New status for the task. Use 'in-progress' to start working, 'blocked' to mark as blocked, 'todo' to unblock.",
						},
						priority: {
							type: "string",
							enum: ["low", "medium", "high", "critical"],
							description: "New priority for the task.",
						},
						reasoning: {
							type: "string",
							description:
								"Explanation for the update. Required when blocking a task.",
						},
						blocked_reason: {
							type: "string",
							description:
								"The reason why the task is blocked. Required when setting status to 'blocked'.",
						},
						blocked_by: {
							type: "array",
							items: { type: "string" },
							description:
								"Task IDs that are blocking this task (when setting status to blocked).",
						},
						validation_steps: {
							type: "array",
							items: { type: "string" },
							description: "New list of validation steps (replaces existing)",
						},
					},
					required: ["id"],
				},
			},
			{
				name: "add_decision",
				description:
					"Record an architectural decision in VEM memory. Use this when making significant technical choices (e.g., choosing libraries, changing architecture, setting patterns).",
				inputSchema: {
					type: "object",
					properties: {
						title: {
							type: "string",
							description:
								"Short decision title (e.g., 'Use Zod for validation')",
						},
						context: {
							type: "string",
							description:
								"Why this decision was needed - the problem or situation",
						},
						decision: {
							type: "string",
							description: "What was decided and key rationale",
						},
						related_tasks: {
							type: "array",
							items: { type: "string" },
							description:
								"Optional TASK-XXX references that motivated or implement this decision",
						},
					},
					required: ["title", "context", "decision"],
				},
			},
			{
				name: "get_changelog",
				description:
					"Get recent changelog entries from VEM memory. Use this to understand what work has been done recently.",
				inputSchema: {
					type: "object",
					properties: {
						limit: {
							type: "number",
							description:
								"Number of recent entries to return (default: 10, max: 50)",
							default: 10,
						},
					},
				},
			},
			{
				name: "delete_task",
				description: "Soft delete a task from VEM memory.",
				inputSchema: {
					type: "object",
					properties: {
						id: { type: "string", description: "The TASK-XXX id" },
						reasoning: { type: "string", description: "Reason for deletion" },
					},
					required: ["id"],
				},
			},
			{
				name: "apply_vem_update",
				description:
					"Apply a complete vem_update block containing current_state, context, changelog_append, decisions_append, and task updates.",
				inputSchema: {
					type: "object",
					properties: {
						current_state: { type: "string" },
						context: { type: "string" },
						changelog_append: {
							oneOf: [
								{ type: "string" },
								{ type: "array", items: { type: "string" } },
							],
						},
						decisions_append: {
							oneOf: [
								{ type: "string" },
								{ type: "array", items: { type: "string" } },
							],
						},
						tasks: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string" },
									status: { type: "string" },
									reasoning: { type: "string" },
									priority: { type: "string" },
								},
								required: ["id"],
							},
						},
					},
				},
			},
			{
				name: "sync_push",
				description:
					"Push local VEM snapshot to the cloud. Syncs tasks, context, decisions, and changelog to the remote project.",
				inputSchema: {
					type: "object",
					properties: {
						force: {
							type: "boolean",
							description: "Push even if no changes detected since last push.",
						},
						dry_run: {
							type: "boolean",
							description:
								"Preview what would be pushed without actually pushing.",
						},
					},
				},
			},
			{
				name: "sync_pull",
				description:
					"Pull the latest VEM snapshot from the cloud. Updates local tasks, context, decisions, and changelog.",
				inputSchema: {
					type: "object",
					properties: {
						force: {
							type: "boolean",
							description: "Overwrite local changes without warning.",
						},
					},
				},
			},
			{
				name: "get_task_context",
				description:
					"Read a task's working context and summary. Use this to retrieve scratchpad notes for a specific task.",
				inputSchema: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "The TASK-XXX id",
						},
					},
					required: ["id"],
				},
			},
			{
				name: "update_task_context",
				description:
					"Set, append to, or clear a task's working context. Use this to maintain scratchpad notes across sessions.",
				inputSchema: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "The TASK-XXX id",
						},
						operation: {
							type: "string",
							enum: ["set", "append", "clear"],
							description:
								"'set' replaces context, 'append' adds to it, 'clear' removes it.",
						},
						text: {
							type: "string",
							description:
								"The text content. Required for 'set' and 'append' operations.",
						},
					},
					required: ["id", "operation"],
				},
			},
			{
				name: "get_subtasks",
				description:
					"Get a parent task and all its subtasks. Use this to view the task hierarchy.",
				inputSchema: {
					type: "object",
					properties: {
						parent_id: {
							type: "string",
							description: "The parent TASK-XXX id",
						},
					},
					required: ["parent_id"],
				},
			},
			{
				name: "list_agent_sessions",
				description:
					"List recent agent sessions for this repository from Copilot CLI, Claude CLI, and Gemini CLI. Call this at the start of a session to understand what previous sessions worked on and avoid duplicating effort.",
				inputSchema: {
					type: "object",
					properties: {
						limit: {
							type: "number",
							description: "Maximum number of sessions to return (default: 10)",
						},
						branch: {
							type: "string",
							description: "Filter sessions by branch name",
						},
						sources: {
							type: "array",
							items: { type: "string", enum: ["copilot", "claude", "gemini"] },
							description: "Which tools to include (default: all three)",
						},
					},
				},
			},
			{
				name: "save_session_stats",
				description:
					"Save statistics for an agent session onto its task. Call this when finishing a task to record session duration, turns, tool calls, and model usage. Stats are computed from the agent's session files.",
				inputSchema: {
					type: "object",
					properties: {
						task_id: {
							type: "string",
							description: "The TASK-XXX id to attach stats to",
						},
						session_id: {
							type: "string",
							description: "The agent session ID to compute stats for",
						},
						source: {
							type: "string",
							enum: ["copilot", "claude", "gemini"],
							description:
								"Which AI tool the session belongs to (default: copilot)",
						},
					},
					required: ["task_id", "session_id"],
				},
			},
			{
				name: "get_cycle_context",
				description:
					"Get the active cycle's goal and assigned tasks. Gives agents immediate context on what the current focus period is working towards.",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_flow_metrics",
				description:
					"Get flow metrics: WIP count, throughput, and average cycle/lead times for the project. Optionally get per-task metrics.",
				inputSchema: {
					type: "object",
					properties: {
						task_id: {
							type: "string",
							description:
								"Optional task ID for per-task metrics. If omitted, returns project-level summary.",
						},
					},
				},
			},
			{
				name: "deposit_plan",
				description:
					"Deposit a plan document (findings, recommendations, next steps) into the project. Call this at the end of a research, investigation, or planning run instead of creating a PR. The plan will be stored with status 'pending' for human review.",
				inputSchema: {
					type: "object",
					properties: {
						title: {
							type: "string",
							description: "Short descriptive title for the plan.",
						},
						body: {
							type: "string",
							description:
								"Markdown content: findings, recommendations, next steps. Supports full Markdown.",
						},
						task_run_id: {
							type: "string",
							description:
								"Optional: the ID of the task run that generated this plan.",
						},
					},
					required: ["title", "body"],
				},
			},
			{
				name: "list_plans",
				description:
					"List plans for the current project. Returns plan summaries with id, title, status, source, and date.",
				inputSchema: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["pending", "approved", "rejected", "done"],
							description: "Optional filter by status.",
						},
					},
				},
			},
			{
				name: "get_plan",
				description: "Get the full content of a specific plan by its ID.",
				inputSchema: {
					type: "object",
					properties: {
						plan_id: {
							type: "string",
							description: "The plan UUID.",
						},
					},
					required: ["plan_id"],
				},
			},
		],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	// Track heartbeat for every tool call
	const taskId =
		(args?.id as string) ||
		(args?.taskId as string) ||
		process.env.VEM_ACTIVE_TASK;
	void trackHeartbeat(name, taskId);

	if (name === "get_active_tasks") {
		const tasks = await taskService.getTasks();
		const status = args?.status as string | undefined;

		let filtered = tasks;
		if (status === "all") {
			// return all
		} else if (status === "done") {
			filtered = tasks.filter((t) => t.status === "done");
		} else if (status === "todo") {
			filtered = tasks.filter((t) => t.status === "todo");
		} else if (status === "in-progress") {
			filtered = tasks.filter((t) => t.status === "in-progress");
		} else {
			// default: active only (not done)
			filtered = tasks.filter((t) => t.status !== "done");
		}

		// Annotate tasks that have session history with a handoff hint
		const annotated = filtered.map((t) => {
			const sessions = (t.sessions as any[]) || [];
			if (sessions.length === 0) return t;
			const last = sessions[sessions.length - 1];
			const hint = last.summary
				? `Last worked by ${last.source} on ${last.started_at.slice(0, 10)}: ${last.summary}`
				: `Last worked by ${last.source} on ${last.started_at.slice(0, 10)}`;
			return { ...t, _last_session_hint: hint };
		});

		const activeCycle = await cycleService.getActiveCycle();
		const parts: string[] = [];
		if (activeCycle) {
			parts.push(
				`Current cycle goal: "${activeCycle.goal}" (${activeCycle.name})`,
			);
		}
		parts.push(JSON.stringify(annotated, null, 2));

		return {
			content: [
				{
					type: "text",
					text: parts.join("\n\n"),
				},
			],
		};
	}

	if (name === "get_task_details") {
		const id = args?.id as string;
		if (!id) {
			return {
				isError: true,
				content: [{ type: "text", text: "Task ID is required." }],
			};
		}
		const task = await taskService.getTask(id);
		if (!task) {
			return {
				isError: true,
				content: [{ type: "text", text: `Task ${id} not found.` }],
			};
		}
		return {
			content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
		};
	}

	if (name === "add_task") {
		const title = args?.title as string;
		const description = (args?.description as string) || undefined;
		const priority = (args?.priority as any) || "medium";
		const reasoning = (args?.reasoning as string) || undefined;
		const type = (args?.type as any) || undefined;
		const parentId = (args?.parent_id as string) || undefined;
		const validationSteps = (args?.validation_steps as string[]) || undefined;

		const task = await taskService.addTask(
			title,
			description,
			priority,
			reasoning,
			{
				type,
				parent_id: parentId,
				validation_steps: validationSteps,
			},
		);
		return {
			content: [
				{ type: "text", text: `Task Added: ${task.id} (${task.title})` },
			],
		};
	}

	if (name === "complete_task") {
		const id = args?.id as string;
		const evidence = String(args?.evidence || "").trim();

		const reasoning = String(args?.reasoning || "").trim();
		if (!evidence) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Evidence is required to complete a task.",
					},
				],
			};
		}
		if (!reasoning) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Reasoning is required to complete a task.",
					},
				],
			};
		}

		await taskService.updateTask(id, {
			status: "done",
			evidence: [evidence],
			reasoning,
		});
		const vemDir = await getVemDir();
		await writeFile(join(vemDir, "exit_signal"), "", "utf-8");
		return {
			content: [
				{
					type: "text",
					text: `Task ${id} marked as DONE. CLI will auto-close when the agent session ends.`,
				},
			],
		};
	}

	if (name === "start_task") {
		const id = args?.id as string;
		const sessionId = args?.session_id as string | undefined;
		const source =
			(args?.source as "copilot" | "claude" | "gemini") || "copilot";
		const sessionSummary = args?.session_summary as string | undefined;

		if (!id) {
			return {
				isError: true,
				content: [{ type: "text", text: "Task ID is required." }],
			};
		}

		const task = await taskService.getTask(id);
		if (!task) {
			return {
				isError: true,
				content: [{ type: "text", text: `Task ${id} not found.` }],
			};
		}

		// Build the new session ref
		const sessionRef = sessionId
			? {
					id: sessionId,
					source,
					started_at: new Date().toISOString(),
					...(sessionSummary ? { summary: sessionSummary } : {}),
				}
			: null;

		// Append session ref and mark in-progress
		const existingSessions = (task.sessions as any[]) || [];
		const patch: Record<string, any> = {
			status: "in-progress",
			reasoning: sessionSummary
				? `Started by ${source} session: ${sessionSummary}`
				: `Started by ${source} agent`,
			sessions: sessionRef
				? [...existingSessions, sessionRef]
				: existingSessions,
		};

		// Auto-populate description from session summary if task has none
		if (!task.description && sessionSummary) {
			patch.description = sessionSummary;
		}

		await taskService.updateTask(id, patch);
		const updated = await taskService.getTask(id);

		return {
			content: [
				{
					type: "text",
					text: `Task ${id} is now IN PROGRESS.\n\n${JSON.stringify(updated, null, 2)}`,
				},
			],
		};
	}

	if (name === "search_memory") {
		const query = args?.query as string;
		const apiKey = await configService.getApiKey();

		if (!apiKey) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Error: No API Key configured. Please run `vem login` in the CLI.",
					},
				],
			};
		}

		try {
			const { deviceId, deviceName } =
				await configService.getOrCreateDeviceId();
			const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
			const res = await fetch(
				`${apiUrl}/search?q=${encodeURIComponent(query)}`,
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"X-Vem-Device-Id": deviceId,
						"X-Vem-Device-Name": deviceName,
					},
				},
			);

			if (!res.ok) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Search API Error: ${res.status} ${res.statusText}`,
						},
					],
				};
			}

			const data = (await res.json()) as any;
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data.results || [], null, 2),
					},
				],
			};
		} catch (error: any) {
			return {
				isError: true,
				content: [
					{ type: "text", text: `Search Request Failed: ${error.message}` },
				],
			};
		}
	}

	if (name === "ask_question") {
		const question = args?.question as string;
		const path = args?.path as string | undefined;
		const apiKey = await configService.getApiKey();
		const projectId = await configService.getProjectId();

		if (!apiKey) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Error: No API Key configured. Please run `vem login` in the CLI.",
					},
				],
			};
		}

		if (!projectId) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Error: No project linked. Please run `vem link` in the CLI.",
					},
				],
			};
		}

		try {
			const { deviceId, deviceName } =
				await configService.getOrCreateDeviceId();
			const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";

			const payload: any = { question };
			if (path) payload.path = path;
			if (process.env.VEM_TASK_RUN_ID)
				payload.taskRunId = process.env.VEM_TASK_RUN_ID;

			const res = await fetch(`${apiUrl}/projects/${projectId}/ask`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					"X-Vem-Device-Id": deviceId,
					"X-Vem-Device-Name": deviceName,
					"X-Vem-Client": "mcp-server",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Ask API Error: ${res.status} ${res.statusText}`,
						},
					],
				};
			}

			const data = (await res.json()) as any;
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error: any) {
			return {
				isError: true,
				content: [
					{ type: "text", text: `Ask Request Failed: ${error.message}` },
				],
			};
		}
	}

	if (name === "get_context") {
		const vemDir = await getVemDir();
		const context = await configService.getContext();
		let currentState = "";
		try {
			currentState = await readFile(join(vemDir, CURRENT_STATE_FILE), "utf-8");
		} catch {
			// CURRENT_STATE.md may not exist yet
		}
		const parts: string[] = [];
		if (context) parts.push(`## CONTEXT.md\n\n${context}`);
		if (currentState) parts.push(`## CURRENT_STATE.md\n\n${currentState}`);
		return {
			content: [
				{ type: "text", text: parts.join("\n\n---\n\n") || "(no context yet)" },
			],
		};
	}

	if (name === "list_decisions") {
		const requestedLimit = (args?.limit as number) || 20;
		const limit = Math.min(Math.max(1, requestedLimit), 50);

		const decisionsService = new ScalableLogService(DECISIONS_DIR);
		const entries = await decisionsService.getAllEntries();
		const limitedEntries = entries.slice(0, limit);

		const formatted = limitedEntries.map((entry) => ({
			id: entry.id,
			title: entry.title,
			date: entry.created_at,
			content: entry.content,
		}));

		return {
			content: [
				{
					type: "text",
					text:
						formatted.length > 0
							? JSON.stringify(formatted, null, 2)
							: "No decisions recorded yet.",
				},
			],
		};
	}

	if (name === "update_current_state") {
		const content = args?.content as string;
		if (!content) {
			return {
				isError: true,
				content: [{ type: "text", text: "Content is required." }],
			};
		}
		const vemDir = await getVemDir();
		await writeFile(join(vemDir, CURRENT_STATE_FILE), content, "utf-8");
		return {
			content: [{ type: "text", text: "CURRENT_STATE.md updated." }],
		};
	}

	if (name === "update_task") {
		const id = args?.id as string;
		const status = args?.status as string | undefined;
		const priority = args?.priority as string | undefined;
		const reasoning = args?.reasoning as string | undefined;
		const blockedReason = args?.blocked_reason as string | undefined;
		const blockedBy = args?.blocked_by as string[] | undefined;
		const validationSteps = args?.validation_steps as string[] | undefined;

		if (!id) {
			return {
				isError: true,
				content: [{ type: "text", text: "Task ID is required." }],
			};
		}

		const task = await taskService.getTask(id);
		if (!task) {
			return {
				isError: true,
				content: [{ type: "text", text: `Task ${id} not found.` }],
			};
		}

		// Validate status transitions
		if (status === "blocked" && !blockedReason && !reasoning) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "blocked_reason is required when blocking a task.",
					},
				],
			};
		}

		if (task.status === "done" && status) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Cannot change status of a completed task. Use complete_task to mark as done.",
					},
				],
			};
		}

		const patch: Record<string, any> = {};
		if (status) patch.status = status;
		if (priority) patch.priority = priority;
		if (reasoning) patch.reasoning = reasoning;
		if (blockedReason) patch.blocked_reason = blockedReason;
		else if (status === "blocked" && reasoning) patch.blocked_reason = reasoning;
		if (blockedBy) patch.blocked_by = blockedBy;
		if (validationSteps) patch.validation_steps = validationSteps;

		// Default reasoning for status changes
		if (status && !reasoning) {
			if (status === "in-progress") {
				patch.reasoning = "Started working on task";
			} else if (status === "todo") {
				patch.reasoning = "Unblocked task";
			}
		}

		await taskService.updateTask(id, patch);

		const statusMsg = status ? ` Status: ${status.toUpperCase()}.` : "";
		const priorityMsg = priority ? ` Priority: ${priority}.` : "";

		return {
			content: [
				{
					type: "text",
					text: `Task ${id} updated.${statusMsg}${priorityMsg}`,
				},
			],
		};
	}

	if (name === "add_decision") {
		const title = args?.title as string;
		const context = args?.context as string;
		const decision = args?.decision as string;
		const relatedTasks = args?.related_tasks as string[] | undefined;

		if (!title || !context || !decision) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Title, context, and decision are required.",
					},
				],
			};
		}

		await configService.recordDecision(title, context, decision, relatedTasks);

		const taskInfo =
			relatedTasks && relatedTasks.length > 0
				? ` (related to: ${relatedTasks.join(", ")})`
				: "";

		return {
			content: [
				{
					type: "text",
					text: `Decision recorded: ${title}${taskInfo}`,
				},
			],
		};
	}

	if (name === "get_changelog") {
		const requestedLimit = (args?.limit as number) || 10;
		const limit = Math.min(Math.max(1, requestedLimit), 50); // Clamp between 1 and 50

		const changelogService = new ScalableLogService(CHANGELOG_DIR);
		const entries = await changelogService.getAllEntries();
		const limitedEntries = entries.slice(0, limit);

		const formatted = limitedEntries.map((entry) => ({
			id: entry.id,
			title: entry.title,
			date: entry.created_at,
			content: entry.content,
		}));

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(formatted, null, 2),
				},
			],
		};
	}

	if (name === "delete_task") {
		const id = args?.id as string;
		const reasoning = args?.reasoning as string | undefined;

		if (!id) {
			return {
				isError: true,
				content: [{ type: "text", text: "Task ID is required." }],
			};
		}

		await taskService.updateTask(id, {
			deleted_at: new Date().toISOString(),
			reasoning,
		});

		return {
			content: [{ type: "text", text: `Task ${id} soft deleted.` }],
		};
	}

	if (name === "apply_vem_update") {
		try {
			const update = args as any;
			const result = await applyVemUpdate(update);
			return {
				content: [
					{
						type: "text",
						text: `Successfully applied vem_update:\n- Tasks updated: ${result.updatedTasks.length}\n- New tasks: ${result.newTasks.length}\n- Changelog lines: ${result.changelogLines.length}\n- Decisions: ${result.decisionsAppended ? "Appended" : "No change"}\n- Context: ${result.contextUpdated ? "Updated" : "No change"}\n- State: ${result.currentStateUpdated ? "Updated" : "No change"}`,
					},
				],
			};
		} catch (error: any) {
			return {
				isError: true,
				content: [
					{ type: "text", text: `Failed to apply update: ${error.message}` },
				],
			};
		}
	}

	if (name === "sync_push") {
		const force = args?.force as boolean | undefined;
		const dryRun = args?.dry_run as boolean | undefined;

		try {
			const projectId = await configService.getProjectId();
			if (!projectId) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Error: Project not linked. Run `vem link` in the CLI first.",
						},
					],
				};
			}

			const apiKey = await configService.getApiKey();
			if (!apiKey) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Error: No API Key configured. Run `vem login` in the CLI.",
						},
					],
				};
			}

			const baseVersion = await configService.getLastVersion();
			const gitHash = getGitHash();
			if (!gitHash) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Error: git HEAD not found. Create at least one commit before syncing snapshots.",
						},
					],
				};
			}
			const vemHash = await computeVemHash();
			const lastPush = await configService.getLastPushState();
			const hasChanges = !(
				vemHash &&
				lastPush.gitHash === gitHash &&
				lastPush.vemHash === vemHash
			);

			if (!hasChanges && !force) {
				return {
					content: [
						{
							type: "text",
							text: "No changes since last push (git HEAD and .vem unchanged). Use force=true to push anyway.",
						},
					],
				};
			}

			const snapshot = await syncService.pack();
			const snapshotHash = computeSnapshotHashFromPayload(snapshot);

			if (dryRun) {
				const taskCount = snapshot.tasks?.tasks?.length || 0;
				return {
					content: [
						{
							type: "text",
							text: `Dry run preview:\n- Project: ${projectId}\n- Git hash: ${gitHash}\n- Snapshot hash: ${snapshotHash}\n- Base version: ${baseVersion || "none"}\n- Tasks: ${taskCount}\n- Context: ${snapshot.context ? "yes" : "no"}\n- Current state: ${snapshot.current_state ? "yes" : "no"}\n\nVerification remains pending until Git webhook linkage is confirmed.\n\nNo changes pushed. Remove dry_run to push for real.`,
						},
					],
				};
			}

			const repoUrl = getGitRemote();
			const commits = getCommits(50);
			const payload = {
				...snapshot,
				...(repoUrl ? { repo_url: repoUrl } : {}),
				base_version: baseVersion,
				commits,
				project_id: projectId,
				git_hash: gitHash,
				snapshot_hash: snapshotHash,
			};

			const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
			const res = await fetch(`${apiUrl}/snapshots`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					...(await buildDeviceHeaders(configService)),
				},
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				const json = (await res.json()) as { version?: string };
				if (json.version) {
					await configService.setLastVersion(json.version);
				}
				if (gitHash && vemHash) {
					await configService.setLastPushState({ gitHash, vemHash });
				}

				// Auto-archive completed tasks
				try {
					await taskService.archiveTasks({ status: "done" });
				} catch {
					// Soft failure — don't fail the push
				}

				return {
					content: [
						{
							type: "text",
							text: `Snapshot pushed successfully. Version: ${json.version || "v1"}`,
						},
					],
				};
			}

			const data = (await res.json().catch(() => ({}))) as any;

			if (res.status === 409) {
				if (data.latest_version) {
					return {
						isError: true,
						content: [
							{
								type: "text",
								text: `Conflict: local base version ${baseVersion || "none"} does not match latest ${data.latest_version}. Run sync_pull first, then retry.`,
							},
						],
					};
				}
				if (data.expected_repo_url) {
					return {
						isError: true,
						content: [
							{
								type: "text",
								text: `Conflict: project is linked to ${data.expected_repo_url}, but local repo is ${repoUrl || "(no git remote)"}. Update git remote or re-link the project.`,
							},
						],
					};
				}
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Conflict: ${data.error || "Unknown conflict"}`,
						},
					],
				};
			}
			if (res.status === 403) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text:
								data.error ||
								"Device limit reached. Disconnect a device or upgrade your plan.",
						},
					],
				};
			}
			if (res.status === 404) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text:
								data.error ||
								"Project not found. It may have been deleted. Run `vem unlink` then `vem link` to reconnect.",
						},
					],
				};
			}

			// Network/other error: enqueue for later
			await syncService.enqueue(payload);
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Push failed (${data.error || res.statusText}). Snapshot queued for later retry.`,
					},
				],
			};
		} catch (error: any) {
			return {
				isError: true,
				content: [{ type: "text", text: `Push failed: ${error.message}` }],
			};
		}
	}

	if (name === "sync_pull") {
		const force = args?.force as boolean | undefined;

		try {
			const apiKey = await configService.getApiKey();
			if (!apiKey) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Error: No API Key configured. Run `vem login` in the CLI.",
						},
					],
				};
			}

			if ((await isVemDirty()) && !force) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Local .vem has uncommitted changes. Use force=true to overwrite, or commit your changes first.",
						},
					],
				};
			}

			const repoUrl = getGitRemote();
			const projectId = await configService.getProjectId();
			if (!repoUrl && !projectId) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Error: No git remote or linked project found. Run `vem link` in the CLI.",
						},
					],
				};
			}

			const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
			const query = new URLSearchParams();
			if (repoUrl) query.set("repo_url", repoUrl);
			if (projectId) query.set("project_id", projectId);

			const res = await fetch(`${apiUrl}/snapshots/latest?${query}`, {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					...(await buildDeviceHeaders(configService)),
				},
			});

			if (!res.ok) {
				if (res.status === 404) {
					return {
						isError: true,
						content: [
							{
								type: "text",
								text: "Project not found. It may have been deleted.",
							},
						],
					};
				}
				if (res.status === 409) {
					const data = (await res.json().catch(() => ({}))) as any;
					return {
						isError: true,
						content: [
							{
								type: "text",
								text: data.expected_repo_url
									? `Repo URL mismatch. Expected ${data.expected_repo_url}.`
									: data.error || "Conflict detected.",
							},
						],
					};
				}
				if (res.status === 403) {
					const data = (await res.json().catch(() => ({}))) as any;
					return {
						isError: true,
						content: [
							{ type: "text", text: data.error || "Device limit reached." },
						],
					};
				}
				const err = await res.text();
				return {
					isError: true,
					content: [
						{ type: "text", text: `Pull API Error: ${res.status} ${err}` },
					],
				};
			}

			const data = (await res.json()) as { snapshot: any; version?: string };
			if (!data.snapshot) {
				return {
					content: [{ type: "text", text: "No snapshot data available." }],
				};
			}

			await syncService.unpack(data.snapshot);
			if (data.version) {
				await configService.setLastVersion(data.version);
			}

			return {
				content: [
					{
						type: "text",
						text: `Snapshot pulled and unpacked. Version: ${data.version || "unknown"}`,
					},
				],
			};
		} catch (error: any) {
			return {
				isError: true,
				content: [{ type: "text", text: `Pull failed: ${error.message}` }],
			};
		}
	}

	if (name === "get_task_context") {
		const id = args?.id as string;
		if (!id) {
			return {
				isError: true,
				content: [{ type: "text", text: "Task ID is required." }],
			};
		}

		const task = await taskService.getTask(id);
		if (!task) {
			return {
				isError: true,
				content: [{ type: "text", text: `Task ${id} not found.` }],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							id: task.id,
							title: task.title,
							task_context: task.task_context || null,
							task_context_summary: task.task_context_summary || null,
						},
						null,
						2,
					),
				},
			],
		};
	}

	if (name === "update_task_context") {
		const id = args?.id as string;
		const operation = args?.operation as string;
		const text = args?.text as string | undefined;

		if (!id) {
			return {
				isError: true,
				content: [{ type: "text", text: "Task ID is required." }],
			};
		}
		if (!operation || !["set", "append", "clear"].includes(operation)) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "Operation must be 'set', 'append', or 'clear'.",
					},
				],
			};
		}
		if ((operation === "set" || operation === "append") && !text) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Text is required for '${operation}' operation.`,
					},
				],
			};
		}

		const task = await taskService.getTask(id);
		if (!task) {
			return {
				isError: true,
				content: [{ type: "text", text: `Task ${id} not found.` }],
			};
		}

		let nextContext = task.task_context || "";
		if (operation === "clear") {
			nextContext = "";
		} else if (operation === "set") {
			nextContext = text!;
		} else if (operation === "append") {
			nextContext = [nextContext, text!].filter(Boolean).join("\n");
		}

		await taskService.updateTask(id, { task_context: nextContext });

		return {
			content: [
				{ type: "text", text: `Task ${id} context updated (${operation}).` },
			],
		};
	}

	if (name === "get_subtasks") {
		const parentId = args?.parent_id as string;
		if (!parentId) {
			return {
				isError: true,
				content: [{ type: "text", text: "Parent task ID is required." }],
			};
		}

		const allTasks = await taskService.getTasks();
		const parent = allTasks.find((t) => t.id === parentId);
		if (!parent) {
			return {
				isError: true,
				content: [{ type: "text", text: `Parent task ${parentId} not found.` }],
			};
		}

		const subtasks = allTasks
			.filter((t) => t.parent_id === parentId && !t.deleted_at)
			.sort((a, b) => (a.subtask_order ?? 0) - (b.subtask_order ?? 0));

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({ parent, subtasks }, null, 2),
				},
			],
		};
	}

	if (name === "list_agent_sessions") {
		const limit = typeof args?.limit === "number" ? args.limit : 10;
		const branch = typeof args?.branch === "string" ? args.branch : undefined;
		const rawSources = args?.sources;
		const sources =
			Array.isArray(rawSources) && rawSources.length > 0
				? (rawSources as ("copilot" | "claude" | "gemini")[])
				: undefined;

		let gitRoot: string | undefined;
		try {
			gitRoot = await getRepoRoot();
		} catch {
			// fallback: no filter
		}

		let sessions = await listAllAgentSessions(gitRoot, sources);
		if (branch) {
			sessions = sessions.filter((s) => s.branch === branch);
		}
		sessions = sessions.slice(0, limit);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						sessions.map((s) => ({
							id: s.id,
							source: s.source,
							summary: s.summary,
							branch: s.branch,
							repository: s.repository,
							created_at: s.created_at,
							updated_at: s.updated_at,
							intents: s.intents,
							user_messages: s.user_messages.slice(0, 3),
						})),
						null,
						2,
					),
				},
			],
		};
	}

	if (name === "save_session_stats") {
		const taskId = args?.task_id as string;
		const sessionId = args?.session_id as string;
		const source =
			(args?.source as "copilot" | "claude" | "gemini") || "copilot";

		if (!taskId || !sessionId) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: "task_id and session_id are required.",
					},
				],
			};
		}

		const task = await taskService.getTask(taskId);
		if (!task) {
			return {
				isError: true,
				content: [{ type: "text", text: `Task ${taskId} not found.` }],
			};
		}

		const stats = await computeSessionStats(sessionId, source);
		if (!stats) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Could not compute stats for ${source} session ${sessionId}. Session file may not exist or is unreadable.`,
					},
				],
			};
		}

		// Update the matching session ref on the task (or append stats as a note if no match)
		const existingSessions = ((task.sessions as any[]) || []).map((s: any) => {
			if (s.id === sessionId) {
				return { ...s, stats };
			}
			return s;
		});

		// If no matching session was found, still save the stats by appending a new session entry
		const hasMatch = existingSessions.some((s: any) => s.id === sessionId);
		if (!hasMatch) {
			existingSessions.push({
				id: sessionId,
				source,
				started_at: stats.ended_at ?? new Date().toISOString(),
				stats,
			});
		}

		await taskService.updateTask(taskId, { sessions: existingSessions });

		return {
			content: [
				{
					type: "text",
					text: `Stats saved for session ${sessionId} on task ${taskId}:\n${JSON.stringify(stats, null, 2)}`,
				},
			],
		};
	}

	if (name === "get_cycle_context") {
		const activeCycle = await cycleService.getActiveCycle();
		if (!activeCycle) {
			return {
				content: [
					{
						type: "text",
						text: "No active cycle. Create and start one with: vem cycle create / vem cycle start",
					},
				],
			};
		}
		const allTasks = await taskService.getTasks();
		const cycleTasks = allTasks.filter(
			(t: any) => t.cycle_id === activeCycle.id && !t.deleted_at,
		);
		const result = {
			cycle: {
				id: activeCycle.id,
				name: activeCycle.name,
				goal: activeCycle.goal,
				appetite: activeCycle.appetite,
				status: activeCycle.status,
				start_at: activeCycle.start_at,
			},
			tasks: cycleTasks.map((t: any) => ({
				id: t.id,
				title: t.title,
				status: t.status,
				priority: t.priority,
				impact_score: t.impact_score,
			})),
			summary: `Active cycle: "${activeCycle.name}" — Goal: ${activeCycle.goal}. ${cycleTasks.length} task(s) assigned, ${cycleTasks.filter((t: any) => t.status === "done").length} done.`,
		};
		return {
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
		};
	}

	if (name === "get_flow_metrics") {
		const taskId = args?.task_id as string | undefined;
		const fmtMs = (ms?: number) =>
			ms !== undefined ? `${Math.round(ms / 3600000)}h` : "n/a";
		if (taskId) {
			const metrics = await taskService.getFlowMetrics(taskId);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								task_id: metrics.task_id,
								lead_time: fmtMs(metrics.lead_time_ms),
								cycle_time: fmtMs(metrics.cycle_time_ms),
								time_in_status: Object.fromEntries(
									Object.entries(metrics.time_in_status).map(([k, v]) => [
										k,
										fmtMs(v),
									]),
								),
							},
							null,
							2,
						),
					},
				],
			};
		}
		const summary = await taskService.getProjectFlowSummary();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							wip_count: summary.wip_count,
							throughput_last_7d: summary.throughput_last_7d,
							throughput_last_30d: summary.throughput_last_30d,
							avg_cycle_time: fmtMs(summary.avg_cycle_time_ms),
							avg_lead_time: fmtMs(summary.avg_lead_time_ms),
						},
						null,
						2,
					),
				},
			],
		};
	}

	// ── Plans tools ──────────────────────────────────────────────────────────────

	if (name === "deposit_plan") {
		const title = args?.title as string;
		const body = args?.body as string;
		const task_run_id = args?.task_run_id as string | undefined;

		if (!title?.trim()) {
			return {
				content: [{ type: "text", text: "Error: title is required." }],
			};
		}

		const apiKey = await configService.getApiKey();
		if (!apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "Error: not authenticated. Run `vem login` first.",
					},
				],
			};
		}

		const projectId = await configService.getProjectId();
		if (!projectId) {
			return {
				content: [
					{
						type: "text",
						text: "Error: no project configured. Run `vem setup` first.",
					},
				],
			};
		}

		const deviceHeaders = await buildDeviceHeaders(configService);

		const res = await fetch(`${API_URL}/projects/${projectId}/project-plans`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
				...deviceHeaders,
			},
			body: JSON.stringify({
				title: title.trim(),
				body,
				task_run_id: task_run_id || undefined,
				source: "agent",
			}),
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			return {
				content: [
					{
						type: "text",
						text: `Error depositing plan: ${(data as { error?: string }).error ?? res.statusText}`,
					},
				],
			};
		}

		const { plan } = await res.json();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							success: true,
							plan_id: plan.id,
							title: plan.title,
							status: plan.status,
							message: "Plan deposited successfully and is pending review.",
						},
						null,
						2,
					),
				},
			],
		};
	}

	if (name === "list_plans") {
		const status = args?.status as string | undefined;

		const apiKey = await configService.getApiKey();
		if (!apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "Error: not authenticated. Run `vem login` first.",
					},
				],
			};
		}

		const projectId = await configService.getProjectId();
		if (!projectId) {
			return {
				content: [
					{
						type: "text",
						text: "Error: no project configured. Run `vem setup` first.",
					},
				],
			};
		}

		const deviceHeaders = await buildDeviceHeaders(configService);
		const params = status ? `?status=${encodeURIComponent(status)}` : "";

		const res = await fetch(
			`${API_URL}/projects/${projectId}/project-plans${params}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					...deviceHeaders,
				},
			},
		);

		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			return {
				content: [
					{
						type: "text",
						text: `Error fetching plans: ${(data as { error?: string }).error ?? res.statusText}`,
					},
				],
			};
		}

		const { plans } = await res.json();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						(
							plans as {
								id: string;
								title: string;
								status: string;
								source: string;
								created_at: string;
							}[]
						).map((p) => ({
							id: p.id,
							title: p.title,
							status: p.status,
							source: p.source,
							created_at: p.created_at,
						})),
						null,
						2,
					),
				},
			],
		};
	}

	if (name === "get_plan") {
		const plan_id = args?.plan_id as string;

		if (!plan_id) {
			return {
				content: [{ type: "text", text: "Error: plan_id is required." }],
			};
		}

		const apiKey = await configService.getApiKey();
		if (!apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "Error: not authenticated. Run `vem login` first.",
					},
				],
			};
		}

		const deviceHeaders = await buildDeviceHeaders(configService);

		const res = await fetch(`${API_URL}/project-plans/${plan_id}`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				...deviceHeaders,
			},
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			return {
				content: [
					{
						type: "text",
						text: `Error fetching plan: ${(data as { error?: string }).error ?? res.statusText}`,
					},
				],
			};
		}

		const { plan } = await res.json();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(plan, null, 2),
				},
			],
		};
	}

	throw new Error(`Tool not found: ${name}`);
});

const transport = new StdioServerTransport();

// Support --api-key <key> CLI flag so users can pass their key directly
// without needing to run `vem login` first.
// Priority: --api-key flag > VEM_API_KEY env var > ~/.vem/config.json (set by vem login)
const apiKeyFlagIndex = process.argv.indexOf("--api-key");
if (apiKeyFlagIndex !== -1 && process.argv[apiKeyFlagIndex + 1]) {
	const flagKey = process.argv[apiKeyFlagIndex + 1];
	await configService.setApiKey(flagKey);
}

await server.connect(transport);
