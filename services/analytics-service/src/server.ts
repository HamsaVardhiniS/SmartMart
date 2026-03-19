import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startConsumer } from "./events/redis.consumer";

const PORT = process.env.PORT || 4007;

startConsumer();

app.listen(PORT,()=>{
console.log(`Analytics Service running on ${PORT}`);
});

console.log("Ok");
