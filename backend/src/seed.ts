import "dotenv/config";
import { getSupabaseAdmin } from "./lib/supabase";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function imageUrl(prompt: string, imageSize: string) {
  const encoded = encodeURIComponent(prompt);
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encoded}&image_size=${imageSize}`;
}

type CategorySeed = {
  slug: string;
  name_vi: string;
  name_en: string;
  type: "shoes" | "apparel" | "accessories" | "collections";
  sort_order: number;
};

const categories: CategorySeed[] = [
  { slug: "giay", name_vi: "Giày", name_en: "Shoes", type: "shoes", sort_order: 1 },
  { slug: "ao", name_vi: "Áo", name_en: "Apparel", type: "apparel", sort_order: 2 },
  { slug: "phu-kien", name_vi: "Phụ kiện", name_en: "Accessories", type: "accessories", sort_order: 3 },
  {
    slug: "bo-suu-tap",
    name_vi: "Bộ sưu tập",
    name_en: "Collections",
    type: "collections",
    sort_order: 4
  }
];

function sizesForCategory(slug: string) {
  if (slug === "giay") return ["38", "39", "40", "41", "42", "43"];
  if (slug === "ao") return ["S", "M", "L", "XL"];
  return ["ONE"];
}

const colors = ["Black", "White", "Red"];

async function resetAll() {
  const supabase = getSupabaseAdmin();

  await supabase.from("inventory").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("product_variants")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase
    .from("product_images")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

async function main() {
  const supabase = getSupabaseAdmin();
  const reset = (process.env.SEED_RESET ?? "").toLowerCase() === "true";

  if (reset) {
    await resetAll();
  }

  const { data: insertedCategories, error: catErr } = await supabase
    .from("categories")
    .upsert(
      categories.map((c) => ({
        name_vi: c.name_vi,
        name_en: c.name_en,
        slug: c.slug,
        type: c.type,
        sort_order: c.sort_order,
        is_active: true
      })),
      { onConflict: "slug" }
    )
    .select("id,slug");

  if (catErr) throw catErr;
  if (!insertedCategories) throw new Error("Cannot read inserted categories");

  const categoryIdBySlug = new Map<string, string>(
    insertedCategories.map((c) => [c.slug as string, c.id as string])
  );

  const productCount = Number(process.env.SEED_PRODUCTS ?? 120);
  const products = Array.from({ length: productCount }).map((_, idx) => {
    const bucket = idx % 4;
    const catSlug = bucket === 0 ? "giay" : bucket === 1 ? "ao" : bucket === 2 ? "phu-kien" : "bo-suu-tap";
    const nameVi =
      catSlug === "giay"
        ? `Giày chạy bộ Alpha ${idx + 1}`
        : catSlug === "ao"
          ? `Áo thể thao Aero ${idx + 1}`
          : catSlug === "phu-kien"
            ? `Phụ kiện Flex ${idx + 1}`
            : `Bộ sưu tập Neo ${idx + 1}`;

    const nameEn =
      catSlug === "giay"
        ? `Alpha Runner ${idx + 1}`
        : catSlug === "ao"
          ? `Aero Active Tee ${idx + 1}`
          : catSlug === "phu-kien"
            ? `Flex Accessory ${idx + 1}`
            : `Neo Collection ${idx + 1}`;

    const slug = slugify(nameEn);
    const priceBase = catSlug === "giay" ? 1890000 : catSlug === "ao" ? 790000 : catSlug === "phu-kien" ? 390000 : 1290000;
    const price = priceBase + (idx % 9) * 50000;

    return {
      category_id: categoryIdBySlug.get(catSlug) ?? null,
      name_vi: nameVi,
      name_en: nameEn,
      slug,
      description_vi:
        "Sản phẩm mock để demo. Chất liệu bền, phù hợp luyện tập hằng ngày. Hình ảnh được tạo tự động (không dùng ảnh thương hiệu).",
      description_en:
        "Mock product for demo. Durable materials, suitable for everyday training. Images are generated automatically (no brand assets).",
      price,
      compare_at_price: price + 200000,
      status: "active",
      is_featured: idx % 10 === 0
    };
  });

  const { data: insertedProducts, error: prodErr } = await supabase
    .from("products")
    .upsert(products, { onConflict: "slug" })
    .select("id,slug");

  if (prodErr) throw prodErr;
  if (!insertedProducts) throw new Error("Cannot read inserted products");

  const images = insertedProducts.flatMap((p) => {
    const slug = p.slug as string;
    const id = p.id as string;
    const basePrompt = `realistic studio product photo, ${slug.replace(/-/g, " ")}, minimal background, soft shadow, no logo, ecommerce`;
    return [
      {
        product_id: id,
        url: imageUrl(basePrompt, "square_hd"),
        alt_text: `Ảnh sản phẩm ${slug}`,
        sort_order: 1
      },
      {
        product_id: id,
        url: imageUrl(`${basePrompt}, angle view`, "square_hd"),
        alt_text: `Ảnh góc nghiêng ${slug}`,
        sort_order: 2
      },
      {
        product_id: id,
        url: imageUrl(`${basePrompt}, close up texture`, "square_hd"),
        alt_text: `Ảnh chi tiết ${slug}`,
        sort_order: 3
      }
    ];
  });

  const imageChunks: typeof images[] = [];
  for (let i = 0; i < images.length; i += 500) imageChunks.push(images.slice(i, i + 500));

  for (const chunk of imageChunks) {
    const { error } = await supabase.from("product_images").insert(chunk);
    if (error) throw error;
  }

  const productBySlug = new Map<string, { id: string; catSlug: string }>();
  products.forEach((p, idx) => {
    const bucket = idx % 4;
    const catSlug = bucket === 0 ? "giay" : bucket === 1 ? "ao" : bucket === 2 ? "phu-kien" : "bo-suu-tap";
    productBySlug.set(p.slug, { id: "", catSlug });
  });

  insertedProducts.forEach((p) => {
    const rec = productBySlug.get(p.slug as string);
    if (rec) rec.id = p.id as string;
  });

  const variants = Array.from(productBySlug.entries()).flatMap(([slug, rec], productIdx) => {
    const sizes = sizesForCategory(rec.catSlug);
    return colors.flatMap((color) =>
      sizes.map((size) => ({
        product_id: rec.id,
        size,
        color,
        sku: `SKU-${productIdx + 1}-${color}-${size}`.replace(/[^A-Za-z0-9-]/g, "")
      }))
    );
  });

  const variantChunks: typeof variants[] = [];
  for (let i = 0; i < variants.length; i += 500) variantChunks.push(variants.slice(i, i + 500));

  const insertedVariantIds: { id: string }[] = [];
  for (const chunk of variantChunks) {
    const { data, error } = await supabase.from("product_variants").insert(chunk).select("id");
    if (error) throw error;
    if (data) insertedVariantIds.push(...(data as { id: string }[]));
  }

  const inventory = insertedVariantIds.map((v, idx) => ({
    variant_id: v.id,
    quantity: (idx * 7) % 51,
    reserved_quantity: 0
  }));

  const inventoryChunks: typeof inventory[] = [];
  for (let i = 0; i < inventory.length; i += 500) inventoryChunks.push(inventory.slice(i, i + 500));

  for (const chunk of inventoryChunks) {
    const { error } = await supabase.from("inventory").insert(chunk);
    if (error) throw error;
  }

  process.stdout.write(
    JSON.stringify(
      {
        success: true,
        counts: {
          categories: insertedCategories.length,
          products: insertedProducts.length,
          images: images.length,
          variants: variants.length,
          inventory: inventory.length
        }
      },
      null,
      2
    ) + "\n"
  );
}

main().catch((err) => {
  process.stderr.write(String(err?.message ?? err) + "\n");
  process.exit(1);
});
