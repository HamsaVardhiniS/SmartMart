import express from "express";
import posRoutes from "./routes/pos.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: process.env.SERVICE_NAME || "pos-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});


app.use("/pos", posRoutes);

app.use(errorHandler);

export default app;