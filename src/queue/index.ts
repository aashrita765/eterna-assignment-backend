import { Queue, Worker } from "bullmq";
import { MockDexRouter } from "../services/mockDexRouter.js";
import { persistOrderStatus } from "../db.js";
import { publishOrderEvent } from "../pubsub.js";

import pkg from "ioredis";
const Redis = pkg.default;

// Shared Redis connection for queue
const connection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

export const orderQueue = new Queue("orders", { connection });

export async function initQueue() {
  console.log("QUEUE: Starting worker...");

  // ▶ Only ONE Worker — correct place
  new Worker(
    "orders",

    async (job) => {
      const orderId = job.data.orderId;
      console.log("WORKER: job received", orderId);

      await new Promise(r => setTimeout(r, 1000));

      // pending
      await persistOrderStatus(orderId, "pending");
      await publishOrderEvent(orderId, { status: "pending" });

      await new Promise(r => setTimeout(r, 1000));

      // routing
      console.log("WORKER: routing...");
      const dex = new MockDexRouter();
      await publishOrderEvent(orderId, { status: "routing" });

      const [ray, met] = await Promise.all([
        dex.getRaydiumQuote(),
        dex.getMeteoraQuote(),
      ]);

      const chosen = ray.effective < met.effective ? ray : met;

      // building
      console.log("WORKER: building...");
      await publishOrderEvent(orderId, { status: "building" });
      await new Promise((r) => setTimeout(r, 1000));

      // submitted
      console.log("WORKER: submitted...");
      await publishOrderEvent(orderId, { status: "submitted" });
      await new Promise((r) => setTimeout(r, 1000));

      // confirm
      const result = await dex.executeSwap(chosen);
      console.log("WORKER: confirmed!");
      await persistOrderStatus(orderId, "confirmed", result);
      await publishOrderEvent(orderId, { status: "confirmed", ...result });

      return result;
    },

    {
      concurrency: 10,
      connection: new Redis({
        host: "127.0.0.1",
        port: 6379,
        maxRetriesPerRequest: null
      })
    }
  );

  console.log("WORKER READY");
}
