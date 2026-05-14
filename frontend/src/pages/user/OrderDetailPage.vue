<template>
  <div class="max-w-[1440px] mx-auto px-6 lg:px-16 py-12">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-[11px] text-black/40 mb-8 uppercase tracking-[0.08em]">
      <RouterLink to="/" class="hover:text-black transition-colors">Trang chủ</RouterLink>
      <span>/</span>
      <RouterLink to="/orders" class="hover:text-black transition-colors">Đơn hàng</RouterLink>
      <span>/</span>
      <span class="text-black">Chi tiết</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="w-7 h-7 animate-spin text-black/30" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>

    <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- Left: Items + Timeline -->
      <div class="lg:col-span-7 xl:col-span-8 space-y-8">

        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-[20px] font-black uppercase tracking-[0.06em]">{{ order.order_number }}</h1>
            <p class="text-[12px] text-black/40 mt-1">Đặt lúc {{ formatDate(order.created_at) }}</p>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1.5" :class="statusClass(order.status)">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- Status Timeline -->
        <div class="border border-black/10 p-6">
          <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40 mb-6">Trạng thái đơn hàng</p>
          <div class="relative">
            <!-- Line -->
            <div class="absolute top-3 left-3 right-3 h-0.5 bg-black/10"></div>
            <div
              class="absolute top-3 left-3 h-0.5 bg-black transition-all duration-700"
              :style="{ width: timelineProgress }"
            ></div>
            <!-- Steps -->
            <div class="relative flex justify-between">
              <div v-for="(step, idx) in timelineSteps" :key="step.key" class="flex flex-col items-center" style="flex: 1;">
                <div
                  class="w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors"
                  :class="step.done ? 'bg-black border-black' : 'bg-white border-black/20'"
                >
                  <svg v-if="step.done" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                  <div v-else class="w-2 h-2 rounded-full" :class="step.active ? 'bg-black' : 'bg-black/20'"></div>
                </div>
                <p class="text-[9px] font-semibold uppercase tracking-[0.06em] mt-2 text-center"
                  :class="step.done || step.active ? 'text-black' : 'text-black/30'">{{ step.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order items -->
        <div class="border border-black/10">
          <div class="px-5 py-4 border-b border-black/8">
            <h2 class="text-[12px] font-black uppercase tracking-[0.1em]">Sản phẩm ({{ order.items?.length ?? 0 }})</h2>
          </div>
          <div class="divide-y divide-black/8">
            <div v-for="item in order.items" :key="item.id" class="flex gap-4 p-5">
              <!-- Thumb -->
              <div class="w-20 h-20 bg-[#F5F5F5] flex-shrink-0 overflow-hidden">
                <img
                  v-if="getItemThumb(item)"
                  :src="getItemThumb(item)"
                  :alt="item.product?.name_vi"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
                  </svg>
                </div>
              </div>
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold leading-snug line-clamp-2">{{ item.product?.name_vi ?? '—' }}</p>
                <p v-if="item.variant_snapshot" class="text-[11px] text-black/40 mt-0.5">
                  Size: {{ item.variant_snapshot.size }} · Màu: {{ item.variant_snapshot.color }}
                </p>
                <p class="text-[11px] text-black/40 mt-1">Số lượng: {{ item.quantity }}</p>
              </div>
              <!-- Price -->
              <div class="text-right flex-shrink-0">
                <p class="text-[13px] font-semibold">{{ formatVnd(item.subtotal) }}</p>
                <p class="text-[11px] text-black/40 mt-0.5">{{ formatVnd(item.unit_price) }} / cái</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cancel button -->
        <div v-if="canCancel">
          <div v-if="!cancelConfirm">
            <button
              @click="cancelConfirm = true"
              class="border border-red-300 text-red-600 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-red-50 transition-colors"
            >Hủy đơn hàng</button>
          </div>
          <div v-else class="border border-red-200 bg-red-50 p-5">
            <p class="text-[13px] font-semibold text-red-700 mb-3">Bạn có chắc muốn hủy đơn hàng này?</p>
            <div class="mb-3">
              <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5 text-red-700">Lý do hủy <span>*</span></label>
              <input v-model="cancelReason" type="text" placeholder="Nhập lý do hủy..."
                class="w-full h-10 px-3 border border-red-200 text-[13px] outline-none bg-white focus:border-red-400"/>
            </div>
            <div class="flex gap-3">
              <button @click="handleCancel" :disabled="cancelling || !cancelReason.trim()"
                class="bg-red-600 text-white px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                <svg v-if="cancelling" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ cancelling ? 'Đang hủy...' : 'Xác nhận hủy' }}
              </button>
              <button @click="cancelConfirm = false"
                class="border border-red-200 px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-red-600 hover:bg-white transition-colors">
                Không, giữ lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="lg:col-span-5 xl:col-span-4 space-y-5">

        <!-- Payment & shipping info -->
        <div class="border border-black/10 p-6">
          <h2 class="text-[12px] font-black uppercase tracking-[0.1em] mb-4">Thông tin đơn hàng</h2>
          <div class="space-y-3 text-[12px]">
            <div class="flex justify-between">
              <span class="text-black/50">Phương thức thanh toán</span>
              <span class="font-medium">{{ paymentLabel(order.payment_method) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-black/50">Trạng thái thanh toán</span>
              <span class="font-medium" :class="order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'">
                {{ order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-black/50">Phương thức giao hàng</span>
              <span class="font-medium">{{ order.shipping_method === 'standard' ? 'Giao hàng tiêu chuẩn' : order.shipping_method }}</span>
            </div>
            <div v-if="order.tracking_number" class="flex justify-between">
              <span class="text-black/50">Mã tracking</span>
              <span class="font-medium font-mono">{{ order.tracking_number }}</span>
            </div>
          </div>
        </div>

        <!-- Shipping address -->
        <div v-if="order.shipping_address" class="border border-black/10 p-6">
          <h2 class="text-[12px] font-black uppercase tracking-[0.1em] mb-4">Địa chỉ giao hàng</h2>
          <div class="text-[12px] text-black/70 space-y-1">
            <p class="font-semibold text-black">{{ order.shipping_address.full_name }}</p>
            <p>{{ order.shipping_address.phone }}</p>
            <p>{{ order.shipping_address.address_line1 }}</p>
            <p v-if="order.shipping_address.ward || order.shipping_address.district">
              {{ [order.shipping_address.ward, order.shipping_address.district].filter(Boolean).join(', ') }}
            </p>
            <p>{{ order.shipping_address.city }}</p>
          </div>
        </div>

        <!-- Price summary -->
        <div class="border border-black/10 p-6">
          <h2 class="text-[12px] font-black uppercase tracking-[0.1em] mb-4">Tóm tắt thanh toán</h2>
          <div class="space-y-2 text-[12px]">
            <div class="flex justify-between">
              <span class="text-black/50">Tạm tính</span>
              <span>{{ formatVnd(order.subtotal) }}</span>
            </div>
            <div v-if="order.discount_amount > 0" class="flex justify-between text-green-600">
              <span>Giảm giá</span>
              <span>-{{ formatVnd(order.discount_amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-black/50">Phí vận chuyển</span>
              <span :class="order.shipping_fee === 0 ? 'text-green-600' : ''">
                {{ order.shipping_fee === 0 ? 'Miễn phí' : formatVnd(order.shipping_fee) }}
              </span>
            </div>
            <div class="h-px bg-black/10 my-2"></div>
            <div class="flex justify-between font-bold text-[14px]">
              <span>Tổng cộng</span>
              <span>{{ formatVnd(order.total_amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error / not found -->
    <div v-else class="text-center py-20">
      <p class="text-[14px] text-black/50">Không tìm thấy đơn hàng.</p>
      <RouterLink to="/orders" class="inline-block mt-4 text-[12px] font-bold underline underline-offset-2 hover:text-black/60 transition-colors">← Quay lại đơn hàng</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const API = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:3000/v1";
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const order = ref<any>(null);
const cancelConfirm = ref(false);
const cancelReason = ref("");
const cancelling = ref(false);

const canCancel = computed(() =>
  order.value && ["pending", "confirmed"].includes(order.value.status)
);

const timelineSteps = computed(() => {
  const status = order.value?.status ?? "";
  const flow = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const cancelledOrRefunded = ["cancelled", "refunded"].includes(status);
  const steps = cancelledOrRefunded
    ? [
        { key: "pending", label: "Đặt hàng", done: true, active: false },
        { key: "cancelled", label: status === "refunded" ? "Hoàn tiền" : "Đã hủy", done: false, active: true },
      ]
    : flow.map((key) => {
        const idx = flow.indexOf(key);
        const currentIdx = flow.indexOf(status);
        return {
          key,
          label: { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang xử lý", shipped: "Đang giao", delivered: "Đã giao" }[key] ?? key,
          done: idx < currentIdx,
          active: idx === currentIdx,
        };
      });
  return steps;
});

const timelineProgress = computed(() => {
  const status = order.value?.status ?? "";
  const flow = ["pending", "confirmed", "processing", "shipped", "delivered"];
  if (["cancelled", "refunded"].includes(status)) return "0%";
  const idx = flow.indexOf(status);
  if (idx <= 0) return "0%";
  return `${(idx / (flow.length - 1)) * 100}%`;
});

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v ?? 0);
}

function formatDate(s: string) {
  return new Date(s).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang xử lý",
    shipped: "Đang giao hàng", delivered: "Đã giao hàng", cancelled: "Đã hủy", refunded: "Hoàn tiền",
  };
  return map[s] ?? s;
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700", confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-blue-50 text-blue-700", shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-green-50 text-green-700", cancelled: "bg-red-50 text-red-700",
    refunded: "bg-gray-100 text-gray-600",
  };
  return map[s] ?? "bg-gray-100 text-gray-600";
}

function paymentLabel(s: string) {
  const map: Record<string, string> = { cod: "Thanh toán khi nhận hàng", bank_transfer: "Chuyển khoản", momo: "MoMo", vnpay: "VNPay" };
  return map[s] ?? s;
}

function getItemThumb(item: any) {
  const imgs = item.product?.product_images ?? [];
  if (!imgs.length) return null;
  return imgs.slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null;
}

async function handleCancel() {
  if (!cancelReason.value.trim()) return;
  cancelling.value = true;
  try {
    const res = await fetch(`${API}/orders/${order.value.id}/cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ reason: cancelReason.value }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
    order.value.status = "cancelled";
    cancelConfirm.value = false;
    cancelReason.value = "";
  } catch (err: any) {
    alert(err.message || "Hủy đơn thất bại");
  } finally {
    cancelling.value = false;
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push("/login"); return; }
  const orderId = route.params.orderId as string;
  try {
    const res = await fetch(`${API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    const json = await res.json();
    if (res.ok) order.value = json.data;
  } finally {
    loading.value = false;
  }
});
</script>
