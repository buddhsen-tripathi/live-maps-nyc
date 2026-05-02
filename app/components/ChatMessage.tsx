"use client";

import type { UIMessage } from "ai";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import type { MapCommand } from "@/lib/agent/types";

type Props = {
  message: UIMessage;
  onMapCommand: (cmd: MapCommand, toolCallId: string) => void;
};

/** Extract tool-like part fields from any part shape. */
function getToolInfo(part: UIMessage["parts"][number]): {
  toolName: string;
  toolCallId: string;
  state: string;
  output: unknown;
} | null {
  // Dynamic tool parts: { type: "dynamic-tool", toolName, toolCallId, state, ... }
  const p = part as Record<string, unknown>;
  if (
    typeof p.toolCallId === "string" &&
    (p.type === "dynamic-tool" ||
      (typeof p.type === "string" && p.type.startsWith("tool-")))
  ) {
    return {
      toolName:
        (p.toolName as string) ??
        (typeof p.type === "string" ? p.type.replace(/^tool-/, "") : ""),
      toolCallId: p.toolCallId as string,
      state: (p.state as string) ?? "pending",
      output: p.output,
    };
  }
  return null;
}

export function ChatMessage({ message, onMapCommand }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end px-1 py-1.5">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-[13px] leading-relaxed text-accent-foreground shadow-sm">
          {message.parts.map((part, i) =>
            part.type === "text" ? (
              <p key={i} className="whitespace-pre-wrap">
                {part.text}
              </p>
            ) : null,
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-2 px-1 py-1.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
        <SparkleIcon size={12} weight="fill" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-[13px] leading-relaxed text-foreground">
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className="whitespace-pre-wrap">
                {part.text}
              </p>
            );
          }

          const tool = getToolInfo(part);
          if (tool) {
            return (
              <ToolCard
                key={i}
                tool={tool}
                onMapCommand={onMapCommand}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  onMapCommand,
}: {
  tool: { toolName: string; toolCallId: string; state: string; output: unknown };
  onMapCommand: (cmd: MapCommand, toolCallId: string) => void;
}) {
  const isComplete = tool.state === "output-available";
  const result = (tool.output ?? {}) as Record<string, unknown>;

  // Fire map commands from tool results (idempotent on the parent side)
  if (isComplete && tool.output) {
    if (tool.toolName === "addMapLayer" && result.added) {
      onMapCommand(
        {
          action: "addLayer",
          categoryId: result.categoryId as string,
          options: (result.options as Record<string, string | boolean>) ?? {},
        },
        tool.toolCallId,
      );
    }

    if (tool.toolName === "removeMapLayer" && result.removed) {
      const target = result.target as string;
      if (target === "all") {
        onMapCommand({ action: "removeAllLayers" }, tool.toolCallId);
      } else {
        onMapCommand(
          { action: "removeLayer", categoryId: target },
          tool.toolCallId,
        );
      }
    }

    if (tool.toolName === "flyToLocation" && result.center) {
      onMapCommand(
        {
          action: "flyTo",
          center: result.center as [number, number],
          zoom: result.zoom as number,
        },
        tool.toolCallId,
      );
    }
  }

  const label = TOOL_LABELS[tool.toolName] ?? tool.toolName;
  const detail = describeTool(tool.toolName, result, isComplete);

  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11.5px] transition-colors",
        isComplete
          ? "border-border bg-card text-muted-foreground"
          : "border-accent/30 bg-accent/5 text-foreground",
      ].join(" ")}
    >
      {isComplete ? (
        <CheckCircleIcon
          size={13}
          weight="fill"
          className="shrink-0 text-success"
        />
      ) : (
        <CircleNotchIcon
          size={13}
          weight="bold"
          className="shrink-0 animate-spin text-accent"
        />
      )}
      <span className="font-medium">{label}</span>
      {detail && (
        <span className="ml-auto truncate text-[11px] text-muted-foreground">
          {detail}
        </span>
      )}
    </div>
  );
}

function describeTool(
  toolName: string,
  result: Record<string, unknown>,
  isComplete: boolean,
): string | null {
  if (!isComplete) return null;
  switch (toolName) {
    case "addMapLayer":
      return typeof result.name === "string" ? result.name : null;
    case "removeMapLayer":
      return typeof result.target === "string"
        ? result.target === "all"
          ? "all layers"
          : result.target
        : null;
    case "flyToLocation":
      return typeof result.locationName === "string"
        ? result.locationName
        : null;
    case "searchCategories":
      return Array.isArray(result) ? `${result.length} found` : null;
    case "searchCatalog":
      return Array.isArray((result as { datasets?: unknown[] }).datasets)
        ? `${(result as { datasets: unknown[] }).datasets.length} datasets`
        : null;
    default:
      return null;
  }
}

const TOOL_LABELS: Record<string, string> = {
  searchCategories: "Searching layers",
  searchCatalog: "Searching datasets",
  addMapLayer: "Added layer",
  removeMapLayer: "Removed layer",
  flyToLocation: "Flew to",
  fetchDatasetDirect: "Fetched dataset",
  summarizeFeatures: "Analyzed data",
};
