import express from "express";
import cors from "cors";

import hrRoutes from "./routes/hr.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

(BigInt.prototype as any).toJSON = function () {
 return Number(this);
};

app.use("/hr", hrRoutes);

app.get("/health",(req,res)=>{
 res.json({status:"HR service running"});
});

app.use(errorHandler);

export default app;