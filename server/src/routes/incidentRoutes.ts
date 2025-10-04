import { Router } from "express";
import { createIncident } from "../controllers/incidentController";

const incidentRoutes = Router();

incidentRoutes.post("/", createIncident);

export { incidentRoutes };
