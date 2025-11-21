import pkg from "ioredis";
const Redis = pkg.default;

const pub = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

export async function publishOrderEvent(orderId: string, payload: any) {
  await pub.publish(
    `order:${orderId}`,
    JSON.stringify({ orderId, ...payload })
  );
}
