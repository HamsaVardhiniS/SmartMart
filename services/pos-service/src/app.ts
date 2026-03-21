import express from "express";
import posRoutes from "./routes/pos.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(express.json());

app.use("/pos", posRoutes);

app.use(errorHandler);

export default app;