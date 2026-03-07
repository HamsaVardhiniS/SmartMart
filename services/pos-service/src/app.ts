import express from "express";
import posRoutes from "./routes/pos.routes";
import errorMiddleware from "./middleware/error.middleware";

const app = express();

app.use(express.json());

app.use("/pos", posRoutes);

app.use(errorMiddleware);

export default app;