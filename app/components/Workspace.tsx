"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  SidebarSimpleIcon,
  ChatCircleDotsIcon,
  ListBulletsIcon,
} from "@phosphor-icons/react";
import type {
  Category,
  CategoryOption,
  Theme,
} from "@/lib/categories/types";
import { CategoryPanel } from "./CategoryPanel";
import { MapView, type ActiveLayer, type MapHandle } from "./MapView";
import { ChatPanel } from "./ChatPanel";
import { SourcesButton } from "./SourcesButton";
import type { Source } from "@/lib/sources/types";
import type { MapCommand } from "@/lib/agent/types";
import { useTheme } from "@/lib/theme";

type ApiCategory = Category & { options: CategoryOption[] };
type CategoriesResponse = { themes: Theme[]; categories: ApiCategory[] };
type SourcesResponse = { sources: Source[] };

export type ActiveOptions = Record<string, string | boolean>;

const MOBILE_QUERY = "(max-width: 767px)";

function subscribeMobile(callback: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function Workspace() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [active, setActive] = useState<Record<string, ActiveOptions>>({});
  const [sidebarMode, setSidebarMode] = useState<"browse" | "chat">("browse");
  const mapHandleRef = useRef<MapHandle>(null);
  const appliedCommands = useRef(new Set<string>());
  const { theme: uiTheme, toggleTheme: toggleUiTheme } = useTheme();

  // True when viewport is below md. Server snapshot is false so SSR renders
  // desktop layout; on mount we re-render with the real value.
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    () => false,
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const sidebarOpen = override ?? !isMobile;
  const setSidebarOpen = (open: boolean) => setOverride(open);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json() as Promise<CategoriesResponse>)
      .then((d) => {
        setThemes(d.themes);
        setCategories(d.categories);
      });
    fetch("/api/sources")
      .then((r) => r.json() as Promise<SourcesResponse>)
      .then((d) => setSources(d.sources));
  }, []);

  const layers = useMemo<ActiveLayer[]>(() => {
    return Object.entries(active).map(([id, options]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        id,
        name: cat?.name ?? id,
        kind: cat?.kind ?? "points",
        paint: cat?.paint ?? { color: "#fff" },
        cluster: cat?.cluster ?? false,
        options,
        popup: cat?.popup,
        refresh: cat?.refresh ?? 0,
      };
    });
  }, [active, categories]);

  const toggleCategory = (id: string) => {
    setActive((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const cat = categories.find((c) => c.id === id);
      const defaults: ActiveOptions = {};
      cat?.options?.forEach((o) => {
        defaults[o.id] = o.default;
      });
      return { ...prev, [id]: defaults };
    });
  };

  const setOption = (
    catId: string,
    optionId: string,
    value: string | boolean,
  ) => {
    setActive((prev) =>
      prev[catId]
        ? { ...prev, [catId]: { ...prev[catId], [optionId]: value } }
        : prev,
    );
  };

  const handleMapCommand = useCallback(
    (cmd: MapCommand, toolCallId: string) => {
      // Deduplicate — tool outputs fire on every render
      if (appliedCommands.current.has(toolCallId)) return;
      appliedCommands.current.add(toolCallId);

      switch (cmd.action) {
        case "addLayer":
          setActive((prev) => {
            if (prev[cmd.categoryId]) return prev;
            const cat = categories.find((c) => c.id === cmd.categoryId);
            const defaults: ActiveOptions = {};
            cat?.options?.forEach((o) => {
              defaults[o.id] = o.default;
            });
            return {
              ...prev,
              [cmd.categoryId]: { ...defaults, ...cmd.options },
            };
          });
          break;
        case "removeLayer":
          setActive((prev) => {
            const next = { ...prev };
            delete next[cmd.categoryId];
            return next;
          });
          break;
        case "removeAllLayers":
          setActive({});
          break;
        case "flyTo":
          mapHandleRef.current?.flyTo({
            center: cmd.center,
            zoom: cmd.zoom,
          });
          break;
        case "fitBounds":
          mapHandleRef.current?.fitBounds(cmd.bounds);
          break;
      }
    },
    [categories],
  );

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      {sidebarOpen && (
        <>
          {/* Tap-to-dismiss backdrop, mobile only */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="fixed inset-0 z-20 bg-black/55 backdrop-blur-[2px] md:hidden"
          />
          {/* Drawer on mobile, in-flow on desktop */}
          <div className="fixed inset-y-0 left-0 z-30 md:relative md:z-auto">
            {sidebarMode === "browse" ? (
              <CategoryPanel
                themes={themes}
                categories={categories}
                active={active}
                onToggle={toggleCategory}
                onOption={setOption}
                onClose={() => setSidebarOpen(false)}
                uiTheme={uiTheme}
                onToggleUiTheme={toggleUiTheme}
              />
            ) : (
              <ChatPanel
                onMapCommand={handleMapCommand}
                onClose={() => setSidebarOpen(false)}
              />
            )}
          </div>
        </>
      )}
      <div className="relative flex-1">
        <MapView ref={mapHandleRef} layers={layers} theme={uiTheme} />
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="absolute left-3 top-3 z-10 flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface/95 px-2.5 text-[12px] font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:border-border-strong"
          >
            <SidebarSimpleIcon size={14} weight="bold" />
            <span>Maps</span>
          </button>
        )}
        {/* Browse / Chat mode toggle */}
        <button
          type="button"
          onClick={() => {
            setSidebarMode((m) => (m === "browse" ? "chat" : "browse"));
            setSidebarOpen(true);
          }}
          aria-label={
            sidebarMode === "browse" ? "Open chat" : "Open map browser"
          }
          className="absolute right-3 top-3 z-10 flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface/95 px-2.5 text-[12px] font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:border-border-strong"
        >
          {sidebarMode === "browse" ? (
            <>
              <ChatCircleDotsIcon size={14} weight="bold" />
              <span>Chat</span>
            </>
          ) : (
            <>
              <ListBulletsIcon size={14} weight="bold" />
              <span>Browse</span>
            </>
          )}
        </button>
        <SourcesButton sources={sources} />
      </div>
    </div>
  );
}
