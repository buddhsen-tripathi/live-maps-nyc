"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LayerKind, Paint, PopupConfig } from "@/lib/categories/types";
import {
  buildPopupModel,
  googleMapsUrl,
  renderPopupHTML,
} from "@/lib/categories/popup";

const NYC_CENTER: [number, number] = [-73.9857, 40.7484];
const STYLE_URLS = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/positron",
} as const;

export type ActiveLayer = {
  id: string;
  name: string;
  kind: LayerKind;
  paint: Paint;
  cluster: boolean;
  options: Record<string, string | boolean>;
  popup?: PopupConfig;
  /** Auto-refresh interval in seconds (0 = no refresh) */
  refresh: number;
  /** Tween point positions between refreshes (per-feature ID for matching) */
  tween?: { idKey: string; durationMs?: number };
};

type Tween = {
  fromById: Map<string, [number, number]>;
  toById: Map<string, [number, number]>;
  propsById: Map<string, GeoJSON.GeoJsonProperties>;
  startedAt: number;
  durationMs: number;
};

type LayerState = {
  optionsKey: string;
  abort: AbortController;
  interactiveLayerIds: string[];
  layer: ActiveLayer;
  refreshTimer?: ReturnType<typeof setInterval>;
  tween?: Tween;
  rafId?: number;
};

export type MapHandle = {
  flyTo(opts: { center: [number, number]; zoom?: number }): void;
  fitBounds(
    bounds: [[number, number], [number, number]],
    opts?: { padding?: number },
  ): void;
};

export const MapView = forwardRef<
  MapHandle,
  { layers: ActiveLayer[]; theme?: "light" | "dark" }
