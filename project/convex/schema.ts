import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { IncidentStatusValidator, IncidentTypeValidator } from "./incidents";

export default defineSchema({
  incidents: defineTable({
    user_id: v.string(),
    incident_type: IncidentTypeValidator,
    description: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    location_name: v.optional(v.string()),
    reporter_name: v.optional(v.string()),
    status: IncidentStatusValidator,
    created_at: v.number(), // timestamp
    updated_at: v.number(), // timestamp
  }).index("by_user", ["user_id"]), // optional index for lookups
});
