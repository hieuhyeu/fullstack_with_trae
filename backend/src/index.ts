import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { getRedis } from "./lib/redis";
import { getSupabaseAdminOptional, getSupabaseRlsClient } from "./lib/supabase";
import { openapi } from "./openapi";
import { requireAuth } from "./lib/auth";

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(",").map((s) => s.trim()) : true,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/dev-auth", (_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.supabase.com https://cdn.jsdelivr.net; img-src 'self' data: https:; frame-src https://accounts.google.com https://*.google.com;"
  );
  next();
});
app.use("/dev-auth", express.static(path.join(__dirname, "..", "public", "dev-auth")));

app.get("/dev-auth/config", async (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(501).json({
      success: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "SUPABASE_URL/SUPABASE_ANON_KEY missing" }
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { supabaseUrl, supabaseAnonKey }
  });
});

app.get("/openapi.json", async (_req, res) => {
  res.status(200).json(openapi);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.get("/v1/health", async (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});

app.get("/v1/redis/ping", async (_req, res) => {
  const redis = getRedis();
  if (!redis) {
    res.status(501).json({
      success: false,
      error: { code: "REDIS_NOT_CONFIGURED", message: "REDIS_URL is not set" }
    });
    return;
  }

  const pong = await redis.ping();
  res.status(200).json({ success: true, data: { pong } });
});

app.get("/v1/categories", async (_req, res) => {
  const supabaseAdmin = getSupabaseAdminOptional();
  if (!supabaseAdmin) {
    res.status(501).json({
      success: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase env is not set" }
    });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id,slug,name_vi,name_en,type,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }
  res.status(200).json({ success: true, data: data ?? [] });
});

app.get("/v1/products", async (req, res) => {
  const supabaseAdmin = getSupabaseAdminOptional();
  if (!supabaseAdmin) {
    res.status(501).json({
      success: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase env is not set" }
    });
    return;
  }

  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  let query = supabaseAdmin
    .from("products")
    .select("id,slug,name_vi,name_en,price,compare_at_price,status,is_featured,category_id")
    .eq("status", "active")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (q.length > 0) {
    query = query.textSearch("search_vector", q, { config: "simple", type: "websearch" });
  }

  const { data, error } = await query;
  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: data ?? [],
    meta: { limit, offset, q: q.length > 0 ? q : undefined }
  });
});

app.get("/v1/products/:slug", async (req, res) => {
  const supabaseAdmin = getSupabaseAdminOptional();
  if (!supabaseAdmin) {
    res.status(501).json({
      success: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase env is not set" }
    });
    return;
  }

  const slug = req.params.slug;
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id,slug,name_vi,name_en,description_vi,description_en,price,compare_at_price,status,is_featured,category_id,product_images(id,url,alt_text,sort_order),product_variants(id,sku,size,color,inventory(quantity,reserved_quantity))"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  if (!data) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Product not found" }
    });
    return;
  }

  res.status(200).json({ success: true, data });
});

app.get("/v1/auth/me", requireAuth, async (req, res) => {
  const supabaseAdmin = getSupabaseAdminOptional();
  if (!supabaseAdmin) {
    res.status(501).json({
      success: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase env is not set" }
    });
    return;
  }

  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,phone,avatar_url,role,is_active,email_verified,last_login_at,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  res.status(200).json({ success: true, data });
});

