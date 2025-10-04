import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Incident = {
  id: string;
  user_id: string;
  incident_type: "crime" | "accident" | "fire" | "medical" | "other";
  description: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  status: "active" | "responding" | "resolved";
  reporter_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: "citizen" | "officer";
  badge_number: string | null;
  created_at: string;
  updated_at: string;
};
