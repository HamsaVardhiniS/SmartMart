import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startConsumer } from "./events/redis.consumer";

const PORT = process.env.PORT || 4006;

startConsumer();

app.listen(PORT,()=>{
 console.log(`Admin Service running on ${PORT}`);
});