app.get("/v1/cart", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  const accessToken = req.auth?.accessToken;
  if (!userId || !accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const sb = getSupabaseRlsClient(accessToken);
  const { data, error } = await sb
    .from("cart_items")
    .select(
      "id,quantity,is_selected,product:products(id,slug,name_vi,price,product_images(url,sort_order)),variant:product_variants(id,sku,size,color,inventory(quantity,reserved_quantity))"
    )
    .order("created_at", { ascending: false });

  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  const items = (data ?? []).map((row: any) => {
    const product = row.product;
    const variant = row.variant;
    const inv = variant?.inventory;
    const available = typeof inv?.quantity === "number" && typeof inv?.reserved_quantity === "number"
      ? inv.quantity - inv.reserved_quantity
      : null;
    const thumbnailUrl = Array.isArray(product?.product_images)
      ? product.product_images
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null
      : null;
    const unitPrice = product?.price ?? 0;
    const qty = row.quantity ?? 1;
    const subtotal = unitPrice * qty;
    return {
      id: row.id,
      product: {
        id: product?.id,
        name_vi: product?.name_vi,
        slug: product?.slug,
        thumbnail_url: thumbnailUrl
      },
      variant: variant
        ? {
            id: variant.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku
          }
        : null,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
      is_available: available === null ? true : available >= qty,
      stock_quantity: available ?? null
    };
  });

  const itemCount = items.reduce((acc: number, i: any) => acc + (i.quantity ?? 0), 0);
  const subtotal = items.reduce((acc: number, i: any) => acc + (i.subtotal ?? 0), 0);

  res.status(200).json({
    success: true,
    data: {
      id: userId,
      items,
      item_count: itemCount,
      subtotal,
      discount_amount: 0,
      shipping_fee: 0,
      total: subtotal
    }
  });
});

app.post("/v1/cart/items", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  const accessToken = req.auth?.accessToken;
  if (!userId || !accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const productId = typeof req.body?.product_id === "string" ? req.body.product_id : "";
  const variantId = typeof req.body?.variant_id === "string" ? req.body.variant_id : "";
  const quantity = Number(req.body?.quantity ?? 1);

  if (!productId || !variantId || !Number.isFinite(quantity) || quantity < 1 || quantity > 10) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid product_id/variant_id/quantity" }
    });
    return;
  }

  const sb = getSupabaseRlsClient(accessToken);

  const { data: invRow, error: invErr } = await sb
    .from("inventory")
    .select("quantity,reserved_quantity")
    .eq("variant_id", variantId)
    .maybeSingle();

  if (invErr) {
    res.status(502).json({
      success: false,
      error: {
        code: invErr.code ?? "SUPABASE_ERROR",
        message: invErr.message,
        details: invErr.details,
        hint: invErr.hint
      }
    });
    return;
  }

  const available =
    invRow && typeof invRow.quantity === "number" && typeof invRow.reserved_quantity === "number"
      ? invRow.quantity - invRow.reserved_quantity
      : null;

  if (available !== null && available < quantity) {
    res.status(400).json({
      success: false,
      error: { code: "INSUFFICIENT_STOCK", message: "Insufficient stock" }
    });
    return;
  }

  const { data: existing, error: existErr } = await sb
    .from("cart_items")
    .select("id,quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existErr) {
    res.status(502).json({
      success: false,
      error: {
        code: existErr.code ?? "SUPABASE_ERROR",
        message: existErr.message,
        details: existErr.details,
        hint: existErr.hint
      }
    });
    return;
  }

  const nextQty = Math.min((existing?.quantity ?? 0) + quantity, 10);

  let itemId = existing?.id as string | undefined;
  if (itemId) {
    const { data: updated, error: updErr } = await sb
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", itemId)
      .select("id,product_id,variant_id,quantity")
      .single();

    if (updErr) {
      res.status(502).json({
        success: false,
        error: {
          code: updErr.code ?? "SUPABASE_ERROR",
          message: updErr.message,
          details: updErr.details,
          hint: updErr.hint
        }
      });
      return;
    }

    const { data: productRow } = await sb.from("products").select("price").eq("id", productId).maybeSingle();
    const unitPrice = Number(productRow?.price ?? 0);
    res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        product_id: updated.product_id,
        variant_id: updated.variant_id,
        quantity: updated.quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * updated.quantity
      },
      message: "Cart updated"
    });
    return;
  }

  const { data: inserted, error: insErr } = await sb
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, variant_id: variantId, quantity: nextQty })
    .select("id,product_id,variant_id,quantity")
    .single();

  if (insErr) {
    res.status(502).json({
      success: false,
      error: {
        code: insErr.code ?? "SUPABASE_ERROR",
        message: insErr.message,
        details: insErr.details,
        hint: insErr.hint
      }
    });
    return;
  }

  const { data: productRow } = await sb.from("products").select("price").eq("id", productId).maybeSingle();
  const unitPrice = Number(productRow?.price ?? 0);
  res.status(201).json({
    success: true,
    data: {
      id: inserted.id,
      product_id: inserted.product_id,
      variant_id: inserted.variant_id,
      quantity: inserted.quantity,
      unit_price: unitPrice,
      subtotal: unitPrice * inserted.quantity
    },
    message: "Product added to cart"
  });
});

