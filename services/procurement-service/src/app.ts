import express from "express";
import cors from "cors";
import morgan from "morgan";

import supplierRoutes from "./routes/supplier.routes";
import purchaseRoutes from "./routes/purchase.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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

export default app;