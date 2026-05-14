import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (url.includes("your_endpoint.upstash.io") || url.includes("YOUR_ENDPOINT.upstash.io")) return null;

  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true
    });

    client.on("error", () => {});
  }

  return client;
}
