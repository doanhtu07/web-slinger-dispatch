import { v } from "convex/values";
import { mutation } from "./_generated/server";

const IncidentType = {
  CRIME: "CRIME",
  FIRE: "FIRE",
  MEDICAL: "MEDICAL",
  OTHER: "OTHER",
} as const;

const IncidentStatus = {
  ACTIVE: "ACTIVE",
  RESPONDING: "RESPONDING",
  RESOLVED: "RESOLVED",
} as const;

type IncidentTypeValue = (typeof IncidentType)[keyof typeof IncidentType];
type IncidentStatusValue = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const IncidentTypeValidator = v.union(
  ...(Object.values(IncidentType) as IncidentTypeValue[]).map((t) => v.literal(t)),
);
export const IncidentStatusValidator = v.union(
  ...(Object.values(IncidentStatus) as IncidentStatusValue[]).map((s) => v.literal(s)),
);

export const createIncident = mutation({
  args: {
    incident_type: IncidentTypeValidator,
    description: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    location_name: v.optional(v.string()),
    reporter_name: v.optional(v.string()),
    status: v.optional(IncidentStatusValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new Error("createIncident - Unauthorized");
    }

    const incident = {
      user_id: user.tokenIdentifier,
      incident_type: args.incident_type,
      description: args.description,
      latitude: args.latitude,
      longitude: args.longitude,
      location_name: args.location_name,
      reporter_name: args.reporter_name,
      status: args.status ?? IncidentStatus.ACTIVE,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const id = await ctx.db.insert("incidents", incident);
    return { id, ...incident };
  },
});
