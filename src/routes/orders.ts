import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { orderQueue } from "../queue/index.js";
import { createOrderInDb } from "../db.js";

import pkg from "ioredis";
const Redis = pkg.default;

export const orderRouter: FastifyPluginAsync = async (fastify) => {
  const bodySchema = z.object({
    side: z.enum(["buy", "sell"]).default("buy"),
    tokenIn: z.string(),
    tokenOut: z.string(),
    amount: z.number(),
  });

  fastify.post("/execute", async (req, reply) => {
    const body = bodySchema.parse(req.body);

    const orderId = uuidv4();

    await createOrderInDb({
      orderId,
      payload: body,
      status: "queued",
    });

    await orderQueue.add(
      "execute-order",
      { orderId, ...body },
      { attempts: 3, backoff: { type: "exponential", delay: 500 } }
    );

    return reply.send({ orderId });
  });

  fastify.get("/ws", { websocket: true }, (connection, req) => {
    const ws = connection.socket;   // <----- THE ONLY CORRECT SOCKET
    const { orderId } = req.query as any;

    console.log("WS: New connection, orderId =", orderId);

    if (!orderId) {
      ws.send("orderId missing");
      ws.close();
      return;
    }

    const sub = new Redis({ maxRetriesPerRequest: null });

    sub.subscribe(`order:${orderId}`, (err, count) => {
      if (err) {
        console.error("WS: Subscribe failed →", err);
        ws.close();
        return;
      }
      console.log(`WS: Subscribed to order:${orderId} (${count}) channels`);
    });

    // Redis ----> WebSocket
    sub.on("message", (_ch, msg) => {
      console.log("WS: sending msg →", msg);
      ws.send(msg);
    });

    // Proper close handler
    connection.on("close", () => {
      console.log("WS: client disconnected");
      sub.disconnect();
    });
  });
};
