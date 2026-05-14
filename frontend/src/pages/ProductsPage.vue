<template>
  <div class="min-h-screen bg-white text-ink">
    <header class="border-b border-black/10">
      <div class="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4">
        <RouterLink to="/" class="text-sm font-semibold tracking-[0.18em]">ADI CLONE</RouterLink>
        <div class="flex items-center gap-3">
          <input
            v-model="q"
            placeholder="Tìm kiếm"
            class="h-9 w-56 rounded-full border border-black/15 px-4 text-[13px] outline-none focus:border-black/40"
          />
          <RouterLink to="/cart" class="text-[13px] font-medium hover:underline">Giỏ</RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1200px] px-4 py-8">
      <div class="flex items-end justify-between">
        <div>
          <h1 class="text-2xl font-semibold uppercase tracking-[0.12em]">Sản phẩm</h1>
          <p class="mt-1 text-[13px] text-black/70">Mock data từ Supabase</p>
        </div>
        <select v-model="sort" class="h-9 rounded-md border border-black/15 px-3 text-[13px]">
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng</option>
          <option value="price_desc">Giá giảm</option>
        </select>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <RouterLink
          v-for="p in products"
          :key="p.id"
          :to="`/products/${p.slug}`"
          class="group border border-black/10"
        >
          <div class="aspect-square bg-black/[0.03]" />
          <div class="p-3">
            <div class="line-clamp-2 text-[13px] font-medium">{{ p.name_vi }}</div>
            <div class="mt-1 text-[12px] text-black/70">{{ formatVnd(p.price) }}</div>
          </div>
        </RouterLink>
      </div>

      <div class="mt-8 flex justify-center">
        <button
          class="h-10 rounded-full border border-black/20 px-5 text-[13px] font-medium hover:border-black/40"
          :disabled="loading"
          @click="loadMore"
        >
          {{ loading ? "Đang tải..." : "Tải thêm" }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Product } from "../lib/api";
import { listProducts } from "../lib/api";

const route = useRoute();
const router = useRouter();

const q = ref(typeof route.query.q === "string" ? route.query.q : "");
const sort = ref<"newest" | "price_asc" | "price_desc">("newest");
const products = ref<Product[]>([]);
const loading = ref(false);
const offset = ref(0);
const limit = 24;

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

async function reload() {
  loading.value = true;
  offset.value = 0;
  try {
    const data = await listProducts({ limit, offset: 0, q: q.value || undefined });
    products.value = applySort(data);
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (loading.value) return;
  loading.value = true;
  try {
    offset.value += limit;
    const data = await listProducts({ limit, offset: offset.value, q: q.value || undefined });
    products.value = applySort(products.value.concat(data));
  } finally {
    loading.value = false;
  }
}

function applySort(items: Product[]) {
  const s = sort.value;
  if (s === "newest") return items;
  if (s === "price_asc") return items.slice().sort((a, b) => a.price - b.price);
  return items.slice().sort((a, b) => b.price - a.price);
}

watch(
  () => sort.value,
  () => {
    products.value = applySort(products.value);
  }
);

watch(
  () => q.value,
  (v) => {
    router.replace({ query: { ...route.query, q: v || undefined } });
  }
);

watch(
  () => route.query.q,
  (v) => {
    const next = typeof v === "string" ? v : "";
    if (next !== q.value) q.value = next;
    void reload();
  },
  { immediate: true }
);
</script>

