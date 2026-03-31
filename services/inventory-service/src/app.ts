import express from "express";
import cors from "cors";
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
import inventoryRoutes from "./routes/inventory.routes";
import { errorHandler } from "./middleware/error.middleware";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/inventory", inventoryRoutes);

app.get("/health",(req,res)=>{
 return res.json({status:"inventory service running"});
});

app.use(errorHandler);
export default app;
