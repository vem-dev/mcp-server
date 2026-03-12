#!/usr/bin/env node
import "./chunk-52K33N7B.js";
import "./chunk-CSA73CBK.js";
import "./chunk-WYWBLQNM.js";

// src/index.ts
import { execSync as execSync2 } from "child_process";
import { createHash as createHash4 } from "crypto";
import { readdir, readFile, readlink, writeFile } from "fs/promises";
import { join as join2, relative } from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// ../../packages/core/dist/agent.js
import path5 from "path";

// ../../packages/schemas/dist/index.js
import { z } from "zod";
var RelatedDecisionRefSchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    title: z.string().optional(),
    content: z.string().optional()
  })
]);
var AgentSessionStatsSchema = z.object({
  ended_at: z.string().datetime().optional(),
  session_duration_ms: z.number().int().optional(),
  turn_count: z.number().int().optional(),
  tool_call_count: z.number().int().optional(),
  model_breakdown: z.record(z.string(), z.number().int()).optional()
});
var TaskSessionRefSchema = z.object({
  id: z.string(),
  source: z.enum(["copilot", "claude", "gemini"]),
  started_at: z.string().datetime(),
  summary: z.string().optional(),
  stats: AgentSessionStatsSchema.optional()
});
var TaskActionSchema = z.object({
  type: z.enum([
    "create",
    "update_status",
    "update_priority",
    "update_tags",
    "update_type",
    "update_estimate",
    "update_dependencies",
    "update_recurrence",
    "update_owner",
    "update_reviewer",
    "delete",
    "comment",
    "completion"
  ]),
  reasoning: z.string().nullable().optional(),
  actor: z.string().nullable().optional(),
  created_at: z.string().datetime()
});
var TaskStatusSchema = z.enum([
  "todo",
  "in-progress",
  "blocked",
  "done"
]);
var TaskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
var TaskTypeSchema = z.enum(["feature", "bug", "chore"]);
var TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  assignee: z.string().optional(),
  priority: TaskPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  type: TaskTypeSchema.optional(),
  estimate_hours: z.number().optional(),
  depends_on: z.array(z.string()).optional(),
  blocked_by: z.array(z.string()).optional(),
  recurrence_rule: z.string().optional(),
  owner_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  parent_id: z.string().optional(),
  subtask_order: z.number().int().optional(),
  description: z.string().optional(),
  task_context: z.string().optional(),
  task_context_summary: z.string().optional(),
  user_notes: z.string().optional(),
  related_decisions: z.array(RelatedDecisionRefSchema).optional(),
  evidence: z.array(z.string()).optional(),
  validation_steps: z.array(z.string()).optional(),
  sessions: z.array(TaskSessionRefSchema).optional(),
  actions: z.array(TaskActionSchema).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  due_at: z.string().datetime().optional(),
  github_issue_number: z.number().optional(),
  deleted_at: z.string().datetime().optional()
});
var TaskListSchema = z.object({
  tasks: z.array(TaskSchema)
});
var TaskUpdateSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  assignee: z.string().optional(),
  priority: TaskPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  type: TaskTypeSchema.optional(),
  estimate_hours: z.number().optional(),
  depends_on: z.array(z.string()).optional(),
  blocked_by: z.array(z.string()).optional(),
  recurrence_rule: z.string().optional(),
  owner_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  parent_id: z.string().optional(),
  subtask_order: z.number().int().optional(),
  due_at: z.string().datetime().optional(),
  evidence: z.array(z.string()).optional(),
  task_context: z.string().optional(),
  task_context_summary: z.string().optional(),
  user_notes: z.string().optional(),
  related_decisions: z.array(RelatedDecisionRefSchema).optional(),
  validation_steps: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
  actor: z.string().optional(),
  github_issue_number: z.number().optional(),
  deleted_at: z.string().datetime().optional()
});
var TaskCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  assignee: z.string().optional(),
  priority: TaskPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  type: TaskTypeSchema.optional(),
  estimate_hours: z.number().optional(),
  depends_on: z.array(z.string()).optional(),
  blocked_by: z.array(z.string()).optional(),
  recurrence_rule: z.string().optional(),
  owner_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  parent_id: z.string().optional(),
  subtask_order: z.number().int().optional(),
  due_at: z.string().datetime().optional(),
  evidence: z.array(z.string()).optional(),
  task_context: z.string().optional(),
  task_context_summary: z.string().optional(),
  related_decisions: z.array(RelatedDecisionRefSchema).optional(),
  validation_steps: z.array(z.string()).optional(),
  reasoning: z.string().optional()
});
var VemUpdateSchema = z.object({
  tasks: z.array(TaskUpdateSchema).optional(),
  new_tasks: z.array(TaskCreateSchema).optional(),
  changelog_append: z.union([z.string(), z.array(z.string())]).optional(),
  decisions_append: z.union([z.string(), z.array(z.string())]).optional(),
  current_state: z.string().optional(),
  context: z.string().optional()
});
var WebhookEventSchema = z.enum([
  "task.created",
  "task.started",
  "task.blocked",
  "task.completed",
  "task.deleted",
  "snapshot.pushed",
  "snapshot.verified",
  "snapshot.failed",
  "decision.added",
  "changelog.updated",
  "drift.detected",
  "project.linked"
]);
var WebhookSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string(),
  project_id: z.string().nullable(),
  url: z.string().url(),
  secret: z.string(),
  enabled: z.boolean(),
  events: z.array(WebhookEventSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().nullable()
});
var WebhookCreateSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z.array(WebhookEventSchema).min(1, "Must select at least one event")
});
var WebhookUpdateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(WebhookEventSchema).min(1).optional(),
  enabled: z.boolean().optional()
});
var WebhookDeliverySchema = z.object({
  id: z.string().uuid(),
  webhook_id: z.string().uuid(),
  event_type: WebhookEventSchema,
  payload: z.any(),
  status_code: z.number().nullable(),
  success: z.boolean(),
  attempt: z.number().int().min(1).max(3),
  error_message: z.string().nullable(),
  delivered_at: z.string().datetime()
});

// ../../packages/core/dist/agent.js
import fs5 from "fs-extra";

// ../../packages/core/dist/fs.js
import path from "path";
import { findUp } from "find-up-simple";
import fs from "fs-extra";
var VEM_DIR = ".vem";
var TASKS_DIR = "tasks";
var DECISIONS_DIR = "decisions";
var CHANGELOG_DIR = "changelog";
var CONTEXT_FILE = "CONTEXT.md";
var CURRENT_STATE_FILE = "CURRENT_STATE.md";
async function getRepoRoot() {
  const gitDir = await findUp(".git", { type: "directory" });
  if (!gitDir) {
    throw new Error("Not inside a Git repository");
  }
  return path.dirname(gitDir);
}
async function getVemDir() {
  const root = await getRepoRoot();
  return path.join(root, VEM_DIR);
}
async function ensureVemDir() {
  const dir = await getVemDir();
  await fs.ensureDir(dir);
  return dir;
}
async function ensureVemFiles() {
  const dir = await ensureVemDir();
  await fs.ensureDir(path.join(dir, TASKS_DIR));
  await fs.ensureDir(path.join(dir, DECISIONS_DIR));
  await fs.ensureDir(path.join(dir, CHANGELOG_DIR));
  const contextPath = path.join(dir, CONTEXT_FILE);
  if (!await fs.pathExists(contextPath)) {
    await fs.writeFile(contextPath, "# Project Context: vem\n\nDescribe the high-level project context here.\n", "utf-8");
  }
  const currentStatePath = path.join(dir, CURRENT_STATE_FILE);
  if (!await fs.pathExists(currentStatePath)) {
    await fs.writeFile(currentStatePath, "# Current State\n\nSummarize what just changed, what is in progress, and what is next.\n", "utf-8");
  }
}

