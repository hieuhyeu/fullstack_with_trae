<template>
  <div class="min-h-screen bg-white text-ink">
    <header class="border-b border-black/10">
      <div class="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4">
        <RouterLink to="/" class="text-sm font-semibold tracking-[0.18em]">ADI CLONE</RouterLink>
        <div class="flex items-center gap-3">
          <RouterLink to="/products" class="text-[13px] font-medium hover:underline">Sản phẩm</RouterLink>
          <RouterLink to="/cart" class="text-[13px] font-medium hover:underline">Giỏ</RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1200px] px-4 py-8">
      <div v-if="loading" class="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div class="md:col-span-7">
          <div class="aspect-square bg-black/[0.03]" />
        </div>
        <div class="md:col-span-5">
          <div class="h-7 w-56 bg-black/[0.06]" />
          <div class="mt-3 h-4 w-40 bg-black/[0.06]" />
          <div class="mt-6 h-10 w-full bg-black/[0.06]" />
        </div>
      </div>

      <div v-else-if="product" class="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div class="md:col-span-7">
          <div class="aspect-square overflow-hidden bg-black/[0.03]">
            <img
              v-if="activeImage"
              :src="activeImage.url"
              :alt="activeImage.alt_text ?? product.name_vi"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div class="mt-3 grid grid-cols-6 gap-2">
            <button
              v-for="img in sortedImages"
              :key="img.id"
              class="aspect-square border border-black/10"
              :class="activeImage?.id === img.id ? 'border-black' : 'hover:border-black/40'"
              @click="activeImageId = img.id"
            >
              <img :src="img.url" class="h-full w-full object-cover" loading="lazy" />
            </button>
          </div>
        </div>

        <div class="md:col-span-5">
          <h1 class="text-2xl font-semibold uppercase tracking-[0.12em]">{{ product.name_vi }}</h1>
          <div class="mt-2 text-[13px] text-black/70">{{ formatVnd(product.price) }}</div>

          <div class="mt-6">
            <div class="text-[12px] font-semibold uppercase tracking-[0.12em]">Chọn size</div>
            <div class="mt-2 grid grid-cols-6 gap-2">
              <button
                v-for="s in sizes"
                :key="s"
                class="h-10 border border-black/15 text-[13px]"
                :class="selectedSize === s ? 'border-black' : 'hover:border-black/40'"
                @click="selectedSize = s"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <div class="mt-6">
            <div class="text-[12px] font-semibold uppercase tracking-[0.12em]">Chọn màu</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="c in colors"
                :key="c"
                class="h-10 border border-black/15 px-4 text-[13px]"
                :class="selectedColor === c ? 'border-black' : 'hover:border-black/40'"
                @click="selectedColor = c"
              >
                {{ c }}
              </button>
            </div>
          </div>

          <div class="mt-6">
            <button
              class="h-12 w-full bg-black text-[13px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-black/90"
              :disabled="!selectedVariantId || adding"
              @click="addToCart"
            >
              {{ adding ? "Đang thêm..." : "Thêm vào giỏ" }}
            </button>
            <p class="mt-2 text-[12px] text-black/60">
              Nếu chưa login, bạn mở trang dev-auth để login Google rồi test cart/order bằng token.
            </p>
          </div>

          <div class="mt-8 border-t border-black/10 pt-6">
            <div class="text-[12px] font-semibold uppercase tracking-[0.12em]">Mô tả</div>
            <p class="mt-2 whitespace-pre-line text-[13px] leading-6 text-black/80">
              {{ product.description_vi ?? "—" }}
            </p>
          </div>
        </div>
      </div>

      <div v-else class="py-10 text-[13px] text-black/70">Không tìm thấy sản phẩm.</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { getProduct, type ProductDetail } from "../lib/api";

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));

const loading = ref(true);
const product = ref<ProductDetail | null>(null);
const activeImageId = ref<string | null>(null);

const selectedSize = ref<string | null>(null);
const selectedColor = ref<string | null>(null);
const adding = ref(false);

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

const sortedImages = computed(() => {
  const imgs = product.value?.product_images ?? [];
  return imgs.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
});

const activeImage = computed(() => {
  const imgs = sortedImages.value;
  if (imgs.length === 0) return null;
  return imgs.find((i) => i.id === activeImageId.value) ?? imgs[0];
});

const variants = computed(() => product.value?.product_variants ?? []);

const sizes = computed(() => Array.from(new Set(variants.value.map((v) => v.size))));
const colors = computed(() => Array.from(new Set(variants.value.map((v) => v.color))));

const selectedVariantId = computed(() => {
  if (!selectedSize.value || !selectedColor.value) return null;
  return (
    variants.value.find((v) => v.size === selectedSize.value && v.color === selectedColor.value)?.id ?? null
  );
});

async function addToCart() {
  if (!product.value || !selectedVariantId.value) return;
  adding.value = true;
  try {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000/v1";
    const res = await fetch(`${base}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ product_id: product.value.id, variant_id: selectedVariantId.value, quantity: 1 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    alert("Đã thêm vào giỏ. Mở /cart để xem (yêu cầu Authorization Bearer cho API).");
  } finally {
    adding.value = false;
  }
}

watchEffect(async () => {
  loading.value = true;
  try {
    product.value = await getProduct(slug.value);
    activeImageId.value = product.value?.product_images?.[0]?.id ?? null;
  } finally {
    loading.value = false;
  }
});
</script>

