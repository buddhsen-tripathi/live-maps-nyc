import { tool, generateObject } from "ai";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { geocodeEvent } from "../geocode";

const apiKey = process.env.OPENROUTER_API_KEY;
const openrouter = apiKey ? createOpenRouter({ apiKey }) : null;

// Use a web-search-enabled model. The `:online` suffix tells OpenRouter to
// run a Google-backed web search before completion.
const ONLINE_MODEL = "google/gemini-2.5-flash:online";

const eventSchema = z.object({
  name: z.string().describe("Event name"),
  description: z
    .string()
    .optional()
    .describe("One-sentence description"),
  time: z
    .string()
    .optional()
    .describe("Date/time (e.g. 'Tonight 8pm', 'Sat 3pm')"),
  venue: z.string().optional().describe("Venue name"),
  neighborhood: z
    .string()
    .optional()
    .describe("NYC neighborhood (e.g. 'Williamsburg')"),
  borough: z
    .string()
    .optional()
    .describe("Borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)"),
  url: z
    .string()
    .optional()
    .describe("Direct event URL"),
  category: z
    .string()
    .optional()
    .describe(
      "Type: music, food, art, sports, family, free, nightlife, market, etc.",
    ),
});

export type AgentEvent = z.infer<typeof eventSchema>;

export const searchEvents = tool({
  description:
    "Search the live web for things happening in NYC (events, concerts, " +
    "festivals, exhibits, markets, etc.). Use whenever the user asks about " +
    "what's happening today, tonight, this weekend, or events in a " +
    "specific neighborhood. Returns up to 8 events with venue + URL.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "What events to look for. Examples: 'free concerts tonight', 'food festivals this weekend', 'art exhibits in Brooklyn', 'happening today'",
      ),
    when: z
      .string()
      .optional()
      .describe(
        "Time window: 'today', 'tonight', 'this weekend', 'next 7 days'",
      ),
    neighborhood: z
      .string()
      .optional()
      .describe("Specific NYC neighborhood or borough to filter by"),
  }),
  execute: async ({ query, when = "today", neighborhood }) => {
    if (!openrouter) {
      return { events: [], error: "OPENROUTER_API_KEY not configured" };
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    });

    const prompt = [
      `Find real NYC events happening ${when}${neighborhood ? ` in ${neighborhood}` : ""} matching: "${query}".`,
      `Today is ${today} (NYC time).`,
      `Return up to 8 events. Only include events you can verify from current web sources.`,
      `Skip duplicates. Prefer events with a public URL.`,
    ].join(" ");

    try {
      const { object } = await generateObject({
        model: openrouter(ONLINE_MODEL),
        schema: z.object({ events: z.array(eventSchema).max(8) }),
        prompt,
        temperature: 0.3,
      });

      // Geocode each event in parallel so the frontend can plot pins.
      // Events that fail to geocode are kept (still rendered as cards) but
      // won't appear on the map.
      const geocoded = await Promise.all(
        object.events.map(async (ev) => {
          const coords = await geocodeEvent({
            venue: ev.venue,
            neighborhood: ev.neighborhood,
            borough: ev.borough,
            name: ev.name,
          });
          return coords ? { ...ev, lat: coords.lat, lng: coords.lng } : ev;
        }),
      );

      const mappable = geocoded.filter(
        (e): e is AgentEvent & { lat: number; lng: number } =>
          typeof (e as { lat?: unknown }).lat === "number",
      );

      return {
        query,
        when,
        neighborhood: neighborhood ?? null,
        events: geocoded,
        count: geocoded.length,
        mappableCount: mappable.length,
      };
    } catch (err) {
      console.error("searchEvents failed:", err);
      return { events: [], error: "Could not fetch events right now" };
    }
  },
});