// ../../packages/core/dist/git.js
import { execSync } from "child_process";
async function getGitHeadHash() {
  try {
    const root = await getRepoRoot();
    const hash = execSync("git rev-parse HEAD", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString().trim();
    return hash || null;
  } catch {
    return null;
  }
}
async function getGitLastCommitForPath(filePath) {
  try {
    const root = await getRepoRoot();
    const relative2 = filePath.startsWith(root) ? filePath.slice(root.length + 1) : filePath;
    const hash = execSync(`git log -1 --format=%H -- "${relative2.replace(/"/g, '\\"')}"`, {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString().trim();
    return hash || null;
  } catch {
    return null;
  }
}

// ../../packages/core/dist/logs.js
import path2 from "path";
import fs2 from "fs-extra";
var ScalableLogService = class {
  subDir;
  constructor(subDir) {
    this.subDir = subDir;
  }
  async getBaseDir() {
    const vemDir = await getVemDir();
    const dir = path2.join(vemDir, this.subDir);
    await fs2.ensureDir(dir);
    return dir;
  }
  async addEntry(title, content, options) {
    const baseDir = await this.getBaseDir();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const id = `${timestamp.replace(/[:.]/g, "-")}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const filePath = path2.join(baseDir, `${id}.md`);
    const commitLine = options?.commitHash ? `**Commit:** ${options.commitHash}

` : "";
    const fullContent = `# ${title}

**Date:** ${timestamp}

${commitLine}${content}
`;
    await fs2.writeFile(filePath, fullContent, "utf-8");
    return id;
  }
  async getAllEntries() {
    const baseDir = await this.getBaseDir();
    const files = await fs2.readdir(baseDir);
    const entries = [];
    for (const file of files) {
      if (file.endsWith(".md")) {
        const content = await fs2.readFile(path2.join(baseDir, file), "utf-8");
        const id = path2.parse(file).name;
        const titleMatch = content.match(/^#\s+(.*)/);
        const title = titleMatch ? titleMatch[1] : id;
        entries.push({
          id,
          title,
          content,
          created_at: id.substring(0, 19).replace(/-/g, (_m, offset) => offset === 10 ? "T" : offset === 13 || offset === 16 ? ":" : "-"),
          file_path: path2.join(baseDir, file)
        });
      }
    }
    return entries.sort((a, b) => b.id.localeCompare(a.id));
  }
  async getMonolithicContent() {
    return this.getMonolithicContentWithOptions();
  }
  async getMonolithicContentWithOptions(options) {
    const entries = await this.getAllEntries();
    const normalized = await Promise.all(entries.reverse().map(async (entry) => {
      if (!options?.includeCommitHashes)
        return entry.content;
      if (/^\*\*Commit:\*\*/m.test(entry.content))
        return entry.content;
      if (!entry.file_path)
        return entry.content;
      const commitHash = await getGitLastCommitForPath(entry.file_path);
      if (!commitHash)
        return entry.content;
      const dateMatch = entry.content.match(/^\*\*Date:\*\*.*$/m);
      if (!dateMatch) {
        return `**Commit:** ${commitHash}

${entry.content}`;
      }
      return entry.content.replace(dateMatch[0], `${dateMatch[0]}

**Commit:** ${commitHash}`);
    }));
    return normalized.join("\n---\n\n");
  }
  async archiveEntries(options) {
    const entries = await this.getAllEntries();
    let toArchive = [];
    if (options.keepCount !== void 0) {
      toArchive = entries.slice(options.keepCount);
    } else if (options.olderThanDays !== void 0) {
      const now = /* @__PURE__ */ new Date();
      const threshold = new Date(now.getTime() - options.olderThanDays * 24 * 60 * 60 * 1e3);
      toArchive = entries.filter((e) => new Date(e.created_at) < threshold);
    } else {
      toArchive = entries.slice(20);
    }
    if (toArchive.length === 0)
      return 0;
    const baseDir = await this.getBaseDir();
    const archiveBase = path2.join(baseDir, "archive");
    await fs2.ensureDir(archiveBase);
    for (const entry of toArchive) {
      const date = new Date(entry.created_at);
      const folder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const targetDir = path2.join(archiveBase, folder);
      await fs2.ensureDir(targetDir);
      const src = path2.join(baseDir, `${entry.id}.md`);
      const dest = path2.join(targetDir, `${entry.id}.md`);
      if (await fs2.pathExists(src)) {
        await fs2.move(src, dest, { overwrite: true });
      }
    }
    return toArchive.length;
  }
};

// ../../packages/core/dist/tasks.js
import path4 from "path";
import fs4 from "fs-extra";

// ../../packages/core/dist/sharded-fs.js
import crypto from "crypto";
import path3 from "path";
import fs3 from "fs-extra";
var ShardedFileStorage = class {
  baseDir;
  objectsDirName;
  constructor(baseDir, objectsDirName = "objects") {
    this.baseDir = baseDir;
    this.objectsDirName = objectsDirName;
  }
  getObjectsDir() {
    return path3.join(this.baseDir, this.objectsDirName);
  }
  getShard(id) {
    const hash = crypto.createHash("sha1").update(id).digest("hex");
    return hash.substring(0, 2);
  }
  getFilePath(id) {
    const shard = this.getShard(id);
    return path3.join(this.getObjectsDir(), shard, `${id}.json`);
  }
  async save(record) {
    const filePath = this.getFilePath(record.id);
    await fs3.ensureDir(path3.dirname(filePath));
    await fs3.writeJson(filePath, record, { spaces: 2 });
  }
  async load(id) {
    const filePath = this.getFilePath(id);
    if (!await fs3.pathExists(filePath)) {
      return null;
    }
    return fs3.readJson(filePath);
  }
  async delete(id) {
    const filePath = this.getFilePath(id);
    if (await fs3.pathExists(filePath)) {
      await fs3.remove(filePath);
    }
  }
  async listIds() {
    const objectsDir = this.getObjectsDir();
    if (!await fs3.pathExists(objectsDir)) {
      return [];
    }
    const shards = await fs3.readdir(objectsDir);
    const ids = [];
    for (const shard of shards) {
      const shardPath = path3.join(objectsDir, shard);
      const stat = await fs3.stat(shardPath);
      if (!stat.isDirectory())
        continue;
      const files = await fs3.readdir(shardPath);
      for (const file of files) {
        if (file.endsWith(".json")) {
          ids.push(path3.parse(file).name);
        }
      }
    }
    return ids;
  }
  async loadAll() {
    const ids = await this.listIds();
    const result = [];
    for (const id of ids) {
      const record = await this.load(id);
      if (record) {
        result.push(record);
      }
    }
    return result;
  }
};
var TaskIndex = class {
  indexPath;
  constructor(baseDir) {
    this.indexPath = path3.join(baseDir, "index.json");
  }
  async load() {
    if (!await fs3.pathExists(this.indexPath)) {
      return [];
    }
    try {
      const data = await fs3.readJson(this.indexPath);
      return data.entries || [];
    } catch {
      return [];
    }
  }
  async save(entries) {
    await fs3.ensureDir(path3.dirname(this.indexPath));
    await fs3.writeJson(this.indexPath, { entries }, { spaces: 2 });
  }
  async updateEntry(entry) {
    const entries = await this.load();
    const index = entries.findIndex((e) => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    await this.save(entries);
  }
  async removeEntry(id) {
    const entries = await this.load();
    const filtered = entries.filter((e) => e.id !== id);
    await this.save(filtered);
  }
};

// ../../packages/core/dist/tasks.js
var TASK_CONTEXT_SUMMARY_MAX_CHARS = 1200;
function summarizeTaskContext(value) {
  const normalized = value.trim();
  if (normalized.length <= TASK_CONTEXT_SUMMARY_MAX_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, TASK_CONTEXT_SUMMARY_MAX_CHARS - 15).trimEnd()}
...[truncated]`;
}
var TaskService = class {
  storage = null;
  index = null;
  async init() {
    if (this.storage && this.index) {
      return { storage: this.storage, index: this.index };
    }
    const vemDir = await getVemDir();
    const baseDir = path4.join(vemDir, TASKS_DIR);
    await fs4.ensureDir(baseDir);
    this.storage = new ShardedFileStorage(baseDir);
    this.index = new TaskIndex(baseDir);
    return { storage: this.storage, index: this.index };
  }
  async getTasks() {
    const { storage } = await this.init();
    const active = await storage.loadAll();
    const archived = await this.loadRecentArchivedTasks(30);
    const archivedIds = new Set(active.map((t) => t.id));
    for (const t of archived) {
      if (!archivedIds.has(t.id))
        active.push(t);
    }
    return active;
  }
  async loadRecentArchivedTasks(withinDays) {
    const vemDir = await getVemDir();
    const archiveDir = path4.join(vemDir, TASKS_DIR, "archive");
    if (!await fs4.pathExists(archiveDir))
      return [];
    const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1e3;
    const result = [];
    const walk = async (dir) => {
      const entries = await fs4.readdir(dir);
      for (const entry of entries) {
        const fullPath = path4.join(dir, entry);
        const stat = await fs4.stat(fullPath);
        if (stat.isDirectory()) {
          await walk(fullPath);
          continue;
        }
        if (!entry.endsWith(".json"))
          continue;
        if (stat.mtimeMs < cutoff)
          continue;
        try {
          const task = await fs4.readJson(fullPath);
          if (task?.id)
            result.push(task);
        } catch {
        }
      }
    };
    await walk(archiveDir);
    return result;
  }
  async getTaskIndex() {
    const { index } = await this.init();
    return index.load();
  }
  async getTask(id) {
    const { storage } = await this.init();
    return storage.load(id);
  }
  async listArchivedTaskIds() {
    const vemDir = await getVemDir();
    const archiveDir = path4.join(vemDir, TASKS_DIR, "archive");
    if (!await fs4.pathExists(archiveDir)) {
      return [];
    }
    const ids = [];
    const walk = async (dir) => {
      const entries = await fs4.readdir(dir);
      for (const entry of entries) {
        const fullPath = path4.join(dir, entry);
        const stat = await fs4.stat(fullPath);
        if (stat.isDirectory()) {
          await walk(fullPath);
          continue;
        }
        if (!entry.endsWith(".json"))
          continue;
        const id = path4.parse(entry).name;
        if (/^TASK-\d{3,}$/.test(id)) {
          ids.push(id);
        }
      }
    };
    await walk(archiveDir);
    return ids;
  }
  async getNextTaskId(storage) {
    const allTasks = await storage.loadAll();
    const archivedIds = await this.listArchivedTaskIds();
    const allIds = /* @__PURE__ */ new Set([
      ...allTasks.map((task) => task.id),
      ...archivedIds
    ]);
    let maxId = 0;
    for (const id of allIds) {
      const match = id.match(/^TASK-(\d{3,})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
    let candidateNum = maxId + 1;
    let candidateId = `TASK-${String(candidateNum).padStart(3, "0")}`;
    while (allIds.has(candidateId)) {
      candidateNum++;
      candidateId = `TASK-${String(candidateNum).padStart(3, "0")}`;
    }
    return candidateId;
  }
  async addTask(title, description, priority = "medium", reasoning, options) {
    const { storage, index } = await this.init();
    const explicitId = options?.id?.trim();
    const id = explicitId && explicitId.length > 0 ? explicitId : await this.getNextTaskId(storage);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const blockingIds = await this.getBlockingIds(options?.depends_on, options?.blocked_by, storage);
    if (options?.status === "done" && blockingIds.length > 0) {
      throw new Error("Cannot mark task as done while dependencies are incomplete.");
    }
    const initialStatus = blockingIds.length > 0 && options?.status !== "done" ? "blocked" : options?.status ?? "todo";
    const newTask = {
      id,
      title,
      description,
      status: initialStatus,
      assignee: options?.assignee,
      priority,
      tags: options?.tags,
      type: options?.type,
      estimate_hours: options?.estimate_hours,
      depends_on: options?.depends_on,
      blocked_by: options?.blocked_by,
      recurrence_rule: options?.recurrence_rule,
      owner_id: options?.owner_id,
      reviewer_id: options?.reviewer_id,
      parent_id: options?.parent_id,
      subtask_order: options?.subtask_order,
      due_at: options?.due_at,
      task_context: options?.task_context,
      task_context_summary: options?.task_context_summary,
      evidence: options?.evidence,
      validation_steps: options?.validation_steps,
      created_at: timestamp,
      updated_at: timestamp,
      actions: [
        {
          type: "create",
          reasoning: reasoning ?? null,
          actor: options?.actor ?? null,
          created_at: timestamp
        }
      ]
    };
    await storage.save(newTask);
    await index.updateEntry({
      id: newTask.id,
      title: newTask.title,
      status: newTask.status,
      assignee: newTask.assignee,
      priority: newTask.priority,
      updated_at: newTask.updated_at
    });
    return newTask;
  }
  async updateTask(id, patch) {
    return this.updateTaskInternal(id, patch);
  }
  async updateTaskInternal(id, patch) {
    const { actor, ...taskPatch } = patch;
    const { storage, index } = await this.init();
    const currentTask = await storage.load(id);
    if (!currentTask) {
      throw new Error(`Task ${id} not found`);
    }
    const normalizeEvidence2 = (value) => value?.map((entry) => entry.trim()).filter(Boolean);
    const normalizeText = (value) => {
      if (value === void 0)
        return void 0;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : void 0;
    };
    const hasOwn = (key) => Object.hasOwn(taskPatch, key);
    const normalizeStringArray = (value) => {
      if (!value)
        return value;
      return value.map((entry) => entry.trim()).filter(Boolean);
    };
    const statusProvided = taskPatch.status !== void 0;
    const tagsProvided = hasOwn("tags");
    const dependsProvided = hasOwn("depends_on");
    const blockedProvided = hasOwn("blocked_by");
    const deletedProvided = hasOwn("deleted_at");
    const validationProvided = hasOwn("validation_steps");
    const nextStatus = taskPatch.status ?? currentTask.status;
    const nextPriority = taskPatch.priority ?? currentTask.priority;
    const nextEvidence = normalizeEvidence2(taskPatch.evidence) ?? currentTask.evidence;
    const nextTags = tagsProvided ? normalizeStringArray(taskPatch.tags) ?? [] : currentTask.tags;
    const nextType = taskPatch.type ?? currentTask.type;
    const nextEstimate = taskPatch.estimate_hours ?? currentTask.estimate_hours;
    const nextDependsOn = dependsProvided ? normalizeStringArray(taskPatch.depends_on) ?? [] : currentTask.depends_on;
    const nextBlockedBy = blockedProvided ? normalizeStringArray(taskPatch.blocked_by) ?? [] : currentTask.blocked_by;
    const nextRecurrence = taskPatch.recurrence_rule ?? currentTask.recurrence_rule;
    const nextOwner = taskPatch.owner_id ?? currentTask.owner_id;
    const nextReviewer = taskPatch.reviewer_id ?? currentTask.reviewer_id;
    const taskContextProvided = taskPatch.task_context !== void 0;
    const taskContextSummaryProvided = taskPatch.task_context_summary !== void 0;
    const nextTaskContext = taskContextProvided ? normalizeText(taskPatch.task_context) : currentTask.task_context;
    let nextTaskContextSummary = taskContextSummaryProvided ? normalizeText(taskPatch.task_context_summary) : currentTask.task_context_summary;
    const nextValidationSteps = validationProvided ? normalizeStringArray(taskPatch.validation_steps) ?? [] : currentTask.validation_steps;
    const blockingIds = await this.getBlockingIds(nextDependsOn, nextBlockedBy, storage);
    const hasBlocking = blockingIds.length > 0;
    if (nextStatus === "done" && hasBlocking) {
      throw new Error("Cannot mark task as done while dependencies are incomplete.");
    }
    let effectiveStatus = nextStatus;
    if (hasBlocking) {
      effectiveStatus = "blocked";
    } else if (!statusProvided && currentTask.status === "blocked") {
      effectiveStatus = "todo";
    }
    if (effectiveStatus === "done" && currentTask.status !== "done") {
      if (!taskPatch.reasoning) {
        throw new Error("Reasoning is required to mark a task as done.");
      }
      if (!nextEvidence || nextEvidence.length === 0) {
        throw new Error("Evidence is required to mark a task as done. Provide file paths or verification commands.");
      }
      if (nextValidationSteps && nextValidationSteps.length > 0) {
        const evidenceBlob = nextEvidence.join(" ").toLowerCase();
        const missing = nextValidationSteps.filter((step) => !evidenceBlob.includes(step.toLowerCase()));
        if (missing.length > 0) {
          throw new Error(`Missing validation evidence for: ${missing.join(", ")}.`);
        }
      }
    }
    const actions = currentTask.actions || [];
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const actorValue = actor?.trim() || void 0;
    if (effectiveStatus !== currentTask.status) {
      actions.push({
        type: effectiveStatus === "done" ? "completion" : "update_status",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    } else if (nextPriority !== currentTask.priority) {
      actions.push({
        type: "update_priority",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    } else if (taskPatch.reasoning) {
      actions.push({
        type: "comment",
        reasoning: taskPatch.reasoning,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    if (tagsProvided) {
      const prevTags = currentTask.tags ?? [];
      const next = nextTags ?? [];
      if (prevTags.join("|") !== next.join("|")) {
        actions.push({
          type: "update_tags",
          reasoning: taskPatch.reasoning ?? null,
          actor: actorValue ?? null,
          created_at: timestamp
        });
      }
    }
    if (nextType !== currentTask.type) {
      actions.push({
        type: "update_type",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    if (nextEstimate !== currentTask.estimate_hours) {
      actions.push({
        type: "update_estimate",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    if (dependsProvided || blockedProvided) {
      const prevDepends = currentTask.depends_on ?? [];
      const prevBlocked = currentTask.blocked_by ?? [];
      const nextDepends = nextDependsOn ?? [];
      const nextBlocked = nextBlockedBy ?? [];
      if (prevDepends.join("|") !== nextDepends.join("|") || prevBlocked.join("|") !== nextBlocked.join("|")) {
        actions.push({
          type: "update_dependencies",
          reasoning: taskPatch.reasoning ?? null,
          actor: actorValue ?? null,
          created_at: timestamp
        });
      }
    }
    if (nextRecurrence !== currentTask.recurrence_rule) {
      actions.push({
        type: "update_recurrence",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    if (nextOwner !== currentTask.owner_id) {
      actions.push({
        type: "update_owner",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    if (nextReviewer !== currentTask.reviewer_id) {
      actions.push({
        type: "update_reviewer",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    if (deletedProvided && taskPatch.deleted_at !== currentTask.deleted_at) {
      actions.push({
        type: "delete",
        reasoning: taskPatch.reasoning ?? null,
        actor: actorValue ?? null,
        created_at: timestamp
      });
    }
    let finalTaskContext = nextTaskContext;
    if (effectiveStatus === "done" && finalTaskContext) {
      if (!nextTaskContextSummary) {
        nextTaskContextSummary = summarizeTaskContext(finalTaskContext);
      }
      finalTaskContext = void 0;
    }
    const updatedTask = {
      ...currentTask,
      ...taskPatch,
      status: effectiveStatus,
      tags: nextTags,
      type: nextType,
      estimate_hours: nextEstimate,
      depends_on: nextDependsOn,
      blocked_by: nextBlockedBy,
      recurrence_rule: nextRecurrence,
      owner_id: nextOwner,
      reviewer_id: nextReviewer,
      evidence: nextEvidence,
      task_context: finalTaskContext,
      task_context_summary: nextTaskContextSummary,
      validation_steps: nextValidationSteps,
      actions,
      updated_at: timestamp
    };
    delete updatedTask.reasoning;
    delete updatedTask.actor;
    await storage.save(updatedTask);
    await index.updateEntry({
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      assignee: updatedTask.assignee,
      priority: updatedTask.priority,
      updated_at: updatedTask.updated_at
    });
    if (updatedTask.parent_id) {
      await this.syncParentStatus(updatedTask.parent_id, storage);
    }
    return updatedTask;
  }
  async syncParentStatus(parentId, storage) {
    const parent = await storage.load(parentId);
    if (!parent)
      return;
    const allTasks = await storage.loadAll();
    const subtasks = allTasks.filter((task) => task.parent_id === parentId && !task.deleted_at);
    if (subtasks.length === 0)
      return;
    const allDone = subtasks.every((task) => task.status === "done");
    if (allDone) {
      if (parent.status === "done")
        return;
      const subtaskIds = subtasks.map((task) => task.id).join(", ");
      await this.updateTaskInternal(parentId, {
        status: "done",
        reasoning: "Auto-completed because all subtasks are done.",
        evidence: [`Subtasks completed: ${subtaskIds}`]
      });
      return;
    }
    if (parent.status !== "done")
      return;
    await this.updateTaskInternal(parentId, {
      status: "in-progress",
      reasoning: "Auto-reopened because a subtask is not done."
    });
  }
  async getBlockingIds(dependsOn, blockedBy, storage) {
    const blockers = /* @__PURE__ */ new Set();
    const ids = [...dependsOn ?? [], ...blockedBy ?? []].filter(Boolean);
    if (ids.length === 0)
      return [];
    for (const id of ids) {
      const task = await storage.load(id);
      if (!task || task.deleted_at || task.status !== "done") {
        blockers.add(id);
      }
    }
    return Array.from(blockers);
  }
  async archiveTasks(options) {
    const { storage, index } = await this.init();
    const entries = await index.load();
    if (!options.status && options.olderThanDays === void 0) {
      throw new Error("Must provide at least one filter (status or olderThanDays)");
    }
    const now = /* @__PURE__ */ new Date();
    const threshold = options.olderThanDays !== void 0 ? new Date(now.getTime() - options.olderThanDays * 24 * 60 * 60 * 1e3) : null;
    const candidates = entries.filter((entry) => {
      let matches = true;
      if (options.status) {
        matches = matches && entry.status === options.status;
      }
      if (threshold && entry.updated_at) {
        matches = matches && new Date(entry.updated_at) < threshold;
      }
      return matches;
    });
    if (candidates.length === 0)
      return 0;
    const vemDir = await getVemDir();
    const baseDir = path4.join(vemDir, TASKS_DIR);
    const archiveBase = path4.join(baseDir, "archive");
    await fs4.ensureDir(archiveBase);
    let count = 0;
    for (const entry of candidates) {
      const task = await storage.load(entry.id);
      if (task) {
        const date = new Date(task.created_at || /* @__PURE__ */ new Date());
        const folder = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const targetDir = path4.join(archiveBase, folder);
        await fs4.ensureDir(targetDir);
        const destWithId = path4.join(targetDir, `${task.id}.json`);
        await fs4.writeJson(destWithId, task, { spaces: 2 });
        await storage.delete(entry.id);
        await index.removeEntry(entry.id);
        count++;
      }
    }
    return count;
  }
};

// ../../packages/core/dist/agent.js
var DEFAULT_TASK_CONTEXT_SUMMARY_MAX_CHARS = 1200;
function resolveAgentActor(actor) {
  const trimmed = actor?.trim();
  if (trimmed)
    return trimmed;
  const envActor = process.env.VEM_AGENT_NAME || process.env.VEM_ACTOR || process.env.VEM_AGENT;
  const normalized = envActor?.trim();
  return normalized || void 0;
}
function normalizeEvidence(evidence) {
  if (!evidence)
    return [];
  return evidence.map((entry) => entry.trim()).filter(Boolean);
}
function addValidationEvidence(evidence, validationSteps) {
  if (!validationSteps || validationSteps.length === 0) {
    return evidence;
  }
  const merged = [...evidence];
  let evidenceBlob = merged.join(" ").toLowerCase();
  for (const step of validationSteps) {
    const normalizedStep = step.trim();
    if (!normalizedStep)
      continue;
    if (!evidenceBlob.includes(normalizedStep.toLowerCase())) {
      const entry = `Validated: ${normalizedStep}`;
      merged.push(entry);
      evidenceBlob = `${evidenceBlob}
${entry.toLowerCase()}`;
    }
  }
  return merged;
}
function summarizeTaskContext2(taskContext) {
  const normalized = taskContext.trim();
  if (normalized.length <= DEFAULT_TASK_CONTEXT_SUMMARY_MAX_CHARS) {
    return normalized;
  }
  return `${normalized.slice(0, DEFAULT_TASK_CONTEXT_SUMMARY_MAX_CHARS - 15).trimEnd()}
...[truncated]`;
}
async function applyVemUpdate(update) {
  await ensureVemFiles();
  const taskService2 = new TaskService();
  const decisionsLog = new ScalableLogService(DECISIONS_DIR);
  const changelogLog = new ScalableLogService(CHANGELOG_DIR);
  const updatedTasks = [];
  const newTasks = [];
  if (update.tasks?.length) {
    for (const entry of update.tasks) {
      const parsed = TaskUpdateSchema.safeParse(entry);
      if (!parsed.success) {
        throw new Error(`Invalid task update for ${entry.id}: ${parsed.error.message}`);
      }
      const { id, ...patch } = parsed.data;
      const task = await taskService2.getTask(id);
      if (!task) {
        throw new Error(`Task ${id} not found.`);
      }
      let cleaned = stripUndefined(patch);
      if (cleaned.status === "done" && task.status !== "done") {
        const actor = resolveAgentActor(cleaned.actor);
        const reasoning = cleaned.reasoning?.trim() || `Completed via ${actor || "agent"} session.`;
        const baseEvidence = normalizeEvidence(cleaned.evidence);
        const evidenceSeed = baseEvidence.length > 0 ? baseEvidence : [`Completed by agent ${actor || "unknown"}`];
        const evidence = addValidationEvidence(evidenceSeed, task.validation_steps);
        const taskContextSummary = cleaned.task_context_summary ?? (task.task_context ? summarizeTaskContext2(task.task_context) : void 0);
        cleaned = stripUndefined({
          ...cleaned,
          actor,
          reasoning,
          evidence,
          task_context_summary: taskContextSummary
        });
      }
      const updated = await taskService2.updateTask(id, cleaned);
      updatedTasks.push(updated);
    }
  }
  if (update.new_tasks?.length) {
    for (const entry of update.new_tasks) {
      const parsed = TaskCreateSchema.safeParse(entry);
      if (!parsed.success) {
        throw new Error(`Invalid new task payload: ${parsed.error.message}`);
      }
      const created = await taskService2.addTask(parsed.data.title, parsed.data.description, parsed.data.priority ?? "medium", parsed.data.reasoning, stripUndefined({
        status: parsed.data.status,
        assignee: parsed.data.assignee,
        tags: parsed.data.tags,
        type: parsed.data.type,
        estimate_hours: parsed.data.estimate_hours,
        depends_on: parsed.data.depends_on,
        blocked_by: parsed.data.blocked_by,
        recurrence_rule: parsed.data.recurrence_rule,
        owner_id: parsed.data.owner_id,
        reviewer_id: parsed.data.reviewer_id,
        evidence: parsed.data.evidence,
        parent_id: parsed.data.parent_id,
        subtask_order: parsed.data.subtask_order,
        due_at: parsed.data.due_at,
        task_context: parsed.data.task_context,
        task_context_summary: parsed.data.task_context_summary
      }));
      const patch = stripUndefined({
        status: parsed.data.status,
        assignee: parsed.data.assignee,
        tags: parsed.data.tags,
        type: parsed.data.type,
        estimate_hours: parsed.data.estimate_hours,
        depends_on: parsed.data.depends_on,
        blocked_by: parsed.data.blocked_by,
        recurrence_rule: parsed.data.recurrence_rule,
        owner_id: parsed.data.owner_id,
        reviewer_id: parsed.data.reviewer_id,
        evidence: parsed.data.evidence,
        parent_id: parsed.data.parent_id,
        subtask_order: parsed.data.subtask_order,
        due_at: parsed.data.due_at,
        task_context: parsed.data.task_context,
        task_context_summary: parsed.data.task_context_summary
      });
      let updated = created;
      if (Object.keys(patch).length > 0) {
        updated = await taskService2.updateTask(created.id, patch);
      }
      newTasks.push(updated);
    }
  }
  const changelogLines = await appendChangelog(changelogLog, update.changelog_append);
  const decisionsAppendedRef = await appendDecisions(decisionsLog, update.decisions_append);
  const decisionsAppended = decisionsAppendedRef !== null;
  if (decisionsAppendedRef) {
    const refId = typeof decisionsAppendedRef === "string" ? decisionsAppendedRef : decisionsAppendedRef.id;
    const allAffectedTasks = [...updatedTasks, ...newTasks];
    for (const task of allAffectedTasks) {
      const existing = Array.isArray(task.related_decisions) ? task.related_decisions : [];
      const alreadyLinked = existing.some((r) => typeof r === "string" ? r === refId : r.id === refId);
      if (!alreadyLinked) {
        const updated = await taskService2.updateTask(task.id, {
          related_decisions: [...existing, decisionsAppendedRef]
        });
        const ui = updatedTasks.findIndex((t) => t.id === task.id);
        if (ui !== -1)
          updatedTasks[ui] = updated;
        const ni = newTasks.findIndex((t) => t.id === task.id);
        if (ni !== -1)
          newTasks[ni] = updated;
      }
    }
  }
  const currentStateUpdated = await writeCurrentState(update.current_state);
  const contextUpdated = await writeContext(update.context);
  return {
    updatedTasks,
    newTasks,
    changelogLines,
    decisionsAppended,
    decisionsAppendedRef,
    currentStateUpdated,
    contextUpdated
  };
}
function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== void 0));
}
function normalizeLines(value) {
  if (!value)
    return [];
  const raw = Array.isArray(value) ? value : value.split(/\r?\n/);
  return raw.map((line) => line.trim()).filter(Boolean);
}
async function appendChangelog(log, value) {
  const additions = normalizeLines(value);
  if (additions.length === 0)
    return [];
  const content = additions.map((line) => `- ${line}`).join("\n");
  const commitHash = await getGitHeadHash();
  await log.addEntry("Agent Update", content, { commitHash });
  return additions;
}
function extractDecisionTitle(block) {
  const match = block.match(/^#{1,3}\s+\[([^\]]+)\]\s+(.+)$/m);
  if (match)
    return `${match[1]}: ${match[2].trim()}`;
  const plain = block.match(/^#{1,3}\s+(.+)$/m);
  return plain?.[1]?.trim();
}
async function appendDecisions(log, value) {
  if (!value)
    return null;
  const block = Array.isArray(value) ? value.join("\n").trim() : value.trim();
  if (!block)
    return null;
  const commitHash = await getGitHeadHash();
  const id = await log.addEntry("Agent Decision", block, { commitHash });
  const title = extractDecisionTitle(block);
  return title ? { id, title, content: block } : { id, content: block };
}
async function writeCurrentState(value) {
  if (value === void 0)
    return false;
  const dir = await getVemDir();
  const currentStatePath = path5.join(dir, CURRENT_STATE_FILE);
  const next = value.trim().length > 0 ? `${value.trim()}
` : "";
  await fs5.writeFile(currentStatePath, next, "utf-8");
  return true;
}
async function writeContext(value) {
  if (value === void 0)
    return false;
  const dir = await getVemDir();
  const contextPath = path5.join(dir, CONTEXT_FILE);
  const next = value.trim().length > 0 ? `${value.trim()}
` : "";
  await fs5.writeFile(contextPath, next, "utf-8");
  return true;
}

// ../../packages/core/dist/agent-sessions.js
function fromCopilotSession(s) {
  return {
    id: s.id,
    source: "copilot",
    summary: s.summary,
    branch: s.branch,
    repository: s.repository,
    git_root: s.git_root,
    cwd: s.cwd,
    created_at: s.created_at,
    updated_at: s.updated_at,
    intents: "intents" in s ? s.intents : [],
    user_messages: "user_messages" in s ? s.user_messages : []
  };
}
async function listAllAgentSessions(gitRoot, sources = ["copilot", "claude", "gemini"]) {
  const [{ listCopilotSessions }, { listClaudeSessions }, { listGeminiSessions }] = await Promise.all([
    import("./copilot-sessions-LLDNCHIU.js"),
    import("./claude-sessions-5HEECZ63.js"),
    import("./gemini-sessions-RPV25JO4.js")
  ]);
  const results = await Promise.all([
    sources.includes("copilot") ? listCopilotSessions(gitRoot).then((ss) => ss.map(fromCopilotSession)) : Promise.resolve([]),
    sources.includes("claude") ? listClaudeSessions(gitRoot) : Promise.resolve([]),
    sources.includes("gemini") ? listGeminiSessions(gitRoot) : Promise.resolve([])
  ]);
  const all = results.flat();
  all.sort((a, b) => {
    if (!a.updated_at)
      return 1;
    if (!b.updated_at)
      return -1;
    return b.updated_at.localeCompare(a.updated_at);
  });
  return all;
}
async function computeSessionStats(sessionId, source) {
  const { computeCopilotSessionStats } = await import("./copilot-sessions-LLDNCHIU.js");
  const { computeClaudeSessionStats } = await import("./claude-sessions-5HEECZ63.js");
  const { computeGeminiSessionStats } = await import("./gemini-sessions-RPV25JO4.js");
  switch (source) {
    case "copilot":
      return computeCopilotSessionStats(sessionId);
    case "claude":
      return computeClaudeSessionStats(sessionId);
    case "gemini":
      return computeGeminiSessionStats(sessionId);
    default:
      return null;
  }
}

// ../../packages/core/dist/config.js
import { randomUUID } from "crypto";
import { homedir, hostname } from "os";
import path6 from "path";
import fs6 from "fs-extra";
var CONFIG_FILE = "config.json";
var ConfigService = class {
  async getLocalPath() {
    const dir = await getVemDir();
    return path6.join(dir, CONFIG_FILE);
  }
  getGlobalPath() {
    return path6.join(homedir(), ".vem", CONFIG_FILE);
  }
  async readLocalConfig() {
    try {
      const filePath = await this.getLocalPath();
      if (!await fs6.pathExists(filePath))
        return {};
      return fs6.readJson(filePath);
    } catch {
      return {};
    }
  }
  async readGlobalConfig() {
    try {
      const filePath = this.getGlobalPath();
      if (!await fs6.pathExists(filePath))
        return {};
      return fs6.readJson(filePath);
    } catch {
      return {};
    }
  }
  async writeLocalConfig(update) {
    const filePath = await this.getLocalPath();
    const current = await this.readLocalConfig();
    const next = { ...current, ...update };
    const clean = {
      last_version: next.last_version,
      project_id: next.project_id,
      project_org_id: next.project_org_id,
      linked_remote_name: next.linked_remote_name,
      linked_remote_url: next.linked_remote_url,
      last_push_git_hash: next.last_push_git_hash,
      last_push_vem_hash: next.last_push_vem_hash,
      last_synced_vem_hash: next.last_synced_vem_hash
    };
    await fs6.outputJson(filePath, clean, { spaces: 2 });
  }
  async writeGlobalConfig(update) {
    const filePath = this.getGlobalPath();
    const current = await this.readGlobalConfig();
    const next = { ...current, ...update };
    const clean = {
      api_key: next.api_key,
      device_id: next.device_id,
      device_name: next.device_name
    };
    await fs6.outputJson(filePath, clean, { spaces: 2 });
  }
  // --- Global Scoped ---
  async getApiKey() {
    const config = await this.readGlobalConfig();
    return config.api_key || process.env.VEM_API_KEY;
  }
  async getDeviceId() {
    const config = await this.readGlobalConfig();
    return config.device_id;
  }
  async getOrCreateDeviceId() {
    const config = await this.readGlobalConfig();
    if (config.device_id && config.device_name) {
      return { deviceId: config.device_id, deviceName: config.device_name };
    }
    let deviceId = config.device_id;
    if (!deviceId) {
      deviceId = randomUUID();
    }
    let deviceName = config.device_name;
    if (!deviceName) {
      deviceName = hostname();
    }
    await this.writeGlobalConfig({
      device_id: deviceId,
      device_name: deviceName
    });
    return { deviceId, deviceName };
  }
  async setApiKey(key) {
    await this.writeGlobalConfig({ api_key: key || void 0 });
  }
  // --- Local Scoped ---
  async getProjectId() {
    const config = await this.readLocalConfig();
    return config.project_id || process.env.VEM_PROJECT_ID;
  }
  async getProjectOrgId() {
    const config = await this.readLocalConfig();
    return config.project_org_id;
  }
  async getLinkedRemoteName() {
    const config = await this.readLocalConfig();
    return config.linked_remote_name;
  }
  async getLinkedRemoteUrl() {
    const config = await this.readLocalConfig();
    return config.linked_remote_url;
  }
  async getLastVersion() {
    const config = await this.readLocalConfig();
    return config.last_version;
  }
  async setLastVersion(version) {
    await this.writeLocalConfig({ last_version: version });
  }
  async getLastPushState() {
    const config = await this.readLocalConfig();
    return {
      gitHash: config.last_push_git_hash,
      vemHash: config.last_push_vem_hash
    };
  }
  async setLastPushState(state) {
    await this.writeLocalConfig({
      last_push_git_hash: state.gitHash,
      last_push_vem_hash: state.vemHash
    });
  }
  async getLastSyncedVemHash() {
    const config = await this.readLocalConfig();
    return config.last_synced_vem_hash;
  }
  async setLastSyncedVemHash(vemHash) {
    await this.writeLocalConfig({
      last_synced_vem_hash: vemHash || void 0
    });
  }
  async setProjectId(projectId) {
    await this.writeLocalConfig({ project_id: projectId || void 0 });
  }
  async setProjectOrgId(orgId) {
    await this.writeLocalConfig({ project_org_id: orgId || void 0 });
  }
  async setLinkedRemote(binding) {
    await this.writeLocalConfig({
      linked_remote_name: binding?.name || void 0,
      linked_remote_url: binding?.url || void 0
    });
  }
  // --- Context (Local) ---
  async getContextPath() {
    try {
      const dir = await getVemDir();
      return path6.join(dir, CONTEXT_FILE);
    } catch {
      return "";
    }
  }
  async getContext() {
    const filePath = await this.getContextPath();
    if (!filePath || !await fs6.pathExists(filePath)) {
      return "";
    }
    return fs6.readFile(filePath, "utf-8");
  }
  async updateContext(content) {
    const filePath = await this.getContextPath();
    if (!filePath)
      throw new Error("Cannot update context: Not in a git repository.");
    await fs6.writeFile(filePath, content, "utf-8");
  }
  async recordDecision(title, context, decision, relatedTasks) {
    const decisionsLog = new ScalableLogService(DECISIONS_DIR);
    let entry = `**Decision:** ${decision}

**Context:** ${context}`;
    if (relatedTasks && relatedTasks.length > 0) {
      entry = `**Related Tasks:** ${relatedTasks.join(", ")}

${entry}`;
    }
    const commitHash = await getGitHeadHash();
    await decisionsLog.addEntry(title, entry, { commitHash });
  }
};

// ../../packages/core/dist/diff.js
import { createHash } from "crypto";
import path7 from "path";
import fs7 from "fs-extra";

// ../../packages/core/dist/doctor.js
import path8 from "path";
import fs8 from "fs-extra";

// ../../packages/core/dist/env.js
import { z as z2 } from "zod";
var commonEnvSchema = {
  NODE_ENV: z2.enum(["development", "production", "test"]).default("development"),
  INTERNAL_API_SECRET: z2.string().min(1, "INTERNAL_API_SECRET is required"),
  DATABASE_URL: z2.string().url("DATABASE_URL must be a valid URL")
};

// ../../packages/core/dist/github-private-key.js
import { createPrivateKey } from "crypto";

// ../../packages/core/dist/logger.js
import pino from "pino";
var isDev = process.env.NODE_ENV === "development";
var logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // GCP Cloud Logging uses 'severity' instead of 'level'
  // We map pino levels to Google Cloud severity levels
  formatters: {
    level(label) {
      return { severity: label.toUpperCase() };
    }
  },
  // In development, we use pino-pretty for readability
  // In production, we want raw JSON for Cloud Logging
  transport: isDev ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard"
    }
  } : void 0,
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['x-api-key']",
      "*.password",
      "*.secret",
      "*.token"
    ],
    remove: true
  }
});

// ../../packages/core/dist/secrets.js
import { createHash as createHash2, timingSafeEqual } from "crypto";
var SECRET_PATTERNS = [
  {
    name: "private_key",
    regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/g,
    replace: "[REDACTED:private_key]"
  },
  {
    name: "aws_access_key",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    replace: "[REDACTED:aws_access_key]"
  },
  {
    name: "aws_secret_key",
    regex: /\b(aws_secret_access_key)\b\s*[:=]\s*([A-Za-z0-9/+=]{40})/gi,
    replace: (_match, key) => `${key}=[REDACTED:aws_secret_key]`
  },
  {
    name: "github_token",
    regex: /\bghp_[A-Za-z0-9]{36}\b/g,
    replace: "[REDACTED:github_token]"
  },
  {
    name: "github_pat",
    regex: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
    replace: "[REDACTED:github_pat]"
  },
  {
    name: "slack_token",
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    replace: "[REDACTED:slack_token]"
  }
];
function redactSecrets(input) {
  if (!input)
    return input;
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(output)) {
      if (typeof pattern.replace === "string") {
        output = output.replace(pattern.regex, pattern.replace);
      } else {
        output = output.replace(pattern.regex, pattern.replace);
      }
    }
    pattern.regex.lastIndex = 0;
  }
  return output;
}
function detectSecrets(input) {
  if (!input)
    return [];
  const matches = /* @__PURE__ */ new Set();
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(input)) {
      matches.add(pattern.name);
    }
    pattern.regex.lastIndex = 0;
  }
  return Array.from(matches);
}

// ../../packages/core/dist/sync.js
import { createHash as createHash3 } from "crypto";
import path9 from "path";
import fs9 from "fs-extra";
var KNOWN_AGENT_INSTRUCTION_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "CURSOR.md",
  "copilot-instructions.md",
  "COPILOT_INSTRUCTIONS.md",
  ".github/copilot-instructions.md"
];
var KNOWN_AGENT_INSTRUCTION_FILE_SET = new Set(KNOWN_AGENT_INSTRUCTION_FILES);
function normalizeInstructionPath(value) {
  if (typeof value !== "string")
    return null;
  const normalized = value.trim().replace(/\\/g, "/");
  if (!normalized)
    return null;
  const collapsed = path9.posix.normalize(normalized);
  if (collapsed === "." || collapsed === ".." || collapsed.startsWith("../") || collapsed.startsWith("/")) {
    return null;
  }
  return KNOWN_AGENT_INSTRUCTION_FILE_SET.has(collapsed) ? collapsed : null;
}
var DEFAULT_AGENT_PACK_OPTIONS = {
  contextMaxChars: 16e3,
  currentStateMaxChars: 8e3,
  decisionEntryLimit: 8,
  decisionMaxChars: 9e3,
  decisionEntryMaxChars: 1200,
  changelogEntryLimit: 12,
  changelogMaxChars: 12e3,
  changelogEntryMaxChars: 900,
  activeTaskLimit: 20,
  recentDoneTaskLimit: 5,
  taskTextMaxChars: 600,
  taskEvidenceLimit: 5,
  taskValidationLimit: 8
};
function truncateText(value, maxChars) {
  if (value.length <= maxChars)
    return value;
  return `${value.slice(0, Math.max(0, maxChars - 15)).trimEnd()}
...[truncated]`;
}
function normalizeTaskText(value, maxChars) {
  if (!value)
    return void 0;
  const normalized = value.trim();
  if (!normalized)
    return void 0;
  return truncateText(normalized, maxChars);
}
function sortByUpdatedAtDesc(tasks) {
  return [...tasks].sort((a, b) => (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? ""));
}
var SyncService = class {
  taskService = new TaskService();
  decisionsLog = new ScalableLogService(DECISIONS_DIR);
  changelogLog = new ScalableLogService(CHANGELOG_DIR);
  async getQueueDir() {
    const dir = await getVemDir();
    const queueDir = path9.join(dir, "queue");
    await fs9.ensureDir(queueDir);
    return queueDir;
  }
  async getContextPath() {
    const dir = await getVemDir();
    return path9.join(dir, CONTEXT_FILE);
  }
  async getCurrentStatePath() {
    const dir = await getVemDir();
    return path9.join(dir, CURRENT_STATE_FILE);
  }
  async collectAgentInstructionFiles() {
    const repoRoot = await getRepoRoot();
    const files = [];
    for (const relativePath of KNOWN_AGENT_INSTRUCTION_FILES) {
      const absolutePath = path9.join(repoRoot, relativePath);
      if (!await fs9.pathExists(absolutePath))
        continue;
      const stat = await fs9.stat(absolutePath);
      if (!stat.isFile())
        continue;
      const content = await fs9.readFile(absolutePath, "utf-8");
      files.push({ path: relativePath, content });
    }
    return files;
  }
  async unpackAgentInstructionFiles(entries) {
    if (!Array.isArray(entries) || entries.length === 0)
      return;
    const repoRoot = await getRepoRoot();
    const resolvedRoot = path9.resolve(repoRoot);
    for (const entry of entries) {
      const normalizedPath = normalizeInstructionPath(entry?.path);
      if (!normalizedPath)
        continue;
      if (typeof entry.content !== "string")
        continue;
      const destination = path9.resolve(repoRoot, normalizedPath);
      if (destination !== resolvedRoot && !destination.startsWith(`${resolvedRoot}${path9.sep}`)) {
        continue;
      }
      await fs9.ensureDir(path9.dirname(destination));
      await fs9.writeFile(destination, entry.content, "utf-8");
    }
  }
  async pack() {
    const tasks = await this.taskService.getTasks();
    const decisions = await this.decisionsLog.getMonolithicContentWithOptions({
      includeCommitHashes: true
    });
    const changelog = await this.changelogLog.getMonolithicContentWithOptions({
      includeCommitHashes: true
    });
    const secretMatches = [];
    const addSecretMatch = (path10, value) => {
      if (!value)
        return;
      const types = detectSecrets(value);
      if (types.length > 0) {
        secretMatches.push({ path: path10, types });
      }
    };
    const contextPath = await this.getContextPath();
    let context = "";
    if (await fs9.pathExists(contextPath)) {
      const raw = await fs9.readFile(contextPath, "utf-8");
      addSecretMatch(".vem/CONTEXT.md", raw);
      context = redactSecrets(raw);
    }
    const currentStatePath = await this.getCurrentStatePath();
    let currentState = "";
    if (await fs9.pathExists(currentStatePath)) {
      const raw = await fs9.readFile(currentStatePath, "utf-8");
      addSecretMatch(".vem/CURRENT_STATE.md", raw);
      currentState = redactSecrets(raw);
    }
    addSecretMatch(".vem/DECISIONS.md", decisions);
    addSecretMatch(".vem/CHANGELOG.md", changelog);
    const agentInstructions = await this.collectAgentInstructionFiles();
    const redactedAgentInstructions = agentInstructions.map((entry) => {
      addSecretMatch(entry.path, entry.content);
      return {
        path: entry.path,
        content: redactSecrets(entry.content)
      };
    });
    const redactedTasks = {
      tasks: tasks.map((task) => ({
        ...task,
        title: redactSecrets(task.title),
        description: task.description ? redactSecrets(task.description) : void 0,
        task_context: task.task_context ? redactSecrets(task.task_context) : void 0,
        task_context_summary: task.task_context_summary ? redactSecrets(task.task_context_summary) : void 0,
        evidence: task.evidence?.map((entry) => redactSecrets(entry))
      }))
    };
    for (const task of tasks) {
      const basePath = `.vem/tasks/objects/${task.id}.json`;
      addSecretMatch(`${basePath}#title`, task.title);
      if (task.description) {
        addSecretMatch(`${basePath}#description`, task.description);
      }
      if (task.task_context) {
        addSecretMatch(`${basePath}#task_context`, task.task_context);
      }
      if (task.task_context_summary) {
        addSecretMatch(`${basePath}#task_context_summary`, task.task_context_summary);
      }
      if (task.evidence) {
        task.evidence.forEach((entry, index) => {
          addSecretMatch(`${basePath}#evidence[${index}]`, entry);
        });
      }
    }
    return {
      tasks: redactedTasks,
      context,
      decisions: redactSecrets(decisions),
      changelog: redactSecrets(changelog),
      current_state: currentState,
      agent_instructions: redactedAgentInstructions,
      secret_scan_report: {
        scanned_at: (/* @__PURE__ */ new Date()).toISOString(),
        matches: secretMatches,
        total: secretMatches.length
      }
    };
  }
  async buildCompactLog(log, label, entryLimit, entryMaxChars, totalMaxChars) {
    const entries = await log.getAllEntries();
    if (entries.length === 0)
      return "";
    const selected = entries.slice(0, entryLimit);
    const blocks = selected.map((entry) => {
      const body = truncateText(entry.content.trim(), entryMaxChars);
      return `## ${entry.title}
**Date:** ${entry.created_at}

${body}`;
    });
    const header = `_Showing ${selected.length} of ${entries.length} ${label} entries._`;
    const combined = [header, ...blocks].join("\n\n---\n\n");
    return truncateText(combined, totalMaxChars);
  }
  buildCompactTaskList(tasks, options) {
    const visibleTasks = tasks.filter((task) => !task.deleted_at);
    const active = sortByUpdatedAtDesc(visibleTasks.filter((task) => task.status !== "done")).slice(0, options.activeTaskLimit);
    const recentDone = sortByUpdatedAtDesc(visibleTasks.filter((task) => task.status === "done")).slice(0, options.recentDoneTaskLimit);
    const selectedById = /* @__PURE__ */ new Map();
    for (const task of [...active, ...recentDone]) {
      selectedById.set(task.id, task);
    }
    return {
      tasks: Array.from(selectedById.values()).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        type: task.type,
        description: normalizeTaskText(task.description, options.taskTextMaxChars),
        task_context_summary: normalizeTaskText(task.task_context_summary, options.taskTextMaxChars),
        evidence: task.evidence?.slice(0, options.taskEvidenceLimit).map((entry) => truncateText(entry, options.taskTextMaxChars)),
        validation_steps: task.validation_steps?.slice(0, options.taskValidationLimit),
        depends_on: task.depends_on,
        blocked_by: task.blocked_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
        due_at: task.due_at
      }))
    };
  }
  async packForAgent(options = {}) {
    const merged = {
      ...DEFAULT_AGENT_PACK_OPTIONS,
      ...options
    };
    const full = await this.pack();
    const compactTasks = this.buildCompactTaskList(full.tasks.tasks, merged);
    const compactDecisions = await this.buildCompactLog(this.decisionsLog, "decision", merged.decisionEntryLimit, merged.decisionEntryMaxChars, merged.decisionMaxChars);
    const compactChangelog = await this.buildCompactLog(this.changelogLog, "changelog", merged.changelogEntryLimit, merged.changelogEntryMaxChars, merged.changelogMaxChars);
    return {
      ...full,
      tasks: compactTasks,
      context: truncateText(full.context, merged.contextMaxChars),
      current_state: truncateText(full.current_state, merged.currentStateMaxChars),
      decisions: compactDecisions,
      changelog: compactChangelog
    };
  }
  async unpack(payload) {
    const vemDir = await getVemDir();
    await fs9.ensureDir(vemDir);
    const { storage, index } = await this.taskService.init();
    const taskIds = await storage.listIds();
    for (const id of taskIds) {
      await storage.delete(id);
    }
    const newIndexEntries = [];
    for (const task of payload.tasks.tasks) {
      await storage.save(task);
      newIndexEntries.push({
        id: task.id,
        title: task.title,
        status: task.status,
        assignee: task.assignee,
        priority: task.priority,
        updated_at: task.updated_at
      });
    }
    await index.save(newIndexEntries);
    const contextPath = await this.getContextPath();
    await fs9.writeFile(contextPath, payload.context, "utf-8");
    if (payload.decisions) {
      await this.decisionsLog.addEntry("Imported from Sync", payload.decisions);
    }
    if (payload.changelog) {
      await this.changelogLog.addEntry("Imported from Sync", payload.changelog);
    }
    const currentStatePath = await this.getCurrentStatePath();
    await fs9.writeFile(currentStatePath, payload.current_state ?? "", "utf-8");
    await this.unpackAgentInstructionFiles(payload.agent_instructions);
  }
  async enqueue(payload) {
    const queueDir = await this.getQueueDir();
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.json`;
    const filePath = path9.join(queueDir, id);
    await fs9.writeJson(filePath, payload, { spaces: 2 });
    return id;
  }
  async getQueue() {
    const queueDir = await this.getQueueDir();
    const files = await fs9.readdir(queueDir);
    const queue = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const payload = await fs9.readJson(path9.join(queueDir, file));
          queue.push({ id: file, payload });
        } catch (error) {
          console.error(`Error reading queued snapshot ${file}:`, error);
        }
      }
    }
    return queue.sort((a, b) => a.id.localeCompare(b.id));
  }
  async removeFromQueue(id) {
    const queueDir = await this.getQueueDir();
    const filePath = path9.join(queueDir, id);
    if (await fs9.pathExists(filePath)) {
      await fs9.remove(filePath);
    }
  }
};

// ../../packages/core/dist/usage-metrics.js
import { join } from "path";
import fs10 from "fs-extra";
var UsageMetricsService = class _UsageMetricsService {
  metricsPath = null;
  baseDir;
  /**
   * Power score weights for various features
   */
  static POWER_SCORES = {
    agent: 30,
    strict_memory: 20,
    task_driven: 20,
    finalize: 15,
    search: 10,
    ask: 10,
    archive: 5
  };
  static DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1e3;
  static DEFAULT_SYNC_TIMEOUT_MS = 7e3;
  constructor(baseDir) {
    this.baseDir = baseDir;
    if (baseDir) {
      this.metricsPath = join(baseDir, ".usage-metrics.json");
    }
  }
  async getMetricsPath() {
    if (this.metricsPath) {
      return this.metricsPath;
    }
    const vemDir = await getVemDir();
    this.metricsPath = join(vemDir, ".usage-metrics.json");
    return this.metricsPath;
  }
  /**
   * Track a command execution
   */
  async trackCommand(command) {
    try {
      const data = await this.loadMetrics();
      data.commandCounts[command] = (data.commandCounts[command] || 0) + 1;
      if (command === "agent") {
        data.lastAgentRun = Date.now();
      } else if (command === "push") {
        data.lastPush = Date.now();
      }
      await this.saveMetrics(data);
    } catch (_error) {
    }
  }
  /**
   * Track a feature flag usage
   */
  async trackFeature(feature) {
    try {
      const data = await this.loadMetrics();
      data.featureFlags[feature] = true;
      await this.saveMetrics(data);
    } catch (_error) {
    }
  }
  /**
   * Check if a feature has been used
   */
  async hasUsedFeature(feature) {
    try {
      const data = await this.loadMetrics();
      return data.commandCounts[feature] > 0 || data.featureFlags[feature] === true;
    } catch (_error) {
      return false;
    }
  }
  /**
   * Get usage statistics including power score
   */
  async getStats() {
    try {
      const data = await this.loadMetrics();
      const powerScore = this.calculatePowerScore(data);
      const totalCommands = Object.values(data.commandCounts).reduce((sum, count) => sum + count, 0);
      return {
        commandCounts: data.commandCounts,
        featureFlags: data.featureFlags,
        lastAgentRun: data.lastAgentRun,
        lastPush: data.lastPush,
        powerScore,
        totalCommands
      };
    } catch (_error) {
      return {
        commandCounts: {},
        featureFlags: {},
        lastAgentRun: null,
        lastPush: null,
        powerScore: 0,
        totalCommands: 0
      };
    }
  }
  /**
   * Sync usage metrics to cloud API.
   * This is best-effort and should never throw.
   */
  async syncToCloud(options) {
    try {
      if (!this.isCloudSyncEnabled()) {
        return { synced: false, reason: "disabled_by_privacy" };
      }
      if (!options.apiUrl || !options.apiKey) {
        return { synced: false, reason: "missing_credentials" };
      }
      const data = await this.loadMetrics();
      const stats = await this.getStats();
      const signature = JSON.stringify({
        commandCounts: data.commandCounts,
        featureFlags: data.featureFlags,
        lastAgentRun: data.lastAgentRun,
        lastPush: data.lastPush
      });
      const now = Date.now();
      const minIntervalMs = options.minIntervalMs ?? _UsageMetricsService.DEFAULT_SYNC_INTERVAL_MS;
      if (!options.force) {
        if (data.lastSyncedAt && now - data.lastSyncedAt < minIntervalMs) {
          return { synced: false, reason: "throttled" };
        }
        if (data.lastSyncedSignature === signature) {
          return { synced: false, reason: "unchanged" };
        }
      }
      const apiUrl = options.apiUrl.replace(/\/+$/, "");
      const endpoint = `${apiUrl}/api/metrics/usage`;
      const timeoutMs = options.timeoutMs ?? _UsageMetricsService.DEFAULT_SYNC_TIMEOUT_MS;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const events = options.event && (options.event.command || options.event.featureFlag) ? [
        {
          command: options.event.command,
          feature_flag: options.event.featureFlag,
          metadata: options.event.metadata,
          timestamp: options.event.timestamp ?? now
        }
      ] : [];
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
          ...options.headers ?? {}
        },
        body: JSON.stringify({
          project_id: options.projectId,
          events,
          stats: {
            commandCounts: stats.commandCounts,
            featureFlags: stats.featureFlags,
            lastAgentRun: stats.lastAgentRun,
            lastPush: stats.lastPush,
            powerScore: stats.powerScore,
            totalCommands: stats.totalCommands
          }
        }),
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeout);
      });
      if (!response.ok) {
        return {
          synced: false,
          reason: `http_${response.status}`
        };
      }
      data.lastSyncedAt = now;
      data.lastSyncedSignature = signature;
      await this.saveMetrics(data);
      return { synced: true };
    } catch {
      return { synced: false, reason: "network_error" };
    }
  }
  /**
   * Calculate power score based on feature usage
   */
  calculatePowerScore(data) {
    let score = 0;
    for (const [command, count] of Object.entries(data.commandCounts)) {
      if (count > 0 && _UsageMetricsService.POWER_SCORES[command]) {
        score += _UsageMetricsService.POWER_SCORES[command];
      }
    }
    for (const [feature, enabled] of Object.entries(data.featureFlags)) {
      if (enabled && _UsageMetricsService.POWER_SCORES[feature]) {
        score += _UsageMetricsService.POWER_SCORES[feature];
      }
    }
    return score;
  }
  /**
   * Load metrics from disk
   */
  async loadMetrics() {
    try {
      const metricsPath = await this.getMetricsPath();
      if (await fs10.pathExists(metricsPath)) {
        const content = await fs10.readFile(metricsPath, "utf-8");
        return JSON.parse(content);
      }
    } catch (_error) {
    }
    return {
      commandCounts: {},
      featureFlags: {},
      lastAgentRun: null,
      lastPush: null,
      lastSyncedAt: null,
      lastSyncedSignature: null
    };
  }
  /**
   * Save metrics to disk
   */
  async saveMetrics(data) {
    const metricsPath = await this.getMetricsPath();
    await fs10.writeFile(metricsPath, JSON.stringify(data, null, 2), "utf-8");
  }
  isCloudSyncEnabled() {
    const disabled = (process.env.VEM_DISABLE_METRICS || "").toLowerCase();
    if (disabled === "1" || disabled === "true" || disabled === "yes") {
      return false;
    }
    const privacyMode = (process.env.VEM_PRIVACY_MODE || "").toLowerCase();
    if (privacyMode === "strict" || privacyMode === "local-only") {
      return false;
    }
    return true;
  }
};

// ../../packages/core/dist/webhook.js
import crypto2 from "crypto";
import dns from "dns";

// src/index.ts
var server = new Server(
  {
    name: "vem-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);
var taskService = new TaskService();
var configService = new ConfigService();
var syncService = new SyncService();
var metricsService = new UsageMetricsService();
var API_URL = process.env.VEM_API_URL || "http://localhost:3002";
async function trackHeartbeat(toolName, taskId) {
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
          command: `mcp:${toolName}`
        }
      }
    });
  } catch {
  }
}
function getGitHash() {
  try {
    return execSync2("git rev-parse HEAD").toString().trim() || null;
  } catch {
    return null;
  }
}
function getGitRemote() {
  try {
    return execSync2("git remote get-url origin").toString().trim() || null;
  } catch {
    return null;
  }
}
function getCommits(limit = 50) {
  try {
    const output = execSync2(
      `git log -n ${limit} --pretty=format:"%H|%an|%cI|%s"`
    ).toString();
    return output.split("\n").map((line) => {
      const [hash, author, date, ...msgParts] = line.split("|");
      return {
        hash,
        author_name: author,
        committed_at: date,
        message: msgParts.join("|")
      };
    }).filter((c) => c.hash && c.message);
  } catch {
    return [];
  }
}
async function isVemDirty() {
  try {
    const root = await getRepoRoot();
    const status = execSync2("git status --porcelain .vem", { cwd: root }).toString().trim();
    return status.length > 0;
  } catch {
    return false;
  }
}
async function computeVemHash() {
  try {
    const vemDir = await getVemDir();
    const hash = createHash4("sha256");
    const walk = async (currentDir) => {
      const entries = await readdir(currentDir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (entry.name === "queue") continue;
        const fullPath = join2(currentDir, entry.name);
        const relPath = relative(vemDir, fullPath).split("\\").join("/");
        if (relPath === "queue" || relPath.startsWith("queue/") || relPath === "config.json" || relPath === "current_context.md" || relPath === "task_context.md") {
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
function normalizeForSnapshotHash(value) {
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value))
    return value.map((entry) => normalizeForSnapshotHash(entry));
  if (value && typeof value === "object") {
    const record = value;
    const normalized = {};
    for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
      const next = normalizeForSnapshotHash(record[key]);
      if (next !== void 0) normalized[key] = next;
    }
    return normalized;
  }
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  return value;
}
function computeSnapshotHashFromPayload(snapshot) {
  const sortedTasks = Array.isArray(snapshot?.tasks?.tasks) ? [...snapshot.tasks.tasks].sort(
    (a, b) => String(a?.id || "").localeCompare(String(b?.id || ""))
  ) : [];
  const canonical = normalizeForSnapshotHash({
    tasks: { tasks: sortedTasks },
    context: snapshot?.context || "",
    decisions: snapshot?.decisions || "",
    changelog: snapshot?.changelog || "",
    current_state: snapshot?.current_state || ""
  });
  return createHash4("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
}
async function buildDeviceHeaders(cs) {
  const { deviceId, deviceName } = await cs.getOrCreateDeviceId();
  const projectOrgId = await cs.getProjectOrgId();
  return {
    "X-Vem-Device-Id": deviceId,
    "X-Vem-Device-Name": deviceName,
    "X-Vem-Client": "mcp-server",
    ...projectOrgId ? { "X-Org-Id": projectOrgId } : {}
  };
}
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_active_tasks",
        description: "Get list of VEM tasks from project memory. Use this to know what to do. Defaults to active tasks only.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["todo", "in-progress", "done", "all"],
              description: "Filter tasks by status. Default is to exclude done tasks."
            }
          }
        }
      },
      {
        name: "get_task_details",
        description: "Get detailed information about a specific task by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The TASK-XXX id" }
          },
          required: ["id"]
        }
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
              enum: ["low", "medium", "high", "critical"]
            },
            type: {
              type: "string",
              enum: ["feature", "bug", "chore"]
            },
            parent_id: {
              type: "string",
              description: "Optional parent task ID"
            },
            validation_steps: {
              type: "array",
              items: { type: "string" },
              description: "List of commands or steps to validate completion"
            },
            reasoning: {
              type: "string",
              description: "Reasoning for creating this task."
            }
          },
          required: ["title"]
        }
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
              description: "Proof of completion (file path, test command, etc)"
            },
            reasoning: {
              type: "string",
              description: "Why is this task considered done? Explain your reasoning."
            }
          },
          required: ["id", "evidence", "reasoning"]
        }
      },
      {
        name: "start_task",
        description: "Mark a task as in-progress and attach the current agent session to it. Call this when you start working on a task. Returns the full task object so you can get its context.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The TASK-XXX id to start"
            },
            session_id: {
              type: "string",
              description: "The current agent session ID"
            },
            source: {
              type: "string",
              enum: ["copilot", "claude", "gemini"],
              description: "Which AI tool is running (copilot | claude | gemini)"
            },
            session_summary: {
              type: "string",
              description: "Optional brief summary of what this session intends to do"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "get_context",
        description: "Read the project's CONTEXT.md and CURRENT_STATE.md. Always call this at the start of a session to load project context.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "list_decisions",
        description: "List architectural decisions recorded in VEM memory. Read these before making significant design choices to avoid conflicts.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of recent decisions to return (default: 20, max: 50)",
              default: 20
            }
          }
        }
      },
      {
        name: "update_current_state",
        description: "Update CURRENT_STATE.md with a summary of latest progress and next steps. Call this after completing meaningful work.",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The new content for CURRENT_STATE.md (replaces existing content)"
            }
          },
          required: ["content"]
        }
      },
      {
        name: "search_memory",
        description: "Semantic search over project memory (tasks, context, decisions).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (e.g. 'auth tasks', 'database schema')"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "ask_question",
        description: "Ask a natural language question about the project codebase and memory (commits, diffs, tasks).",
        inputSchema: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "The question to ask (e.g. 'How does authentication work?')"
            },
            path: {
              type: "string",
              description: "Optional file path to limit the scope of the search"
            }
          },
          required: ["question"]
        }
      },
      {
        name: "update_task",
        description: "Update a task's status, priority, or other fields. Use this to start working on a task, block it, or update its priority.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The TASK-XXX id"
            },
            status: {
              type: "string",
              enum: ["todo", "in-progress", "blocked"],
              description: "New status for the task. Use 'in-progress' to start working, 'blocked' to mark as blocked, 'todo' to unblock."
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "New priority for the task."
            },
            reasoning: {
              type: "string",
              description: "Explanation for the update. Required when blocking a task."
            },
            blocked_by: {
              type: "array",
              items: { type: "string" },
              description: "Task IDs that are blocking this task (when setting status to blocked)."
            },
            validation_steps: {
              type: "array",
              items: { type: "string" },
              description: "New list of validation steps (replaces existing)"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "add_decision",
        description: "Record an architectural decision in VEM memory. Use this when making significant technical choices (e.g., choosing libraries, changing architecture, setting patterns).",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Short decision title (e.g., 'Use Zod for validation')"
            },
            context: {
              type: "string",
              description: "Why this decision was needed - the problem or situation"
            },
            decision: {
              type: "string",
              description: "What was decided and key rationale"
            },
            related_tasks: {
              type: "array",
              items: { type: "string" },
              description: "Optional TASK-XXX references that motivated or implement this decision"
            }
          },
          required: ["title", "context", "decision"]
        }
      },
      {
        name: "get_changelog",
        description: "Get recent changelog entries from VEM memory. Use this to understand what work has been done recently.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of recent entries to return (default: 10, max: 50)",
              default: 10
            }
          }
        }
      },
      {
        name: "delete_task",
        description: "Soft delete a task from VEM memory.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The TASK-XXX id" },
            reasoning: { type: "string", description: "Reason for deletion" }
          },
          required: ["id"]
        }
      },
      {
        name: "apply_vem_update",
        description: "Apply a complete vem_update block containing current_state, context, changelog_append, decisions_append, and task updates.",
        inputSchema: {
          type: "object",
          properties: {
            current_state: { type: "string" },
            context: { type: "string" },
            changelog_append: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ]
            },
            decisions_append: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ]
            },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  status: { type: "string" },
                  reasoning: { type: "string" },
                  priority: { type: "string" }
                },
                required: ["id"]
              }
            }
          }
        }
      },
      {
        name: "sync_push",
        description: "Push local VEM snapshot to the cloud. Syncs tasks, context, decisions, and changelog to the remote project.",
        inputSchema: {
          type: "object",
          properties: {
            force: {
              type: "boolean",
              description: "Push even if no changes detected since last push."
            },
            dry_run: {
              type: "boolean",
              description: "Preview what would be pushed without actually pushing."
            }
          }
        }
      },
      {
        name: "sync_pull",
        description: "Pull the latest VEM snapshot from the cloud. Updates local tasks, context, decisions, and changelog.",
        inputSchema: {
          type: "object",
          properties: {
            force: {
              type: "boolean",
              description: "Overwrite local changes without warning."
            }
          }
        }
      },
      {
        name: "get_task_context",
        description: "Read a task's working context and summary. Use this to retrieve scratchpad notes for a specific task.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The TASK-XXX id"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "update_task_context",
        description: "Set, append to, or clear a task's working context. Use this to maintain scratchpad notes across sessions.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The TASK-XXX id"
            },
            operation: {
              type: "string",
              enum: ["set", "append", "clear"],
              description: "'set' replaces context, 'append' adds to it, 'clear' removes it."
            },
            text: {
              type: "string",
              description: "The text content. Required for 'set' and 'append' operations."
            }
          },
          required: ["id", "operation"]
        }
      },
      {
        name: "get_subtasks",
        description: "Get a parent task and all its subtasks. Use this to view the task hierarchy.",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: {
              type: "string",
              description: "The parent TASK-XXX id"
            }
          },
          required: ["parent_id"]
        }
      },
      {
        name: "list_agent_sessions",
        description: "List recent agent sessions for this repository from Copilot CLI, Claude CLI, and Gemini CLI. Call this at the start of a session to understand what previous sessions worked on and avoid duplicating effort.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of sessions to return (default: 10)"
            },
            branch: {
              type: "string",
              description: "Filter sessions by branch name"
            },
            sources: {
              type: "array",
              items: { type: "string", enum: ["copilot", "claude", "gemini"] },
              description: "Which tools to include (default: all three)"
            }
          }
        }
      },
      {
        name: "save_session_stats",
        description: "Save statistics for an agent session onto its task. Call this when finishing a task to record session duration, turns, tool calls, and model usage. Stats are computed from the agent's session files.",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "The TASK-XXX id to attach stats to"
            },
            session_id: {
              type: "string",
              description: "The agent session ID to compute stats for"
            },
            source: {
              type: "string",
              enum: ["copilot", "claude", "gemini"],
              description: "Which AI tool the session belongs to (default: copilot)"
            }
          },
          required: ["task_id", "session_id"]
        }
      }
    ]
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const taskId = args?.id || args?.taskId || process.env.VEM_ACTIVE_TASK;
  void trackHeartbeat(name, taskId);
  if (name === "get_active_tasks") {
    const tasks = await taskService.getTasks();
    const status = args?.status;
    let filtered = tasks;
    if (status === "all") {
    } else if (status === "done") {
      filtered = tasks.filter((t) => t.status === "done");
    } else if (status === "todo") {
      filtered = tasks.filter((t) => t.status === "todo");
    } else if (status === "in-progress") {
      filtered = tasks.filter((t) => t.status === "in-progress");
    } else {
      filtered = tasks.filter((t) => t.status !== "done");
    }
    const annotated = filtered.map((t) => {
      const sessions = t.sessions || [];
      if (sessions.length === 0) return t;
      const last = sessions[sessions.length - 1];
      const hint = last.summary ? `Last worked by ${last.source} on ${last.started_at.slice(0, 10)}: ${last.summary}` : `Last worked by ${last.source} on ${last.started_at.slice(0, 10)}`;
      return { ...t, _last_session_hint: hint };
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(annotated, null, 2)
        }
      ]
    };
  }
  if (name === "get_task_details") {
    const id = args?.id;
    if (!id) {
      return {
        isError: true,
        content: [{ type: "text", text: "Task ID is required." }]
      };
    }
    const task = await taskService.getTask(id);
    if (!task) {
      return {
        isError: true,
        content: [{ type: "text", text: `Task ${id} not found.` }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(task, null, 2) }]
    };
  }
  if (name === "add_task") {
    const title = args?.title;
    const description = args?.description || void 0;
    const priority = args?.priority || "medium";
    const reasoning = args?.reasoning || void 0;
    const type = args?.type || void 0;
    const parentId = args?.parent_id || void 0;
    const validationSteps = args?.validation_steps || void 0;
    const task = await taskService.addTask(
      title,
      description,
      priority,
      reasoning,
      {
        type,
        parent_id: parentId,
        validation_steps: validationSteps
      }
    );
    return {
      content: [
        { type: "text", text: `Task Added: ${task.id} (${task.title})` }
      ]
    };
  }
  if (name === "complete_task") {
    const id = args?.id;
    const evidence = String(args?.evidence || "").trim();
    const reasoning = String(args?.reasoning || "").trim();
    if (!evidence) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Evidence is required to complete a task."
          }
        ]
      };
    }
    if (!reasoning) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Reasoning is required to complete a task."
          }
        ]
      };
    }
    await taskService.updateTask(id, {
      status: "done",
      evidence: [evidence],
      reasoning
    });
    const vemDir = await getVemDir();
    await writeFile(join2(vemDir, "exit_signal"), "", "utf-8");
    return {
      content: [
        {
          type: "text",
          text: `Task ${id} marked as DONE. CLI will auto-close when the agent session ends.`
        }
      ]
    };
  }
  if (name === "start_task") {
    const id = args?.id;
    const sessionId = args?.session_id;
    const source = args?.source || "copilot";
    const sessionSummary = args?.session_summary;
    if (!id) {
      return {
        isError: true,
        content: [{ type: "text", text: "Task ID is required." }]
      };
    }
    const task = await taskService.getTask(id);
    if (!task) {
      return {
        isError: true,
        content: [{ type: "text", text: `Task ${id} not found.` }]
      };
    }
    const sessionRef = sessionId ? {
      id: sessionId,
      source,
      started_at: (/* @__PURE__ */ new Date()).toISOString(),
      ...sessionSummary ? { summary: sessionSummary } : {}
    } : null;
    const existingSessions = task.sessions || [];
    const patch = {
      status: "in-progress",
      reasoning: sessionSummary ? `Started by ${source} session: ${sessionSummary}` : `Started by ${source} agent`,
      sessions: sessionRef ? [...existingSessions, sessionRef] : existingSessions
    };
    if (!task.description && sessionSummary) {
      patch.description = sessionSummary;
    }
    await taskService.updateTask(id, patch);
    const updated = await taskService.getTask(id);
    return {
      content: [
        {
          type: "text",
          text: `Task ${id} is now IN PROGRESS.

${JSON.stringify(updated, null, 2)}`
        }
      ]
    };
  }
  if (name === "search_memory") {
    const query = args?.query;
    const apiKey = await configService.getApiKey();
    if (!apiKey) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Error: No API Key configured. Please run `vem login` in the CLI."
          }
        ]
      };
    }
    try {
      const { deviceId, deviceName } = await configService.getOrCreateDeviceId();
      const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
      const res = await fetch(
        `${apiUrl}/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Vem-Device-Id": deviceId,
            "X-Vem-Device-Name": deviceName
          }
        }
      );
      if (!res.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Search API Error: ${res.status} ${res.statusText}`
            }
          ]
        };
      }
      const data = await res.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.results || [], null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Search Request Failed: ${error.message}` }
        ]
      };
    }
  }
  if (name === "ask_question") {
    const question = args?.question;
    const path10 = args?.path;
    const apiKey = await configService.getApiKey();
    const projectId = await configService.getProjectId();
    if (!apiKey) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Error: No API Key configured. Please run `vem login` in the CLI."
          }
        ]
      };
    }
    if (!projectId) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Error: No project linked. Please run `vem link` in the CLI."
          }
        ]
      };
    }
    try {
      const { deviceId, deviceName } = await configService.getOrCreateDeviceId();
      const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
      const payload = { question };
      if (path10) payload.path = path10;
      const res = await fetch(`${apiUrl}/projects/${projectId}/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Vem-Device-Id": deviceId,
          "X-Vem-Device-Name": deviceName,
          "X-Vem-Client": "mcp-server"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Ask API Error: ${res.status} ${res.statusText}`
            }
          ]
        };
      }
      const data = await res.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Ask Request Failed: ${error.message}` }
        ]
      };
    }
  }
  if (name === "get_context") {
    const vemDir = await getVemDir();
    const context = await configService.getContext();
    let currentState = "";
    try {
      currentState = await readFile(join2(vemDir, CURRENT_STATE_FILE), "utf-8");
    } catch {
    }
    const parts = [];
    if (context) parts.push(`## CONTEXT.md

