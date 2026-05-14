import { getEnv } from "./env";

export function corsHeaders(reqOrigin?: string) {
  const allowed = getEnv("CORS_ORIGIN") ?? "*";
  const origin = allowed === "*" ? "*" : reqOrigin && reqOrigin === allowed ? allowed : allowed;

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-client-version,x-request-id,x-client-id",
    "access-control-max-age": "86400"
  };
}