>(function MapView({ layers, theme = "dark" }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const mapReadyRef = useRef(false);
  const stateRef = useRef<Map<string, LayerState>>(new Map());
  const interactiveRef = useRef<Map<string, ActiveLayer>>(new Map());
  const pendingRef = useRef<ActiveLayer[] | null>(null);
  const layersRef = useRef<ActiveLayer[]>(layers);
  layersRef.current = layers;
  const currentThemeRef = useRef<"light" | "dark">(theme);
  const pendingThemeRef = useRef<"light" | "dark" | null>(null);

  // Mount map + global hover handlers (registered once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Read the actual theme from the DOM (the inline script in layout.tsx sets
    // it from localStorage before paint). This avoids a flicker if React's
    // initial state lags behind the persisted preference.
    const initialTheme = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
    currentThemeRef.current = initialTheme;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URLS[initialTheme],
      center: NYC_CENTER,
      zoom: 11,
      minZoom: 9,
      maxZoom: 19,
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: { compact: true },
      fadeDuration: 200,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 8000 },
        trackUserLocation: false,
        showUserLocation: true,
        showAccuracyCircle: true,
      }),
      "bottom-right",
    );

    const hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      maxWidth: "320px",
      className: "nyc-popup",
    });
    const selectPopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 12,
      maxWidth: "320px",
      className: "nyc-popup nyc-popup-selected",
    });
    popupRef.current = hoverPopup;

    let hasSelection = false;
    selectPopup.on("close", () => {
      hasSelection = false;
    });

    map.on("mousemove", (e) => {
      if (hasSelection) return;
      const ids = Array.from(interactiveRef.current.keys());
      if (ids.length === 0) {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
        return;
      }
      const features = map.queryRenderedFeatures(e.point, { layers: ids });
      if (features.length === 0) {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
        return;
      }
      const f = features[0];
      const layerInfo = interactiveRef.current.get(f.layer.id);
      if (!layerInfo) return;
      map.getCanvas().style.cursor = "pointer";
      const model = buildPopupModel(f.properties, {
        name: layerInfo.name,
        popup: layerInfo.popup,
      });
      hoverPopup
        .setLngLat(e.lngLat)
        .setHTML(renderPopupHTML(model, layerInfo.paint.color))
        .addTo(map);
    });

    map.on("mouseout", () => {
      if (hasSelection) return;
      map.getCanvas().style.cursor = "";
      hoverPopup.remove();
    });

    map.on("click", (e) => {
      const ids = Array.from(interactiveRef.current.keys());
      const features = ids.length
        ? map.queryRenderedFeatures(e.point, { layers: ids })
        : [];
      if (features.length === 0) {
        // Click on empty map clears selection.
        if (hasSelection) selectPopup.remove();
        return;
      }
      const f = features[0];
      const layerInfo = interactiveRef.current.get(f.layer.id);
      if (!layerInfo) return;

      hoverPopup.remove();
      const model = buildPopupModel(f.properties, {
        name: layerInfo.name,
        popup: layerInfo.popup,
      });
      const html = renderPopupHTML(model, layerInfo.paint.color, {
        actions: [
          {
            href: googleMapsUrl(e.lngLat.lng, e.lngLat.lat),
            label: "Open in Google Maps",
          },
        ],
      });
      hasSelection = true;
      selectPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    });

    map.on("load", () => {
      mapReadyRef.current = true;

      // If theme changed while map was loading, apply the swap now.
      const pendingTheme = pendingThemeRef.current;
      pendingThemeRef.current = null;
      if (pendingTheme && pendingTheme !== currentThemeRef.current) {
        currentThemeRef.current = pendingTheme;
        map.setStyle(STYLE_URLS[pendingTheme]);
        map.once("styledata", () => {
          syncLayers(
            map,
            stateRef.current,
            interactiveRef.current,
            layersRef.current,
          );
        });
        return;
      }

      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) syncLayers(map, stateRef.current, interactiveRef.current, pending);
    });

    mapRef.current = map;

    return () => {
      mapReadyRef.current = false;
      hoverPopup.remove();
      selectPopup.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Expose imperative map controls for the agent
  useImperativeHandle(ref, () => ({
    flyTo({ center, zoom }) {
      mapRef.current?.flyTo({ center, zoom: zoom ?? 14, duration: 1500 });
    },
    fitBounds(bounds, opts) {
      mapRef.current?.fitBounds(bounds, { padding: opts?.padding ?? 50, duration: 1500 });
    },
  }));

  // Switch basemap style when theme changes. Style swap wipes our sources +
  // layers, so clear our state and let the layers prop re-sync after load.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Already showing this theme — nothing to do.
    if (currentThemeRef.current === theme) return;

    // Map not finished loading yet — defer the swap to the load handler.
    if (!mapReadyRef.current) {
      pendingThemeRef.current = theme;
      return;
    }

    currentThemeRef.current = theme;

    // Clear refresh timers and in-flight requests; new style starts blank.
    for (const entry of stateRef.current.values()) {
      entry.abort.abort();
      if (entry.refreshTimer) clearInterval(entry.refreshTimer);
      if (entry.rafId != null) cancelAnimationFrame(entry.rafId);
    }
    stateRef.current.clear();
    interactiveRef.current.clear();
    mapReadyRef.current = false;

    map.setStyle(STYLE_URLS[theme]);
    map.once("styledata", () => {
      mapReadyRef.current = true;
      syncLayers(map, stateRef.current, interactiveRef.current, layersRef.current);
    });
  }, [theme]);

  // Sync layers when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!mapReadyRef.current) {
      pendingRef.current = layers;
      return;
    }
    syncLayers(map, stateRef.current, interactiveRef.current, layers);
  }, [layers]);

  return <div ref={containerRef} className="h-full w-full" />;
  },
);

