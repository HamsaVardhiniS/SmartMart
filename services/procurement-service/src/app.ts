import express from "express";
import cors from "cors";
import morgan from "morgan";

import supplierRoutes from "./routes/supplier.routes";
import purchaseRoutes from "./routes/purchase.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: process.env.SERVICE_NAME || "procurement-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((req, res, next) => {
  const oldJson = res.json;

  res.json = function (data) {
    const serialized = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return oldJson.call(this, serialized);
  };

  next();
});

app.use("/suppliers", supplierRoutes);
app.use("/procurement", purchaseRoutes);
app.use(errorHandler);

export default app;