import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";

import { orderRouter } from "./routes/orders.js";
import { initQueue } from "./queue/index.js";
import { initDb } from "./db.js";

const fastify = Fastify({ logger: true });

// REGISTER WEBSOCKET BEFORE ROUTES
await fastify.register(fastifyWebsocket);
await fastify.register(orderRouter, { prefix: "/api/orders" });

await initDb();
await initQueue();

fastify.listen({ port: 3000, host: "0.0.0.0" });
