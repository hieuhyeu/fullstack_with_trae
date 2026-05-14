<template>
  <div class="max-w-[1440px] mx-auto px-6 lg:px-16 py-12">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-[11px] text-black/40 mb-8 uppercase tracking-[0.08em]">
      <RouterLink to="/" class="hover:text-black transition-colors">Trang chủ</RouterLink>
      <span>/</span>
      <RouterLink to="/cart" class="hover:text-black transition-colors">Giỏ hàng</RouterLink>
      <span>/</span>
      <span class="text-black">Thanh toán</span>
    </nav>

    <h1 class="text-[22px] font-black uppercase tracking-[0.08em] mb-10">Thanh toán</h1>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Form -->
      <div class="lg:col-span-7">
        <form @submit.prevent="handleSubmit">
          <!-- Shipping address -->
          <div class="mb-8">
            <h2 class="text-[13px] font-black uppercase tracking-[0.1em] mb-5 pb-3 border-b border-black/10">Địa chỉ giao hàng</h2>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Họ và tên <span class="text-red-500">*</span></label>
                  <input v-model="form.full_name" type="text" required placeholder="Nguyễn Văn A"
                    class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Số điện thoại <span class="text-red-500">*</span></label>
                  <input v-model="form.phone" type="tel" required placeholder="0912 345 678"
                    class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Địa chỉ <span class="text-red-500">*</span></label>
                <input v-model="form.address_line1" type="text" required placeholder="Số nhà, tên đường"
                  class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Phường/Xã</label>
                  <input v-model="form.ward" type="text" placeholder="Phường 1"
                    class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Quận/Huyện</label>
                  <input v-model="form.district" type="text" placeholder="Quận 1"
                    class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Tỉnh/Thành phố <span class="text-red-500">*</span></label>
                  <input v-model="form.city" type="text" required placeholder="TP Hồ Chí Minh"
                    class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5">Ghi chú</label>
                <textarea v-model="form.notes" rows="2" placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                  class="w-full px-3.5 py-2.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors resize-none placeholder:text-black/30"/>
              </div>
            </div>
          </div>

          <!-- Payment method -->
          <div class="mb-8">
            <h2 class="text-[13px] font-black uppercase tracking-[0.1em] mb-5 pb-3 border-b border-black/10">Phương thức thanh toán</h2>
            <div class="space-y-3">
              <label class="flex items-center gap-3 border border-black cursor-pointer p-4 bg-black/[0.02]">
                <input type="radio" v-model="form.payment_method" value="cod" class="accent-black"/>
                <div>
                  <p class="text-[13px] font-semibold">Thanh toán khi nhận hàng (COD)</p>
                  <p class="text-[11px] text-black/50 mt-0.5">Thanh toán bằng tiền mặt khi nhận được hàng</p>
                </div>
              </label>
              <label class="flex items-center gap-3 border border-black/20 cursor-pointer p-4 opacity-50">
                <input type="radio" value="bank_transfer" disabled class="accent-black"/>
                <div>
                  <p class="text-[13px] font-semibold">Chuyển khoản ngân hàng</p>
                  <p class="text-[11px] text-black/50 mt-0.5">Sắp ra mắt</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="bg-red-50 border border-red-200 px-4 py-3 text-[12px] text-red-600 mb-4">{{ errorMsg }}</div>

          <button type="submit" :disabled="submitting"
            class="w-full bg-black text-white py-4 text-[13px] font-bold uppercase tracking-[0.1em] hover:bg-black/85 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ submitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng →' }}
          </button>
        </form>
      </div>

      <!-- Order summary -->
      <div class="lg:col-span-5">
        <div class="bg-[#FAFAFA] p-6 sticky top-4">
          <h2 class="text-[13px] font-black uppercase tracking-[0.1em] mb-5">Đơn hàng của bạn</h2>
          <div class="divide-y divide-black/8 mb-5">
            <div v-for="item in cart.items" :key="item.id" class="flex gap-3 py-4">
              <div class="w-14 h-14 bg-[#F0F0F0] flex-shrink-0 overflow-hidden">
                <img v-if="item.product.thumbnail_url" :src="item.product.thumbnail_url" :alt="item.product.name_vi" class="w-full h-full object-cover"/>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-medium leading-snug line-clamp-2">{{ item.product.name_vi }}</p>
                <p v-if="item.variant" class="text-[10px] text-black/40 mt-0.5">{{ item.variant.size }} · {{ item.variant.color }}</p>
                <p class="text-[11px] text-black/50 mt-0.5">x{{ item.quantity }}</p>
              </div>
              <p class="text-[12px] font-semibold flex-shrink-0">{{ formatVnd(item.subtotal) }}</p>
            </div>
          </div>
          <div class="space-y-2 text-[13px]">
            <div class="flex justify-between"><span class="text-black/60">Tạm tính</span><span>{{ formatVnd(cart.subtotal) }}</span></div>
            <div class="flex justify-between"><span class="text-black/60">Phí ship</span><span class="text-green-600 font-medium">Miễn phí</span></div>
            <div class="h-px bg-black/10 my-2"></div>
            <div class="flex justify-between font-bold text-[15px]"><span>Tổng cộng</span><span>{{ formatVnd(cart.subtotal) }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";

const API = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:3000/v1";
const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();

const submitting = ref(false);
const errorMsg = ref("");

const form = ref({
  full_name: "",
  phone: "",
  address_line1: "",
  ward: "",
  district: "",
  city: "",
  notes: "",
  payment_method: "cod",
});

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

async function handleSubmit() {
  errorMsg.value = "";
  submitting.value = true;
  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        shipping_address: {
          full_name: form.value.full_name,
          phone: form.value.phone,
          address_line1: form.value.address_line1,
          ward: form.value.ward,
          district: form.value.district,
          city: form.value.city,
          country: "Vietnam",
        },
        payment_method: form.value.payment_method,
        shipping_method: "standard",
        notes: form.value.notes || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
    cart.items = [];
    router.push(`/order-success/${json.data.id}?order_number=${json.data.order_number}`);
  } catch (err: any) {
    errorMsg.value = err.message || "Đặt hàng thất bại. Vui lòng thử lại.";
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push("/login?redirect=/checkout"); return; }
  await cart.fetchCart();
  if (cart.isEmpty) { router.push("/cart"); }
  // Pre-fill name from auth
  const name = auth.user?.user_metadata?.full_name || "";
  if (name && !form.value.full_name) form.value.full_name = name;
});
</script>