${context}`);
    if (currentState) parts.push(`## CURRENT_STATE.md

${currentState}`);
    return {
      content: [
        { type: "text", text: parts.join("\n\n---\n\n") || "(no context yet)" }
      ]
    };
  }
  if (name === "list_decisions") {
    const requestedLimit = args?.limit || 20;
    const limit = Math.min(Math.max(1, requestedLimit), 50);
    const decisionsService = new ScalableLogService(DECISIONS_DIR);
    const entries = await decisionsService.getAllEntries();
    const limitedEntries = entries.slice(0, limit);
    const formatted = limitedEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.created_at,
      content: entry.content
    }));
    return {
      content: [
        {
          type: "text",
          text: formatted.length > 0 ? JSON.stringify(formatted, null, 2) : "No decisions recorded yet."
        }
      ]
    };
  }
  if (name === "update_current_state") {
    const content = args?.content;
    if (!content) {
      return {
        isError: true,
        content: [{ type: "text", text: "Content is required." }]
      };
    }
    const vemDir = await getVemDir();
    await writeFile(join2(vemDir, CURRENT_STATE_FILE), content, "utf-8");
    return {
      content: [{ type: "text", text: "CURRENT_STATE.md updated." }]
    };
  }
  if (name === "update_task") {
    const id = args?.id;
    const status = args?.status;
    const priority = args?.priority;
    const reasoning = args?.reasoning;
    const blockedBy = args?.blocked_by;
    const validationSteps = args?.validation_steps;
    if (!id) {
      return {
        isError: true,
        content: [{ type: "text", text: "Task ID is required." }]
      };
    }
    const task = await taskService.getTask(id);
    if (!task) {
      return {
        isError: true,
        content: [{ type: "text", text: `Task ${id} not found.` }]
      };
    }
    if (status === "blocked" && !reasoning) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Reasoning is required when blocking a task."
          }
        ]
      };
    }
    if (task.status === "done" && status) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Cannot change status of a completed task. Use complete_task to mark as done."
          }
        ]
      };
    }
    const patch = {};
    if (status) patch.status = status;
    if (priority) patch.priority = priority;
    if (reasoning) patch.reasoning = reasoning;
    if (blockedBy) patch.blocked_by = blockedBy;
    if (validationSteps) patch.validation_steps = validationSteps;
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
          text: `Task ${id} updated.${statusMsg}${priorityMsg}`
        }
      ]
    };
  }
  if (name === "add_decision") {
    const title = args?.title;
    const context = args?.context;
    const decision = args?.decision;
    const relatedTasks = args?.related_tasks;
    if (!title || !context || !decision) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Title, context, and decision are required."
          }
        ]
      };
    }
    await configService.recordDecision(title, context, decision, relatedTasks);
    const taskInfo = relatedTasks && relatedTasks.length > 0 ? ` (related to: ${relatedTasks.join(", ")})` : "";
    return {
      content: [
        {
          type: "text",
          text: `Decision recorded: ${title}${taskInfo}`
        }
      ]
    };
  }
  if (name === "get_changelog") {
    const requestedLimit = args?.limit || 10;
    const limit = Math.min(Math.max(1, requestedLimit), 50);
    const changelogService = new ScalableLogService(CHANGELOG_DIR);
    const entries = await changelogService.getAllEntries();
    const limitedEntries = entries.slice(0, limit);
    const formatted = limitedEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.created_at,
      content: entry.content
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(formatted, null, 2)
        }
      ]
    };
  }
  if (name === "delete_task") {
    const id = args?.id;
    const reasoning = args?.reasoning;
    if (!id) {
      return {
        isError: true,
        content: [{ type: "text", text: "Task ID is required." }]
      };
    }
    await taskService.updateTask(id, {
      deleted_at: (/* @__PURE__ */ new Date()).toISOString(),
      reasoning
    });
    return {
      content: [{ type: "text", text: `Task ${id} soft deleted.` }]
    };
  }
  if (name === "apply_vem_update") {
    try {
      const update = args;
      const result = await applyVemUpdate(update);
      return {
        content: [
          {
            type: "text",
            text: `Successfully applied vem_update:
