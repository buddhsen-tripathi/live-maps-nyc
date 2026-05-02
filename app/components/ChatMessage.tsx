"use client";

import type { UIMessage } from "ai";
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
    (p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-")))
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

  return (
    <div className={`px-3 py-2 ${isUser ? "" : "bg-surface-alt/40"}`}>
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {isUser ? "You" : "Assistant"}
      </div>
      <div className="space-y-1.5 text-[13px] leading-relaxed text-foreground">
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

  // Fire map commands from tool results
  if (isComplete && tool.output) {
    const result = tool.output as Record<string, unknown>;

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

  return (
    <div className="my-1 flex items-center gap-2 rounded border border-border/60 bg-surface/60 px-2 py-1.5 text-[11px] text-muted">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${isComplete ? "bg-emerald-400" : "animate-pulse bg-yellow-400"}`}
      />
      <span>{label}</span>
      {!isComplete && (
        <span className="text-[10px] italic text-muted/60">running…</span>
      )}
      {isComplete && tool.toolName === "addMapLayer" && (
        <span className="ml-auto text-accent">
          {String((tool.output as Record<string, unknown>)?.name ?? "")}
        </span>
      )}
      {isComplete && tool.toolName === "searchCategories" && Array.isArray(tool.output) && (
        <span className="ml-auto">{tool.output.length} found</span>
      )}
    </div>
  );
}

const TOOL_LABELS: Record<string, string> = {
  searchCategories: "Searching layers",
  searchCatalog: "Searching datasets",
  addMapLayer: "Adding layer",
  removeMapLayer: "Removing layer",
  flyToLocation: "Navigating",
  fetchDatasetDirect: "Fetching dataset",
  summarizeFeatures: "Analyzing data",
};