function syncLayers(
  map: maplibregl.Map,
  state: Map<string, LayerState>,
  interactive: Map<string, ActiveLayer>,
  layers: ActiveLayer[],
) {
  const wantedIds = new Set(layers.map((l) => l.id));

  for (const id of Array.from(state.keys())) {
    if (!wantedIds.has(id)) {
      removeCategory(map, id, state, interactive);
    }
  }

  for (const layer of layers) {
    const optionsKey = JSON.stringify(layer.options);
    const existing = state.get(layer.id);
    if (existing && existing.optionsKey === optionsKey) continue;

    if (existing) removeCategory(map, layer.id, state, interactive);

    const abort = new AbortController();
    state.set(layer.id, {
      optionsKey,
      abort,
      interactiveLayerIds: [],
      layer,
    });

    const url = new URL(`/api/layer/${layer.id}`, window.location.origin);
    for (const [k, v] of Object.entries(layer.options)) {
      url.searchParams.set(k, String(v));
    }

    const loadData = () =>
      fetch(url, { signal: abort.signal })
        .then((r) => r.json())
        .then((body: { geojson: GeoJSON.FeatureCollection }) => {
          if (!map.getStyle()) return;
          const sid = sourceId(layer.id);
          const src = map.getSource(sid) as maplibregl.GeoJSONSource | undefined;
          if (src) {
            // Source already exists — update in place. If the layer opted into
            // tweening, animate point positions over time instead of snapping.
            const entry = state.get(layer.id);
            if (entry && layer.tween && layer.kind === "points") {
              startTween(src, body.geojson, layer, entry);
            } else {
              src.setData(body.geojson);
            }
          } else {
            const ids = addCategory(map, layer, body.geojson);
            const entry = state.get(layer.id);
            if (entry) {
              entry.interactiveLayerIds = ids;
              for (const lid of ids) interactive.set(lid, layer);
            }
          }
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          console.warn(`Failed to load layer ${layer.id}:`, err);
        });

    loadData();

    // Auto-refresh for live feeds (GTFS-RT, GBFS)
    if (layer.refresh > 0) {
      const entry = state.get(layer.id);
      if (entry) {
        entry.refreshTimer = setInterval(loadData, layer.refresh * 1000);
      }
    }
  }
}

function sourceId(catId: string) {
  return `cat:${catId}`;
}

function removeCategory(
  map: maplibregl.Map,
  id: string,
  state: Map<string, LayerState>,
  interactive: Map<string, ActiveLayer>,
) {
  const entry = state.get(id);
  if (entry) {
    entry.abort.abort();
    if (entry.refreshTimer) clearInterval(entry.refreshTimer);
    if (entry.rafId != null) cancelAnimationFrame(entry.rafId);
    for (const lid of entry.interactiveLayerIds) interactive.delete(lid);
  }
  const sid = sourceId(id);
  const layerIds = [
    `${sid}:fill`,
    `${sid}:fill-outline`,
    `${sid}:line`,
    `${sid}:point`,
    `${sid}:cluster`,
    `${sid}:cluster-count`,
  ];
  for (const lid of layerIds) {
    if (map.getLayer(lid)) map.removeLayer(lid);
  }
  if (map.getSource(sid)) map.removeSource(sid);
  state.delete(id);
}

/**
 * Adds source + layers for a category and returns the list of
 * layer ids that should be interactive (hover-able for popups).
 */
function addCategory(
  map: maplibregl.Map,
  layer: ActiveLayer,
  data: GeoJSON.FeatureCollection,
): string[] {
  const sid = sourceId(layer.id);
  if (map.getSource(sid)) return [];

  const cluster = layer.cluster && layer.kind === "points";
  const interactiveIds: string[] = [];

  map.addSource(sid, {
    type: "geojson",
    data,
    ...(cluster
      ? { cluster: true, clusterRadius: 40, clusterMaxZoom: 14 }
      : {}),
  });

  if (layer.kind === "polygons") {
    const fillId = `${sid}:fill`;
    map.addLayer({
      id: fillId,
      type: "fill",
      source: sid,
      paint: {
        "fill-color": layer.paint.color,
        "fill-opacity": layer.paint.opacity ?? 0.2,
      },
    });
    map.addLayer({
      id: `${sid}:fill-outline`,
      type: "line",
      source: sid,
      paint: {
        "line-color": layer.paint.color,
        "line-width": 0.8,
        "line-opacity": 0.6,
      },
    });
    interactiveIds.push(fillId);
  } else if (layer.kind === "lines") {
    const lineId = `${sid}:line`;
    map.addLayer({
      id: lineId,
      type: "line",
      source: sid,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": layer.paint.color,
        "line-width": layer.paint.width ?? 2,
        "line-opacity": layer.paint.opacity ?? 0.9,
      },
    });
    interactiveIds.push(lineId);
  } else {
    if (cluster) {
      map.addLayer({
        id: `${sid}:cluster`,
        type: "circle",
        source: sid,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": layer.paint.color,
          "circle-opacity": 0.45,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            8,
            50,
            12,
            500,
            18,
            5000,
            24,
          ],
          "circle-stroke-color": layer.paint.color,
          "circle-stroke-opacity": 0.9,
          "circle-stroke-width": 1,
        },
      });
      map.addLayer({
        id: `${sid}:cluster-count`,
        type: "symbol",
        source: sid,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 10,
        },
        paint: {
          "text-color": "#0a0a0a",
          "text-halo-color": layer.paint.color,
          "text-halo-width": 1,
        },
      });
    }
    const pointId = `${sid}:point`;
    map.addLayer({
      id: pointId,
      type: "circle",
      source: sid,
      filter: cluster ? ["!", ["has", "point_count"]] : ["all"],
      paint: {
        "circle-color": layer.paint.color,
        "circle-radius": layer.paint.radius ?? 3,
        "circle-stroke-color": layer.paint.haloColor ?? "#0a0a0a",
        "circle-stroke-width": 0.8,
        "circle-opacity": 0.9,
      },
    });
    interactiveIds.push(pointId);
  }

  return interactiveIds;
}