- Tasks updated: ${result.updatedTasks.length}
- New tasks: ${result.newTasks.length}
- Changelog lines: ${result.changelogLines.length}
- Decisions: ${result.decisionsAppended ? "Appended" : "No change"}
- Context: ${result.contextUpdated ? "Updated" : "No change"}
- State: ${result.currentStateUpdated ? "Updated" : "No change"}`
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to apply update: ${error.message}` }
        ]
      };
    }
  }
  if (name === "sync_push") {
    const force = args?.force;
    const dryRun = args?.dry_run;
    try {
      const projectId = await configService.getProjectId();
      if (!projectId) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: Project not linked. Run `vem link` in the CLI first."
            }
          ]
        };
      }
      const apiKey = await configService.getApiKey();
      if (!apiKey) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: No API Key configured. Run `vem login` in the CLI."
            }
          ]
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
              text: "Error: git HEAD not found. Create at least one commit before syncing snapshots."
            }
          ]
        };
      }
      const vemHash = await computeVemHash();
      const lastPush = await configService.getLastPushState();
      const hasChanges = !(vemHash && lastPush.gitHash === gitHash && lastPush.vemHash === vemHash);
      if (!hasChanges && !force) {
        return {
          content: [
            {
              type: "text",
              text: "No changes since last push (git HEAD and .vem unchanged). Use force=true to push anyway."
            }
          ]
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
              text: `Dry run preview:
- Project: ${projectId}
- Git hash: ${gitHash}
- Snapshot hash: ${snapshotHash}
- Base version: ${baseVersion || "none"}
- Tasks: ${taskCount}
- Context: ${snapshot.context ? "yes" : "no"}
- Current state: ${snapshot.current_state ? "yes" : "no"}

Verification remains pending until Git webhook linkage is confirmed.

No changes pushed. Remove dry_run to push for real.`
            }
          ]
        };
      }
      const repoUrl = getGitRemote();
      const commits = getCommits(50);
      const payload = {
        ...snapshot,
        ...repoUrl ? { repo_url: repoUrl } : {},
        base_version: baseVersion,
        commits,
        project_id: projectId,
        git_hash: gitHash,
        snapshot_hash: snapshotHash
      };
      const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
      const res = await fetch(`${apiUrl}/snapshots`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...await buildDeviceHeaders(configService)
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.version) {
          await configService.setLastVersion(json.version);
        }
        if (gitHash && vemHash) {
          await configService.setLastPushState({ gitHash, vemHash });
        }
        try {
          await taskService.archiveTasks({ status: "done" });
        } catch {
        }
        return {
          content: [
            {
              type: "text",
              text: `Snapshot pushed successfully. Version: ${json.version || "v1"}`
            }
          ]
        };
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        if (data.latest_version) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Conflict: local base version ${baseVersion || "none"} does not match latest ${data.latest_version}. Run sync_pull first, then retry.`
              }
            ]
          };
        }
        if (data.expected_repo_url) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Conflict: project is linked to ${data.expected_repo_url}, but local repo is ${repoUrl || "(no git remote)"}. Update git remote or re-link the project.`
              }
            ]
          };
        }
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Conflict: ${data.error || "Unknown conflict"}`
            }
          ]
        };
      }
      if (res.status === 403) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: data.error || "Device limit reached. Disconnect a device or upgrade your plan."
            }
          ]
        };
      }
      if (res.status === 404) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: data.error || "Project not found. It may have been deleted. Run `vem unlink` then `vem link` to reconnect."
            }
          ]
        };
      }
      await syncService.enqueue(payload);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Push failed (${data.error || res.statusText}). Snapshot queued for later retry.`
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Push failed: ${error.message}` }]
      };
    }
  }
  if (name === "sync_pull") {
    const force = args?.force;
    try {
      const apiKey = await configService.getApiKey();
      if (!apiKey) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: No API Key configured. Run `vem login` in the CLI."
            }
          ]
        };
      }
      if (await isVemDirty() && !force) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Local .vem has uncommitted changes. Use force=true to overwrite, or commit your changes first."
            }
          ]
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
              text: "Error: No git remote or linked project found. Run `vem link` in the CLI."
            }
          ]
        };
      }
      const apiUrl = process.env.VEM_API_URL || "http://localhost:3002";
      const query = new URLSearchParams();
      if (repoUrl) query.set("repo_url", repoUrl);
      if (projectId) query.set("project_id", projectId);
      const res = await fetch(`${apiUrl}/snapshots/latest?${query}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...await buildDeviceHeaders(configService)
        }
      });
      if (!res.ok) {
        if (res.status === 404) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Project not found. It may have been deleted."
              }
            ]
          };
        }
        if (res.status === 409) {
          const data2 = await res.json().catch(() => ({}));
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: data2.expected_repo_url ? `Repo URL mismatch. Expected ${data2.expected_repo_url}.` : data2.error || "Conflict detected."
              }
            ]
          };
        }
        if (res.status === 403) {
          const data2 = await res.json().catch(() => ({}));
          return {
            isError: true,
            content: [
              { type: "text", text: data2.error || "Device limit reached." }
            ]
          };
        }
        const err = await res.text();
        return {
          isError: true,
          content: [
            { type: "text", text: `Pull API Error: ${res.status} ${err}` }
          ]
        };
      }
      const data = await res.json();
      if (!data.snapshot) {
        return {
          content: [{ type: "text", text: "No snapshot data available." }]
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
            text: `Snapshot pulled and unpacked. Version: ${data.version || "unknown"}`
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Pull failed: ${error.message}` }]
      };
    }
  }
  if (name === "get_task_context") {
    const id = args?.id;
    if (!id) {
      return {
        isError: true,
        content: [{ type: "text", text: "Task ID is required." }]
      };
    }
    const task = await taskService.getTask(id);
    if (!task) {
      return {
        isError: true,
        content: [{ type: "text", text: `Task ${id} not found.` }]
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
              task_context_summary: task.task_context_summary || null
            },
            null,
            2
          )
        }
      ]
    };
  }
  if (name === "update_task_context") {
    const id = args?.id;
    const operation = args?.operation;
    const text = args?.text;
    if (!id) {
      return {
        isError: true,
        content: [{ type: "text", text: "Task ID is required." }]
      };
    }
    if (!operation || !["set", "append", "clear"].includes(operation)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Operation must be 'set', 'append', or 'clear'."
          }
        ]
      };
    }
    if ((operation === "set" || operation === "append") && !text) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Text is required for '${operation}' operation.`
          }
        ]
      };
    }
    const task = await taskService.getTask(id);
    if (!task) {
      return {
        isError: true,
        content: [{ type: "text", text: `Task ${id} not found.` }]
      };
    }
    let nextContext = task.task_context || "";
    if (operation === "clear") {
      nextContext = "";
    } else if (operation === "set") {
      nextContext = text;
    } else if (operation === "append") {
      nextContext = [nextContext, text].filter(Boolean).join("\n");
    }
    await taskService.updateTask(id, { task_context: nextContext });
    return {
      content: [
        { type: "text", text: `Task ${id} context updated (${operation}).` }
      ]
    };
  }
  if (name === "get_subtasks") {
    const parentId = args?.parent_id;
    if (!parentId) {
      return {
        isError: true,
        content: [{ type: "text", text: "Parent task ID is required." }]
      };
    }
    const allTasks = await taskService.getTasks();
    const parent = allTasks.find((t) => t.id === parentId);
    if (!parent) {
      return {
        isError: true,
        content: [{ type: "text", text: `Parent task ${parentId} not found.` }]
      };
    }
    const subtasks = allTasks.filter((t) => t.parent_id === parentId && !t.deleted_at).sort((a, b) => (a.subtask_order ?? 0) - (b.subtask_order ?? 0));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ parent, subtasks }, null, 2)
        }
      ]
    };
  }
  if (name === "list_agent_sessions") {
    const limit = typeof args?.limit === "number" ? args.limit : 10;
    const branch = typeof args?.branch === "string" ? args.branch : void 0;
    const rawSources = args?.sources;
    const sources = Array.isArray(rawSources) && rawSources.length > 0 ? rawSources : void 0;
    let gitRoot;
    try {
      gitRoot = await getRepoRoot();
    } catch {
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
              user_messages: s.user_messages.slice(0, 3)
            })),
            null,
            2
          )
        }
      ]
    };
  }
  if (name === "save_session_stats") {
    const taskId2 = args?.task_id;
    const sessionId = args?.session_id;
    const source = args?.source || "copilot";
    if (!taskId2 || !sessionId) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "task_id and session_id are required."
          }
        ]
      };
    }
    const task = await taskService.getTask(taskId2);
    if (!task) {
      return {
        isError: true,
        content: [{ type: "text", text: `Task ${taskId2} not found.` }]
      };
    }
    const stats = await computeSessionStats(sessionId, source);
    if (!stats) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Could not compute stats for ${source} session ${sessionId}. Session file may not exist or is unreadable.`
          }
        ]
      };
    }
    const existingSessions = (task.sessions || []).map((s) => {
      if (s.id === sessionId) {
        return { ...s, stats };
      }
      return s;
    });
    const hasMatch = existingSessions.some((s) => s.id === sessionId);
    if (!hasMatch) {
      existingSessions.push({
        id: sessionId,
        source,
        started_at: stats.ended_at ?? (/* @__PURE__ */ new Date()).toISOString(),
        stats
      });
    }
    await taskService.updateTask(taskId2, { sessions: existingSessions });
    return {
      content: [
        {
          type: "text",
          text: `Stats saved for session ${sessionId} on task ${taskId2}:
${JSON.stringify(stats, null, 2)}`
        }
      ]
    };
  }
  throw new Error(`Tool not found: ${name}`);
});
var transport = new StdioServerTransport();
var apiKeyFlagIndex = process.argv.indexOf("--api-key");
if (apiKeyFlagIndex !== -1 && process.argv[apiKeyFlagIndex + 1]) {
  const flagKey = process.argv[apiKeyFlagIndex + 1];
  await configService.setApiKey(flagKey);
}
await server.connect(transport);
//# sourceMappingURL=index.js.map