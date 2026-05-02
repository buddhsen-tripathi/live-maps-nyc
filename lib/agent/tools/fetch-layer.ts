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
  }),
  execute: async ({ categoryId, options }) => {
    const cat = CATEGORIES_BY_ID.get(categoryId);
    if (!cat) {
      return { added: false, error: `Unknown category: ${categoryId}` };
    }

    return {
      added: true,
      categoryId: cat.id,
      name: cat.name,
      kind: cat.kind,
      options: options ?? {},
    };
  },
});