/**
 * Animate point positions from their previous spots to incoming spots over
 * `durationMs`. Mid-flight refresh: capture the currently-interpolated position
 * as the new starting point so movement stays smooth.
 */
function startTween(
  src: maplibregl.GeoJSONSource,
  next: GeoJSON.FeatureCollection,
  layer: ActiveLayer,
  entry: LayerState,
) {
  const idKey = layer.tween!.idKey;
  // Default to 90% of refresh interval so the animation completes just before
  // the next poll arrives. Cap at 30s so a long refresh doesn't drag forever.
  const durationMs =
    layer.tween!.durationMs ??
    Math.min((layer.refresh || 30) * 900, 30_000);

  const toById = new Map<string, [number, number]>();
  const propsById = new Map<string, GeoJSON.GeoJsonProperties>();
  for (const f of next.features) {
    if (!f.geometry || f.geometry.type !== "Point") continue;
    const id = f.properties?.[idKey];
    if (id == null) continue;
    toById.set(String(id), f.geometry.coordinates as [number, number]);
    propsById.set(String(id), f.properties);
  }

  // Build "from" map. Prefer current position from the in-flight tween if any;
  // otherwise snap (first frame).
  const prev = entry.tween;
  const now = performance.now();
  const fromById = new Map<string, [number, number]>();
  for (const id of toById.keys()) {
    if (prev) {
      const t = Math.min((now - prev.startedAt) / prev.durationMs, 1);
      const pf = prev.fromById.get(id);
      const pt = prev.toById.get(id);
      if (pf && pt) {
        fromById.set(id, [
          pf[0] + (pt[0] - pf[0]) * t,
          pf[1] + (pt[1] - pf[1]) * t,
        ]);
      } else if (pt) {
        fromById.set(id, pt);
      } else {
        fromById.set(id, toById.get(id)!); // new vehicle: snap
      }
    } else {
      fromById.set(id, toById.get(id)!); // first refresh after first load
    }
  }

  const tween: Tween = {
    fromById,
    toById,
    propsById,
    startedAt: now,
    durationMs,
  };
  entry.tween = tween;
  if (entry.rafId != null) cancelAnimationFrame(entry.rafId);

  const tick = () => {
    if (entry.tween !== tween) return; // superseded
    const t = Math.min((performance.now() - tween.startedAt) / tween.durationMs, 1);
    const features: GeoJSON.Feature[] = [];
    for (const [id, to] of tween.toById) {
      const from = tween.fromById.get(id) ?? to;
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            from[0] + (to[0] - from[0]) * t,
            from[1] + (to[1] - from[1]) * t,
          ],
        },
        properties: tween.propsById.get(id) ?? null,
      });
    }
    src.setData({ type: "FeatureCollection", features });
    if (t < 1) {
      entry.rafId = requestAnimationFrame(tick);
    } else {
      entry.rafId = undefined;
    }
  };
  entry.rafId = requestAnimationFrame(tick);
}
