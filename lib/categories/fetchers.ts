import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import type { CategoryDataset, LayerKind } from "./types";

export type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSON.Feature[];
};

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Fetch GeoJSON for a single underlying dataset, normalized per protocol.
 * Returns an empty FC on failure so one bad dataset never breaks a category.
 */
export async function fetchDataset(
  ds: CategoryDataset,
  options: Record<string, string | boolean>,
): Promise<FeatureCollection> {
  try {
    switch (ds.protocol) {
      case "socrata":
        return await fetchSocrata(ds, options);
      case "gbfs":
        return await fetchGbfs(ds);
      case "arcgis":
        return await fetchArcgis(ds);
      case "gtfs-rt":
        return await fetchGtfsRt(ds);
    }
  } catch (err) {
    console.warn(`fetchDataset failed:`, err);
    return EMPTY;
  }
}

async function fetchSocrata(
  ds: Extract<CategoryDataset, { protocol: "socrata" }>,
  options: Record<string, string | boolean>,
): Promise<FeatureCollection> {
  const url = new URL(`https://${ds.domain}/resource/${ds.id}.geojson`);
  if (ds.limit) url.searchParams.set("$limit", String(ds.limit));
  let where = ds.where;
  if (options.status === "all" && where?.includes("status=")) {
    where = undefined;
  }
  if (where) url.searchParams.set("$where", where);
  if (ds.select) url.searchParams.set("$select", ds.select);

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Socrata ${ds.id}: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as FeatureCollection;

  // Some Socrata datasets have lat/lng in properties but null geometry.
  // Synthesize Point geometry from known lat/lng property keys.
  for (const f of body.features) {
    if (f.geometry) continue;
    const p = f.properties;
    if (!p) continue;
    const lat = parseFloat(p.gis_latitude ?? p.latitude ?? p.lat);
    const lng = parseFloat(p.gis_longitude ?? p.longitude ?? p.lng ?? p.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      f.geometry = { type: "Point", coordinates: [lng, lat] };
    }
  }

  return body;
}

async function fetchGbfs(
  ds: Extract<CategoryDataset, { protocol: "gbfs" }>,
): Promise<FeatureCollection> {
  type GbfsStation = {
    station_id: string;
    name: string;
    lat: number;
    lon: number;
    capacity?: number;
  };
  type GbfsStatus = {
    station_id: string;
    num_bikes_available?: number;
    num_ebikes_available?: number;
    num_docks_available?: number;
    is_renting?: number | boolean;
    is_returning?: number | boolean;
    is_installed?: number | boolean;
    last_reported?: number;
  };
  type GbfsBody<T> = { data: { stations: T[] } };

  const res = await fetch(ds.url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`GBFS ${ds.url}: ${res.status}`);
  const body = (await res.json()) as GbfsBody<GbfsStation>;

  const statusById = new Map<string, GbfsStatus>();
  if (ds.statusUrl) {
    const sres = await fetch(ds.statusUrl, { next: { revalidate: 60 } });
    if (sres.ok) {
      const sbody = (await sres.json()) as GbfsBody<GbfsStatus>;
      for (const st of sbody.data.stations) {
        statusById.set(st.station_id, st);
      }
    }
  }

  return {
    type: "FeatureCollection",
    features: body.data.stations.map((s) => {
      const st = statusById.get(s.station_id);
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.lon, s.lat] },
        properties: {
          name: s.name,
          capacity: s.capacity,
          ...(st && {
            num_bikes_available: st.num_bikes_available,
            num_ebikes_available: st.num_ebikes_available,
            num_docks_available: st.num_docks_available,
            is_renting: Boolean(st.is_renting),
            is_returning: Boolean(st.is_returning),
          }),
        },
      };
    }),
  };
}

async function fetchArcgis(
  ds: Extract<CategoryDataset, { protocol: "arcgis" }>,
): Promise<FeatureCollection> {
  const url = new URL(`${ds.url}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("f", "geojson");
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ArcGIS ${ds.url}: ${res.status}`);
  return (await res.json()) as FeatureCollection;
}

async function fetchGtfsRt(
  ds: Extract<CategoryDataset, { protocol: "gtfs-rt" }>,
): Promise<FeatureCollection> {
  const headers: Record<string, string> = {};
  if (ds.apiKeyHeader && ds.apiKeyEnv) {
    const key = process.env[ds.apiKeyEnv];
    if (key) headers[ds.apiKeyHeader] = key;
  }

  const allFeatures: GeoJSON.Feature[] = [];

  await Promise.all(
    ds.feedUrls.map(async (feedUrl) => {
      const res = await fetch(feedUrl, {
        headers,
        next: { revalidate: 30 },
      });
      if (!res.ok) {
        console.warn(`GTFS-RT ${feedUrl}: ${res.status}`);
        return;
      }
      const buffer = await res.arrayBuffer();
      const feed =
        GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
          new Uint8Array(buffer),
        );

      for (const entity of feed.entity) {
        if (ds.entity === "vehicle" && entity.vehicle) {
          const v = entity.vehicle;
          const pos = v.position;
          const lat = pos?.latitude;
          const lng = pos?.longitude;
          if (lat == null || lng == null) continue;
          allFeatures.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            properties: {
              route_id: v.trip?.routeId ?? null,
              trip_id: v.trip?.tripId ?? null,
              direction_id: v.trip?.directionId ?? null,
              stop_id: v.stopId ?? null,
              current_status:
                v.currentStatus != null
                  ? ["INCOMING_AT", "STOPPED_AT", "IN_TRANSIT_TO"][
                      v.currentStatus
                    ] ?? String(v.currentStatus)
                  : null,
              bearing: pos?.bearing ?? null,
              speed: pos?.speed ?? null,
              timestamp: v.timestamp
                ? Number(v.timestamp)
                : null,
            },
          });
        }
      }
    }),
  );

  return { type: "FeatureCollection", features: allFeatures };
}

/**
 * Filter features to a target geometry kind. A category may legitimately
 * pull mixed geometry datasets; the map renders one kind per category layer.
 */
export function filterByKind(
  fc: FeatureCollection,
  kind: LayerKind,
): FeatureCollection {
  const wanted = ({
    points: ["Point", "MultiPoint"],
    lines: ["LineString", "MultiLineString"],
    polygons: ["Polygon", "MultiPolygon"],
  } as const)[kind];

  return {
    type: "FeatureCollection",
    features: fc.features.filter(
      (f) => f.geometry && wanted.includes(f.geometry.type as never),
    ),
  };
}

export function mergeCollections(
  collections: FeatureCollection[],
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collections.flatMap((c) => c.features),
  };
}
