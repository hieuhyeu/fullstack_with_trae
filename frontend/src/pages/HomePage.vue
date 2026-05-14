<template>
  <div>
    <!-- ===== HERO BANNER ===== -->
    <section class="relative w-full bg-black overflow-hidden" style="min-height: 580px;">
      <!-- Placeholder background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-800"></div>
      <!-- Decorative stripes -->
      <div class="absolute right-0 top-0 h-full w-1/2 opacity-10">
        <div class="h-full w-full" style="background: repeating-linear-gradient(15deg, transparent, transparent 40px, rgba(255,255,255,0.15) 40px, rgba(255,255,255,0.15) 42px)"></div>
      </div>

      <div class="relative max-w-[1440px] mx-auto px-6 lg:px-16 h-full flex items-center" style="min-height: 580px;">
        <div class="max-w-xl py-20">
          <span class="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4">New Collection 2025</span>
          <h1 class="text-[72px] md:text-[96px] font-black uppercase leading-none tracking-tighter text-white mb-6">
            YOU<br/>GOT<br/><span class="text-[#FFD700]">THIS</span>
          </h1>
          <p class="text-[14px] text-white/60 mb-8 max-w-sm leading-relaxed">
            Khám phá dòng sản phẩm thể thao mới nhất — thiết kế cho hiệu suất đỉnh cao.
          </p>
          <RouterLink
            to="/products"
            class="inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
          >
            Khám phá dòng sản phẩm
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ===== TEAM SELECTION ===== -->
    <section class="py-14 border-b border-black/8">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16">
        <div class="flex items-end justify-between mb-8">
          <h2 class="text-[18px] font-black uppercase tracking-[0.1em]">Chọn Đội Bóng Yêu Thích</h2>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
          <button
            v-for="team in teams" :key="team.name"
            class="group flex flex-col items-center gap-3"
          >
            <div
              class="w-full aspect-square flex items-center justify-center text-2xl font-black text-white transition-transform group-hover:scale-105"
              :style="{ backgroundColor: team.color }"
            >
              {{ team.flag }}
            </div>
            <span class="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/60">{{ team.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ===== NEW PRODUCTS ===== -->
    <section class="py-14">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16">
        <div class="flex items-end justify-between mb-8">
          <div>
            <h2 class="text-[18px] font-black uppercase tracking-[0.1em]">Sản Phẩm Mới Nhất</h2>
            <p class="text-[12px] text-black/40 mt-1">{{ products.length }} sản phẩm</p>
          </div>
          <RouterLink to="/products" class="text-[12px] font-bold uppercase tracking-[0.08em] underline underline-offset-4 hover:text-black/60 transition-colors flex items-center gap-1">
            Xem tất cả
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </RouterLink>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          <div v-for="n in 8" :key="n" class="animate-pulse">
            <div class="aspect-square bg-black/5 mb-3"></div>
            <div class="h-3.5 bg-black/5 rounded mb-2 w-3/4"></div>
            <div class="h-3 bg-black/5 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Product grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          <div
            v-for="product in products" :key="product.id"
            class="group cursor-pointer"
          >
            <!-- Product image -->
            <div class="relative aspect-square bg-[#F5F5F5] overflow-hidden mb-3">
              <img
                v-if="product.thumbnail_url"
                :src="product.thumbnail_url"
                :alt="product.name_vi"
                class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-16 h-16 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>

              <!-- Badges -->
              <div class="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                <span v-if="product.is_featured" class="bg-black text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5">Hot</span>
                <span v-if="product.compare_at_price" class="bg-[#C00] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5">Sale</span>
              </div>

              <!-- Heart -->
              <button class="absolute top-2.5 right-2.5 w-7 h-7 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>

              <!-- Quick Add overlay -->
              <div class="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <button
                  @click.stop="handleAddToCart(product)"
                  :disabled="addingId === product.id"
                  class="w-full bg-black text-white text-[11px] font-bold uppercase tracking-[0.1em] py-3 hover:bg-black/80 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <svg v-if="addingId === product.id" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ addingId === product.id ? 'Đang thêm...' : 'Thêm vào giỏ' }}
                </button>
              </div>
            </div>

            <!-- Product info -->
            <div>
              <p class="text-[10px] text-black/40 uppercase tracking-[0.08em] mb-1">{{ product.category_label }}</p>
              <h3 class="text-[13px] font-medium leading-snug line-clamp-2 mb-1.5">{{ product.name_vi }}</h3>
              <div class="flex items-center gap-2">
                <span class="text-[13px] font-semibold">{{ formatVnd(product.price) }}</span>
                <span v-if="product.compare_at_price" class="text-[12px] text-black/40 line-through">{{ formatVnd(product.compare_at_price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== WHAT'S HOT ===== -->
    <section class="py-14 bg-[#FAFAFA]">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16">
        <h2 class="text-[18px] font-black uppercase tracking-[0.1em] mb-8">What's Hot</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="item in hotItems" :key="item.title" class="group cursor-pointer">
            <div class="relative aspect-[3/4] overflow-hidden mb-3" :style="{ backgroundColor: item.bg }">
              <div class="absolute inset-0 flex items-end p-4">
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 mb-1">{{ item.sub }}</p>
                  <p class="text-[15px] font-black uppercase text-white leading-tight">{{ item.title }}</p>
                </div>
              </div>
              <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </div>
            <a href="#" class="text-[11px] font-bold uppercase tracking-[0.08em] underline underline-offset-4 hover:text-black/60 transition-colors">Mua ngay →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== MARKETING / SEO SECTION ===== -->
    <section class="bg-black py-20">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16 max-w-3xl">
        <h2 class="text-[28px] md:text-[36px] font-black uppercase text-white leading-tight mb-6">
          Cửa Hàng Thể Thao Adidas<br/>Hiệu Năng & Phong Cách
        </h2>
        <p class="text-[14px] text-white/50 leading-relaxed max-w-2xl">
          adidas là thương hiệu thể thao hàng đầu thế giới, mang đến những sản phẩm kết hợp hoàn hảo giữa hiệu năng vận động và phong cách thời thượng. Từ giày chạy bộ đến trang phục thường ngày, mỗi sản phẩm đều được thiết kế với công nghệ tiên tiến nhất để giúp bạn luôn tỏa sáng.
        </p>
      </div>
    </section>

    <!-- ===== MEMBERSHIP BANNER ===== -->
    <section class="py-16" style="background-color: #4E7661;">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 class="text-[24px] md:text-[32px] font-black uppercase text-white leading-tight">
            Trở Thành Hội Viên<br/>&amp; Hưởng Ưu Đãi 10%
          </h2>
          <p class="text-[13px] text-white/70 mt-2">Miễn phí — Nhận ưu đãi, thông báo sản phẩm mới và nhiều hơn nữa.</p>
        </div>
        <RouterLink
          to="/register"
          class="flex-shrink-0 inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
        >
          Đăng ký ngay →
        </RouterLink>
      </div>
    </section>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toast.show" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div
          class="flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium shadow-xl"
          :class="toast.type === 'success' ? 'bg-black text-white' : 'bg-[#C00] text-white'"
        >
          <svg v-if="toast.type === 'success'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ toast.message }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";

const API = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:3000/v1";

const auth = useAuthStore();
const cart = useCartStore();
const router = useRouter();

const loading = ref(true);
const addingId = ref<string | null>(null);
const toast = ref({ show: false, message: "", type: "success" as "success" | "error" });

type ProductRow = {
  id: string;
  slug: string;
  name_vi: string;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  category_id: string | null;
  category_label: string;
  thumbnail_url: string | null;
  default_variant_id: string | null;
};

const products = ref<ProductRow[]>([]);

const teams = [
  { name: "Argentina", color: "#74ACDF", flag: "🇦🇷" },
  { name: "Germany", color: "#000000", flag: "🇩🇪" },
  { name: "Japan", color: "#BC002D", flag: "🇯🇵" },
  { name: "Mexico", color: "#006847", flag: "🇲🇽" },
  { name: "Spain", color: "#AA151B", flag: "🇪🇸" },
  { name: "Italy", color: "#003DA5", flag: "🇮🇹" },
];

const hotItems = [
  { title: "Juventus 26/27", sub: "Football", bg: "#1a1a2e" },
  { title: "Fear of God", sub: "Originals", bg: "#2d2d2d" },
  { title: "Pet Collection", sub: "Originals", bg: "#3a2a1a" },
  { title: "FC Bayern", sub: "Football", bg: "#DC052D" },
];

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

function showToast(message: string, type: "success" | "error" = "success") {
  toast.value = { show: true, message, type };
  setTimeout(() => { toast.value.show = false; }, 3000);
}

async function handleAddToCart(product: ProductRow) {
  if (!auth.isLoggedIn) {
    showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", "error");
    setTimeout(() => router.push("/login"), 1200);
    return;
  }
  if (!product.default_variant_id) {
    showToast("Sản phẩm này tạm hết hàng", "error");
    return;
  }
  addingId.value = product.id;
  try {
    await cart.addItem(product.id, product.default_variant_id);
    showToast(`Đã thêm "${product.name_vi}" vào giỏ hàng ✓`);
  } catch (err: any) {
    showToast(err.message || "Thêm vào giỏ thất bại", "error");
  } finally {
    addingId.value = null;
  }
}

const categoryLabels: Record<string, string> = {
  giay: "Giày",
  ao: "Áo",
  "phu-kien": "Phụ kiện",
  "bo-suu-tap": "Bộ sưu tập",
};

async function loadProducts() {
  loading.value = true;
  try {
    // Load categories first
    const catRes = await fetch(`${API}/categories`);
    const catJson = await catRes.json();
    const catMap: Record<string, string> = {};
    for (const c of catJson.data ?? []) catMap[c.id] = categoryLabels[c.slug] ?? c.name_vi;

    // Load products with detail (images + variants)
    const res = await fetch(`${API}/products?limit=10`);
    const json = await res.json();
    const rawProducts = json.data ?? [];

    // For each product, load detail to get thumbnail + default variant
    const detailed = await Promise.all(
      rawProducts.map(async (p: any) => {
        try {
          const detailRes = await fetch(`${API}/products/${p.slug}`);
          const detailJson = await detailRes.json();
          const detail = detailJson.data;
          const images = detail?.product_images ?? [];
          const sorted = images.slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const thumbnail_url = sorted[0]?.url ?? null;

          // Pick first variant with stock > 0
          const variants = detail?.product_variants ?? [];
          const defaultVariant = variants.find((v: any) => {
            const inv = v.inventory;
            const available = inv ? inv.quantity - inv.reserved_quantity : 0;
            return available > 0;
          }) ?? variants[0] ?? null;

          return {
            id: p.id,
            slug: p.slug,
            name_vi: p.name_vi,
            price: p.price,
            compare_at_price: p.compare_at_price ?? null,
            is_featured: p.is_featured,
            category_id: p.category_id,
            category_label: catMap[p.category_id] ?? "Sản phẩm",
            thumbnail_url,
            default_variant_id: defaultVariant?.id ?? null,
          };
        } catch {
          return {
            id: p.id, slug: p.slug, name_vi: p.name_vi, price: p.price,
            compare_at_price: null, is_featured: p.is_featured, category_id: p.category_id,
            category_label: catMap[p.category_id] ?? "Sản phẩm", thumbnail_url: null, default_variant_id: null,
          };
        }
      })
    );
    products.value = detailed;
  } finally {
    loading.value = false;
  }
}

onMounted(loadProducts);
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }

.group:hover .group-hover\:scale-103 { transform: scale(1.03); }
</style>
