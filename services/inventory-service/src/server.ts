import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startConsumer } from "./events/redis.consumer";

const PORT = process.env.PORT || 4002;

startConsumer();

app.listen(PORT, () => {
 console.log(`Inventory Service running on port ${PORT}`);
});