app.put("/v1/cart/items/:item_id", requireAuth, async (req, res) => {
  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const itemId = req.params.item_id;
  const quantity = Number(req.body?.quantity ?? 1);
  if (!itemId || !Number.isFinite(quantity) || quantity < 1 || quantity > 10) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid item_id/quantity" }
    });
    return;
  }

  const sb = getSupabaseRlsClient(accessToken);

  const { data: item, error: itemErr } = await sb
    .from("cart_items")
    .select("id,product_id,variant_id")
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr) {
    res.status(502).json({
      success: false,
      error: {
        code: itemErr.code ?? "SUPABASE_ERROR",
        message: itemErr.message,
        details: itemErr.details,
        hint: itemErr.hint
      }
    });
    return;
  }

  if (!item) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Cart item not found" }
    });
    return;
  }

  const { data: invRow, error: invErr } = await sb
    .from("inventory")
    .select("quantity,reserved_quantity")
    .eq("variant_id", item.variant_id)
    .maybeSingle();

  if (invErr) {
    res.status(502).json({
      success: false,
      error: {
        code: invErr.code ?? "SUPABASE_ERROR",
        message: invErr.message,
        details: invErr.details,
        hint: invErr.hint
      }
    });
    return;
  }

  const available =
    invRow && typeof invRow.quantity === "number" && typeof invRow.reserved_quantity === "number"
      ? invRow.quantity - invRow.reserved_quantity
      : null;

  if (available !== null && available < quantity) {
    res.status(400).json({
      success: false,
      error: { code: "INSUFFICIENT_STOCK", message: "Insufficient stock" }
    });
    return;
  }

  const { data: updated, error: updErr } = await sb
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .select("id,quantity,product_id,variant_id")
    .single();

  if (updErr) {
    res.status(502).json({
      success: false,
      error: {
        code: updErr.code ?? "SUPABASE_ERROR",
        message: updErr.message,
        details: updErr.details,
        hint: updErr.hint
      }
    });
    return;
  }

  const { data: productRow } = await sb.from("products").select("price").eq("id", updated.product_id).maybeSingle();
  const unitPrice = Number(productRow?.price ?? 0);

  res.status(200).json({
    success: true,
    data: {
      id: updated.id,
      quantity: updated.quantity,
      unit_price: unitPrice,
      subtotal: unitPrice * updated.quantity
    },
    message: "Cart updated"
  });
});

app.delete("/v1/cart/items/:item_id", requireAuth, async (req, res) => {
  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const itemId = req.params.item_id;
  const sb = getSupabaseRlsClient(accessToken);
  const { error } = await sb.from("cart_items").delete().eq("id", itemId);
  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  res.status(200).json({ success: true, message: "Item removed" });
});

