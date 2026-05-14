import Redis from "ioredis";
import { getEnv } from "./env";

let client: Redis | undefined;

export function getRedis() {
  const url = getEnv("REDIS_URL");
  if (!url) return undefined;
  if (client) return client;

  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false
  });

  return client;
}

