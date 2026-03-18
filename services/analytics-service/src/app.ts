import express from "express";
import cors from "cors";

import routes from "./routes/analytics.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/analytics",routes);

app.get("/health",(req,res)=>{
 res.json({status:"analytics running"});
});

app.use(errorHandler);

export default app;