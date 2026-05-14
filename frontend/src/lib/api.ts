export type Product = {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  category_id: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number | null;
};

export type VariantInventory = {
  quantity: number;
  reserved_quantity: number;
};

export type ProductVariant = {
  id: string;
  sku: string | null;
  size: string;
  color: string;
  inventory: VariantInventory | null;
};

export type ProductDetail = Product & {
  description_vi: string | null;
  description_en: string | null;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
};

function baseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000/v1";
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function listProducts(params: { limit?: number; offset?: number; q?: string }) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.q) qs.set("q", params.q);
  const json = await getJson<{ success: boolean; data: Product[] }>(`/products?${qs.toString()}`);
  return json.data ?? [];
}

export async function getProduct(slug: string) {
  const json = await getJson<{ success: boolean; data: ProductDetail }>(`/products/${encodeURIComponent(slug)}`);
  return json.data;
}

