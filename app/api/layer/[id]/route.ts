import { NextResponse } from "next/server";
import { CATEGORIES_BY_ID } from "@/lib/categories/registry";
import {
  fetchDataset,
  filterByKind,
  mergeCollections,
} from "@/lib/categories/fetchers";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const category = CATEGORIES_BY_ID.get(id);
  if (!category) {
    return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  }

  const url = new URL(req.url);
  const options: Record<string, string | boolean> = {};
  for (const [k, v] of url.searchParams.entries()) options[k] = v;

  const collections = await Promise.all(
    category.datasets.map((ds) => fetchDataset(ds, options)),
  );

  const merged = mergeCollections(collections);
  const filtered = filterByKind(merged, category.kind);

  const res = NextResponse.json({
    id: category.id,
    kind: category.kind,
    paint: category.paint,
    cluster: category.cluster ?? false,
    refresh: category.refresh ?? 0,
    geojson: filtered,
    count: filtered.features.length,
  });

  // Live feeds need short cache; static data cached aggressively.
  const isLive = category.datasets.some(
    (d) => d.protocol === "gbfs" || d.protocol === "gtfs-rt",
  );
  res.headers.set(
    "Cache-Control",
    isLive
      ? "public, max-age=30, stale-while-revalidate=120"
      : "public, max-age=3600, stale-while-revalidate=86400",
  );
  return res;
}
