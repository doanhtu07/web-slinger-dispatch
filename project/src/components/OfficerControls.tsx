import { useState } from "react";
import { supabase, Incident } from "../lib/supabase";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface OfficerControlsProps {
  incident: Incident;
  onUpdate: () => void;
}

export function OfficerControls({ incident, onUpdate }: OfficerControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: "active" | "responding" | "resolved") => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("incidents")
        .update({ status: newStatus })
        .eq("id", incident.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-sv-red-900/30">
      <p className="text-xs font-semibold text-sv-red-300 mb-2">
        Officer Controls
      </p>
      <div className="flex gap-2">
        {incident.status !== "responding" && (
          <button
            onClick={() => updateStatus("responding")}
            disabled={isUpdating}
            className="flex-1 px-3 py-1.5 bg-yellow-900/30 border border-yellow-600/50 text-yellow-200 rounded text-xs font-semibold hover:bg-yellow-900/50 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Respond
          </button>
        )}
        {incident.status !== "resolved" && (
          <button
            onClick={() => updateStatus("resolved")}
            disabled={isUpdating}
            className="flex-1 px-3 py-1.5 bg-green-900/30 border border-green-600/50 text-green-200 rounded text-xs font-semibold hover:bg-green-900/50 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Resolve
          </button>
        )}
      </div>
    </div>
  );
}
