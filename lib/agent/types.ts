import type { LayerKind, Paint } from "@/lib/categories/types";

// ── Map commands emitted by agent tools, consumed by Workspace ──

export type AddLayerCommand = {
  action: "addLayer";
  categoryId: string;
  options?: Record<string, string | boolean>;
};

export type RemoveLayerCommand = {
  action: "removeLayer";
  categoryId: string;
};

export type RemoveAllLayersCommand = {
  action: "removeAllLayers";
};

export type FlyToCommand = {
  action: "flyTo";
  center: [number, number]; // [lng, lat]
  zoom?: number;
};

export type FitBoundsCommand = {
  action: "fitBounds";
  bounds: [[number, number], [number, number]]; // [sw, ne]
};

export type MapCommand =
  | AddLayerCommand
  | RemoveLayerCommand
  | RemoveAllLayersCommand
  | FlyToCommand
  | FitBoundsCommand;

// ── Tool output shapes (used by frontend to detect map commands) ──

export type AddLayerOutput = {
  added: true;
  categoryId: string;
  name: string;
  kind: LayerKind;
};

export type RemoveLayerOutput = {
  removed: true;
  target: string; // categoryId or "all"
};

export type FlyToOutput = {
  center: [number, number];
  zoom: number;
  locationName: string;
};

export type SearchCategoriesOutput = Array<{
  id: string;
  name: string;
  theme: string;
  kind: LayerKind;
  description: string;
}>;

export type SearchCatalogOutput = {
  total: number;
  datasets: Array<{
    datasetId: string;
    name: string;
    description: string;
    hasGeometry: boolean;
  }>;
};

export type FetchDatasetDirectOutput = {
  datasetId: string;
  featureCount: number;
  sampleProperties: string[];
  geometryType: string | null;
};

export type SummarizeFeaturesOutput = {
  categoryId: string;
  total: number;
  groups?: Record<string, number>;
  sampleProperties?: string[];
};