app.delete("/v1/cart", requireAuth, async (req, res) => {
  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const sb = getSupabaseRlsClient(accessToken);
  const { error } = await sb.from("cart_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  res.status(200).json({ success: true, message: "Cart cleared" });
});

async function releaseLock(redis: any, key: string, token: string) {
  const script =
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
  await redis.eval(script, 1, key, token);
}

async function acquireInventoryLocks(redis: any, variantIds: string[], ttlMs: number) {
  const uniq = Array.from(new Set(variantIds.filter(Boolean)));
  if (uniq.length === 0) return { token: "", keys: [] as string[] };

  const token = crypto.randomUUID();
  const keys: string[] = [];

  for (const variantId of uniq) {
    const key = `inventory:lock:${variantId}`;
    const ok = await redis.set(key, token, "PX", ttlMs, "NX");
    if (ok !== "OK") {
      for (const k of keys) await releaseLock(redis, k, token);
      return null;
    }
    keys.push(key);
  }

  return { token, keys };
}

app.post("/v1/orders", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  const accessToken = req.auth?.accessToken;
  if (!userId || !accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const shippingAddress = req.body?.shipping_address;
  if (!shippingAddress || typeof shippingAddress !== "object") {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid shipping_address" }
    });
    return;
  }

  const paymentMethod = typeof req.body?.payment_method === "string" ? req.body.payment_method : "cod";
  const shippingMethod = typeof req.body?.shipping_method === "string" ? req.body.shipping_method : "standard";
  const notes = typeof req.body?.notes === "string" ? req.body.notes : null;

  const sb = getSupabaseRlsClient(accessToken);

  const { data: cartRows, error: cartErr } = await sb
    .from("cart_items")
    .select("variant_id,is_selected")
    .eq("is_selected", true);

  if (cartErr) {
    res.status(502).json({
      success: false,
      error: {
        code: cartErr.code ?? "SUPABASE_ERROR",
        message: cartErr.message,
        details: cartErr.details,
        hint: cartErr.hint
      }
    });
    return;
  }

  const variantIds = (cartRows ?? [])
    .map((r: any) => (typeof r.variant_id === "string" ? r.variant_id : ""))
    .filter(Boolean);

  const redis = getRedis();
  let lock: { token: string; keys: string[] } | null = null;
  if (redis && variantIds.length > 0) {
    lock = await acquireInventoryLocks(redis, variantIds, 8000);
    if (!lock) {
      res.status(400).json({
        success: false,
        error: { code: "LOCK_FAILED", message: "Item out of stock (lock failed)" }
      });
      return;
    }
  }

  try {
    const { data: orderId, error: rpcErr } = await sb.rpc("create_order_from_cart", {
      p_user_id: userId,
      p_shipping_address: shippingAddress,
      p_payment_method: paymentMethod,
      p_shipping_method: shippingMethod,
      p_notes: notes
    });

    if (rpcErr) {
      res.status(400).json({
        success: false,
        error: {
          code: rpcErr.code ?? "CHECKOUT_FAILED",
          message: rpcErr.message,
          details: rpcErr.details,
          hint: rpcErr.hint
        }
      });
      return;
    }

    const { data: orderRow, error: orderErr } = await sb
      .from("orders")
      .select(
        "id,order_number,status,total_amount,payment_method,payment_status,shipping_address,shipping_method,created_at"
      )
      .eq("id", orderId as any)
      .single();

    if (orderErr) {
      res.status(502).json({
        success: false,
        error: {
          code: orderErr.code ?? "SUPABASE_ERROR",
          message: orderErr.message,
          details: orderErr.details,
          hint: orderErr.hint
        }
      });
      return;
    }

    const { data: items } = await sb
      .from("order_items")
      .select(
        "id,quantity,unit_price,subtotal,product:products(id,slug,name_vi,product_images(url,sort_order)),variant_snapshot"
      )
      .eq("order_id", orderRow.id);

    res.status(201).json({
      success: true,
      data: { ...orderRow, items: items ?? [] },
      message: "Order created successfully"
    });
  } finally {
    if (redis && lock?.keys?.length) {
      for (const k of lock.keys) await releaseLock(redis, k, lock.token);
    }
  }
});

