import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

type Authed = {
  userId: string;
  accessToken: string;
  email?: string;
  role?: "customer" | "admin";
};

declare global {
  namespace Express {
    interface Request {
      auth?: Authed;
    }
  }
}

function getBearer(req: Request) {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const [t, v] = raw.split(" ");
  if (t?.toLowerCase() !== "bearer" || !v) return null;
  return v.trim();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(501).json({
      success: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase env is not set" }
    });
    return;
  }

  const token = getBearer(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing bearer token" }
    });
    return;
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid token" }
    });
    return;
  }

  const userId = data.user.id;
  const email = data.user.email ?? undefined;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: p } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    req.auth = {
      userId,
      accessToken: token,
      email,
      role: (p?.role as Authed["role"]) ?? "customer"
    };
  } else {
    req.auth = { userId, accessToken: token, email, role: "customer" };
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  if (req.auth.role !== "admin") {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Admin role required" }
    });
    return;
  }

  next();
}
