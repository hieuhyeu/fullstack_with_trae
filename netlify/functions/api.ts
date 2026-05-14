import type { Handler } from "@netlify/functions";
import { corsHeaders } from "./lib/cors";
import { json } from "./lib/http";

function normalizePath(rawPath: string) {
  const base = "/.netlify/functions/api";
  const p = rawPath.startsWith(base) ? rawPath.slice(base.length) : rawPath;
  return p.length === 0 ? "/" : p.startsWith("/") ? p : `/${p}`;
}

export const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const path = normalizePath(event.path);
  const origin = event.headers.origin ?? event.headers.Origin;
  const cors = corsHeaders(typeof origin === "string" ? origin : undefined);

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (method === "GET" && path === "/v1/health") {
    return json(
      200,
      {
        success: true,
        data: {
          status: "ok"
        }
      },
      cors
    );
  }

  return json(
    404,
    {
      success: false,
      error: { code: "NOT_FOUND", message: "Not Found" },
      status_code: 404
    },
    cors
  );
};