app.get("/v1/orders", requireAuth, async (req, res) => {
  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const page = Math.max(Number(req.query.page ?? 1), 1);
  const perPage = Math.min(Math.max(Number(req.query.per_page ?? 10), 1), 50);
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const sb = getSupabaseRlsClient(accessToken);
  let query = sb
    .from("orders")
    .select("id,order_number,status,total_amount,created_at", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: orders, error, count } = await query;
  if (error) {
    res.status(502).json({
      success: false,
      error: {
        code: error.code ?? "SUPABASE_ERROR",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  const orderIds = (orders ?? []).map((o: any) => o.id);
  const itemAgg = new Map<string, { itemCount: number; thumb: string | null }>();

  if (orderIds.length > 0) {
    const { data: orderItems } = await sb
      .from("order_items")
      .select("order_id,quantity,product:products(product_images(url,sort_order))")
      .in("order_id", orderIds);

    (orderItems ?? []).forEach((oi: any) => {
      const orderId = oi.order_id;
      const prev = itemAgg.get(orderId) ?? { itemCount: 0, thumb: null };
      const nextCount = prev.itemCount + Number(oi.quantity ?? 0);
      let thumb = prev.thumb;
      const imgs = oi.product?.product_images;
      if (!thumb && Array.isArray(imgs) && imgs.length > 0) {
        thumb =
          imgs
            .slice()
            .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null;
      }
      itemAgg.set(orderId, { itemCount: nextCount, thumb });
    });
  }

  res.status(200).json({
    success: true,
    data: (orders ?? []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total_amount: o.total_amount,
      item_count: itemAgg.get(o.id)?.itemCount ?? 0,
      thumbnail_url: itemAgg.get(o.id)?.thumb ?? null,
      created_at: o.created_at
    })),
    meta: {
      page,
      per_page: perPage,
      total: count ?? 0,
      total_pages: count ? Math.ceil(count / perPage) : 0
    }
  });
});

app.get("/v1/orders/:order_id", requireAuth, async (req, res) => {
  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const orderId = req.params.order_id;
  const sb = getSupabaseRlsClient(accessToken);

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select(
      "id,order_number,status,subtotal,discount_amount,shipping_fee,total_amount,payment_method,payment_status,shipping_address,shipping_method,tracking_number,created_at,updated_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr) {
    res.status(502).json({
      success: false,
      error: {
        code: orderErr.code ?? "SUPABASE_ERROR",
        message: orderErr.message,
        details: orderErr.details,
        hint: orderErr.hint
      }
    });
    return;
  }

  if (!order) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Order not found" }
    });
    return;
  }

  const { data: items, error: itemsErr } = await sb
    .from("order_items")
    .select(
      "id,quantity,unit_price,subtotal,product:products(id,slug,name_vi,product_images(url,sort_order)),variant_snapshot"
    )
    .eq("order_id", orderId);

  if (itemsErr) {
    res.status(502).json({
      success: false,
      error: {
        code: itemsErr.code ?? "SUPABASE_ERROR",
        message: itemsErr.message,
        details: itemsErr.details,
        hint: itemsErr.hint
      }
    });
    return;
  }

  res.status(200).json({ success: true, data: { ...order, items: items ?? [] } });
});

app.put("/v1/orders/:order_id/cancel", requireAuth, async (req, res) => {
  const accessToken = req.auth?.accessToken;
  if (!accessToken) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" }
    });
    return;
  }

  const orderId = req.params.order_id;
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  if (!reason || reason.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "reason is required" }
    });
    return;
  }

  const sb = getSupabaseRlsClient(accessToken);
  const { error } = await sb.rpc("cancel_order", { p_order_id: orderId, p_reason: reason });
  if (error) {
    res.status(400).json({
      success: false,
      error: {
        code: error.code ?? "CANCEL_FAILED",
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    });
    return;
  }

  const { data: order } = await sb.from("orders").select("id,status").eq("id", orderId).maybeSingle();
  res.status(200).json({ success: true, data: order ?? { id: orderId, status: "cancelled" }, message: "Order cancelled successfully" });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Not Found" }
  });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message }
    });
  }
);

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, "0.0.0.0");

async function shutdown(signal: string) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  }

  server.close(() => {
    process.exit(signal === "SIGTERM" ? 0 : 1);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
