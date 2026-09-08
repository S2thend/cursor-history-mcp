import type { LibraryConfig, Session } from "cursor-history";
import { z } from "zod";

export const readScopeShape = {
  workspace: z.string().min(1).optional(),
  includeCrossWorkspaceSources: z.boolean().optional(),
};

export const readScopeProperties = {
  workspace: {
    type: "string",
    description: "Workspace path. Reuse the same scope for listing and reading a session index.",
  },
  includeCrossWorkspaceSources: {
    type: "boolean",
    description: "Opt in to complementary sources outside this workspace, only for already selected session IDs. Default: false.",
    default: false,
  },
};

export const sessionSelectorShape = {
  sessionIndex: z.number().int().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  ...readScopeShape,
};

export function hasOneSelector(value: { sessionIndex?: number; sessionId?: string }): boolean {
  return (value.sessionIndex !== undefined) !== (value.sessionId !== undefined);
}

export const sessionSelectorProperties = {
  sessionIndex: { type: "integer", minimum: 1, description: "One-based index from a list with the same workspace scope. Prefer sessionId for reuse." },
  sessionId: { type: "string", minLength: 1, description: "Exact native session UUID returned by list/search. Case-sensitive; do not normalize." },
  ...readScopeProperties,
};

export const sessionSelectorAlternatives = [
  { required: ["sessionIndex"], not: { required: ["sessionId"] } },
  { required: ["sessionId"], not: { required: ["sessionIndex"] } },
];

export function readSelector(value: { sessionIndex?: number; sessionId?: string }): string | number {
  if (value.sessionId !== undefined) return value.sessionId;
  if (value.sessionIndex !== undefined) return value.sessionIndex - 1;
  throw new Error("Provide a session selector");
}

export function readConfig(value: { workspace?: string; includeCrossWorkspaceSources?: boolean }): LibraryConfig {
  return {
    workspace: value.workspace,
    includeCrossWorkspaceSources: value.includeCrossWorkspaceSources ?? false,
  };
}

export function sourceSummary(session: Session): string {
  const state = session.resolutionState ?? session.resolution?.state ??
    (session.source === "workspace-fallback" ? "partial" : "unknown");
  const detail = `Source: ${session.resolvedSource ?? session.source ?? "unknown"} · Data: ${state}`;
  return state === "partial"
    ? `${detail}\nPartial history: some content or sources are unavailable in this scope.`
    : detail;
}

export function formatTimestamp(value: string, source?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || source === "epoch-unknown") return "Unknown time";
  const approximate = !source || source === "unknown" || source.startsWith("inferred-") || source === "session-fallback";
  return `${approximate ? "≈ " : ""}${date.toLocaleString()} [${source ?? "unknown"}]`;
}
