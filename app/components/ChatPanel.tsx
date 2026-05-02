"use client";

import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PaperPlaneTiltIcon,
  XIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { ChatMessage } from "./ChatMessage";
import type { MapCommand } from "@/lib/agent/types";

type Props = {
  onMapCommand: (cmd: MapCommand, toolCallId: string) => void;
  onClose: () => void;
};

const transport = new DefaultChatTransport({ api: "/api/agent" });

export function ChatPanel({ onMapCommand, onClose }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
    // Scroll to bottom after a tick
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[13px] font-semibold text-foreground">
          Map Assistant
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded p-0.5 text-muted transition-colors hover:text-foreground"
        >
          <XIcon size={16} weight="bold" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-muted">
            Ask me about NYC map data.
            <br />
            <span className="mt-2 block text-[11px] italic text-muted/60">
              &quot;Show bike lanes in Brooklyn&quot;
              <br />
              &quot;How many trees are in Park Slope?&quot;
              <br />
              &quot;Zoom to Times Square&quot;
            </span>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onMapCommand={onMapCommand}
          />
        ))}
        {isLoading && messages.at(-1)?.role === "user" && (
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-muted">
            <SpinnerGapIcon size={12} className="animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about NYC…"
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send"
          className="rounded p-1 text-accent transition-colors hover:text-accent/80 disabled:text-muted/30"
        >
          <PaperPlaneTiltIcon size={16} weight="fill" />
        </button>
      </form>
    </aside>
  );
}
