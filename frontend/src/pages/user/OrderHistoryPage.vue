<template>
  <div class="max-w-[1440px] mx-auto px-6 lg:px-16 py-12">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-[11px] text-black/40 mb-8 uppercase tracking-[0.08em]">
      <RouterLink to="/" class="hover:text-black transition-colors">Trang chủ</RouterLink>
      <span>/</span>
      <span class="text-black">Đơn hàng của tôi</span>
    </nav>

    <div class="flex items-center justify-between mb-8">
      <h1 class="text-[22px] font-black uppercase tracking-[0.08em]">Đơn hàng của tôi</h1>
      <RouterLink to="/" class="text-[12px] font-bold uppercase tracking-[0.08em] underline underline-offset-4 hover:text-black/60 transition-colors">
        Tiếp tục mua sắm →
      </RouterLink>
    </div>

    <!-- Status filter tabs -->
    <div class="flex gap-0 border-b border-black/10 mb-8 overflow-x-auto">
      <button
        v-for="tab in tabs" :key="tab.value"
        @click="activeStatus = tab.value; loadOrders()"
        class="flex-shrink-0 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors border-b-2 -mb-px"
        :class="activeStatus === tab.value
          ? 'border-black text-black'
          : 'border-transparent text-black/40 hover:text-black/70'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="animate-pulse flex gap-4 border border-black/8 p-5">
        <div class="w-16 h-16 bg-black/5 flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-black/5 rounded w-1/4"></div>
          <div class="h-3 bg-black/5 rounded w-1/3"></div>
          <div class="h-3 bg-black/5 rounded w-1/5"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="text-center py-20 border border-black/8">
      <svg class="w-12 h-12 mx-auto text-black/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="text-[14px] font-semibold mb-1">Chưa có đơn hàng nào</p>
      <p class="text-[12px] text-black/40">Các đơn hàng của bạn sẽ hiển thị ở đây.</p>
    </div>

    <!-- Orders list -->
    <div v-else class="space-y-4">
      <RouterLink
        v-for="order in orders" :key="order.id"
        :to="`/orders/${order.id}`"
        class="flex items-center gap-4 border border-black/10 p-5 hover:border-black transition-colors group block"
      >
        <!-- Thumbnail -->
        <div class="w-16 h-16 bg-[#F5F5F5] flex-shrink-0 overflow-hidden">
          <img v-if="order.thumbnail_url" :src="order.thumbnail_url" :alt="order.order_number" class="w-full h-full object-cover"/>
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-6 h-6 text-black/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-[13px] font-bold tracking-wide">{{ order.order_number }}</p>
              <p class="text-[11px] text-black/40 mt-0.5">{{ formatDate(order.created_at) }} · {{ order.item_count }} sản phẩm</p>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <span class="text-[13px] font-semibold">{{ formatVnd(order.total_amount) }}</span>
              <span
                class="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1"
                :class="statusClass(order.status)"
              >{{ statusLabel(order.status) }}</span>
            </div>
          </div>
        </div>

        <svg class="w-4 h-4 text-black/30 group-hover:text-black transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </RouterLink>
    </div>

    <!-- Pagination -->
    <div v-if="meta.total_pages > 1" class="flex justify-center gap-2 mt-10">
      <button
        v-for="p in meta.total_pages" :key="p"
        @click="meta.page = p; loadOrders()"
        class="w-9 h-9 text-[12px] font-semibold border transition-colors"
        :class="p === meta.page ? 'bg-black text-white border-black' : 'border-black/15 hover:border-black text-black/60'"
      >{{ p }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const API = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:3000/v1";
const auth = useAuthStore();
const router = useRouter();

const loading = ref(true);
const activeStatus = ref("");
const orders = ref<any[]>([]);
const meta = ref({ page: 1, per_page: 10, total: 0, total_pages: 0 });

const tabs = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đang giao", value: "shipped" },
  { label: "Hoàn thành", value: "delivered" },
  { label: "Đã hủy", value: "cancelled" },
];

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    refunded: "Hoàn tiền",
  };
  return map[s] ?? s;
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-blue-50 text-blue-700",
    shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
    refunded: "bg-gray-100 text-gray-600",
  };
  return map[s] ?? "bg-gray-100 text-gray-600";
}

async function loadOrders() {
  loading.value = true;
  try {
    const qs = new URLSearchParams({ page: String(meta.value.page), per_page: "10" });
    if (activeStatus.value) qs.set("status", activeStatus.value);
    const res = await fetch(`${API}/orders?${qs}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    const json = await res.json();
    orders.value = json.data ?? [];
    meta.value = { ...meta.value, ...json.meta };
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push("/login?redirect=/orders"); return; }
  await loadOrders();
});
</script>
