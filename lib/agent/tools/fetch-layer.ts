import { tool } from "ai";
import { z } from "zod";
import { CATEGORIES_BY_ID } from "@/lib/categories/registry";

export const addMapLayer = tool({
  description:
    "Add a curated map layer to the interactive map. The layer will appear on " +
    "the user's map immediately. Use searchCategories first to find the category ID.",
  inputSchema: z.object({
    categoryId: z
      .string()
      .describe(
        "The category ID to add (from searchCategories results, e.g. 'bike-network')",
      ),
    options: z
      .record(z.string(), z.union([z.string(), z.boolean()]))
      .optional()
      .describe("Optional filter/toggle values for the category"),
    nearLng: z
      .number()
      .optional()
      .describe(
        "Optional longitude. If both nearLng and nearLat are set, the map only shows features within nearRadiusMeters of this point.",
      ),
    nearLat: z
      .number()
      .optional()
      .describe(
        "Optional latitude. Pair with nearLng to spatially filter the layer.",
      ),
    nearRadiusMeters: z
      .number()
      .optional()
      .describe(
        "Search radius in meters (default 800 ≈ a 10-minute walk). Only used when nearLng + nearLat are set.",
      ),
  }),
  execute: async ({ categoryId, options, nearLng, nearLat, nearRadiusMeters }) => {
    const cat = CATEGORIES_BY_ID.get(categoryId);
    if (!cat) {
      return { added: false, error: `Unknown category: ${categoryId}` };
    }

    const filter =
      nearLng != null && nearLat != null
        ? {
            center: [nearLng, nearLat] as [number, number],
            radiusMeters: nearRadiusMeters ?? 800,
          }
        : undefined;

    return {
      added: true,
      categoryId: cat.id,
      name: cat.name,
      kind: cat.kind,
      options: options ?? {},
      filter,
    };
  },
});
