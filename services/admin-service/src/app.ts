import express from "express";
import cors from "cors";

import routes from "./routes/admin.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin",routes);

app.get("/health",(req,res)=>{
 res.json({status:"admin running"});
});

app.use(errorHandler);

export default app;