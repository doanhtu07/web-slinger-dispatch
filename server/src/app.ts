import express from "express";
import { incidentRoutes } from "./routes/incidentRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());

// Routes
app.use("/health", (req, res) => res.send("OK"));
app.use("/api/incident", incidentRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
