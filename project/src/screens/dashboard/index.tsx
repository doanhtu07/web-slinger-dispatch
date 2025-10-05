import { useMutation } from "convex/react";
import { LogoutButton } from "./components/LogoutButton";
import { api } from "../../../convex/_generated/api";

export function Dashboard() {
  const createIncident = useMutation(api.incidents.createIncident);

  return (
    <div className="flex flex-col gap-4">
      <p>Hello</p>

      <button
        onClick={() =>
          createIncident({
            incident_type: "CRIME",
            description: "Test crime",
            latitude: 0,
            longitude: 0,
            reporter_name: "Anh Tu Do",
          })
        }
      >
        Create Incident
      </button>

      <LogoutButton />
    </div>
  );
}
