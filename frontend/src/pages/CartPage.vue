<template>
  <div class="max-w-[1440px] mx-auto px-6 lg:px-16 py-12">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-[11px] text-black/40 mb-8 uppercase tracking-[0.08em]">
      <RouterLink to="/" class="hover:text-black transition-colors">Trang chủ</RouterLink>
      <span>/</span>
      <span class="text-black">Giỏ hàng</span>
    </nav>

    <div v-if="cart.loading && cart.isEmpty" class="flex items-center justify-center py-24">
      <svg class="w-7 h-7 animate-spin text-black/30" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>

    <!-- Empty cart -->
    <div v-else-if="cart.isEmpty" class="text-center py-24">
      <svg class="w-14 h-14 mx-auto text-black/10 mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
      </svg>
      <h2 class="text-[20px] font-black uppercase tracking-[0.08em] mb-3">Giỏ hàng trống</h2>
      <p class="text-[13px] text-black/40 mb-8">Hãy thêm sản phẩm vào giỏ để tiếp tục mua sắm.</p>
      <RouterLink to="/" class="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-black/85 transition-colors">
        Tiếp tục mua sắm →
      </RouterLink>
    </div>

    <!-- Cart content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- Items list -->
      <div class="lg:col-span-7 xl:col-span-8">
        <h1 class="text-[22px] font-black uppercase tracking-[0.08em] mb-6">Giỏ hàng ({{ cart.itemCount }} sản phẩm)</h1>

        <div class="divide-y divide-black/8">
          <div v-for="item in cart.items" :key="item.id" class="flex gap-4 py-5">
            <!-- Image -->
            <div class="w-24 h-24 flex-shrink-0 bg-[#F5F5F5] overflow-hidden">
              <img v-if="item.product.thumbnail_url" :src="item.product.thumbnail_url" :alt="item.product.name_vi" class="w-full h-full object-cover"/>
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-8 h-8 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="text-[14px] font-semibold leading-snug line-clamp-2 mb-1">{{ item.product.name_vi }}</h3>
              <p v-if="item.variant" class="text-[11px] text-black/40 mb-3">
                Size: {{ item.variant.size }} · Màu: {{ item.variant.color }}
              </p>

              <!-- Quantity + remove -->
              <div class="flex items-center gap-3">
                <div class="flex items-center border border-black/20">
                  <button @click="decrement(item)"
                    :disabled="cart.loading"
                    class="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-colors disabled:opacity-40 text-[16px]">−</button>
                  <span class="w-10 text-center text-[13px] font-medium">{{ item.quantity }}</span>
                  <button @click="increment(item)"
                    :disabled="cart.loading || item.quantity >= 10"
                    class="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-colors disabled:opacity-40 text-[16px]">+</button>
                </div>
                <button @click="cart.removeItem(item.id)" :disabled="cart.loading"
                  class="text-[11px] text-black/40 hover:text-black transition-colors underline underline-offset-2 disabled:opacity-40">
                  Xóa
                </button>
              </div>
            </div>

            <!-- Price -->
            <div class="text-right flex-shrink-0">
              <p class="text-[14px] font-semibold">{{ formatVnd(item.subtotal) }}</p>
              <p v-if="item.quantity > 1" class="text-[11px] text-black/40 mt-0.5">{{ formatVnd(item.unit_price) }} / cái</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Order summary -->
      <div class="lg:col-span-5 xl:col-span-4">
        <div class="bg-[#FAFAFA] p-6 sticky top-4">
          <h2 class="text-[14px] font-black uppercase tracking-[0.1em] mb-6">Tóm tắt đơn hàng</h2>

          <div class="space-y-3 text-[13px]">
            <div class="flex justify-between">
              <span class="text-black/60">Tạm tính</span>
              <span>{{ formatVnd(cart.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-black/60">Phí vận chuyển</span>
              <span class="text-green-600 font-medium">Miễn phí</span>
            </div>
            <div class="h-px bg-black/10 my-2"></div>
            <div class="flex justify-between font-bold text-[15px]">
              <span>Tổng cộng</span>
              <span>{{ formatVnd(cart.subtotal) }}</span>
            </div>
          </div>

          <RouterLink to="/checkout"
            class="w-full mt-6 flex items-center justify-center gap-2 bg-black text-white py-4 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-black/85 transition-colors">
            Tiến hành thanh toán →
          </RouterLink>

          <RouterLink to="/" class="w-full mt-3 flex items-center justify-center text-[12px] text-black/50 hover:text-black transition-colors py-2">
            ← Tiếp tục mua sắm
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useCartStore, type CartItem } from "../stores/cart";

const cart = useCartStore();

function formatVnd(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

function increment(item: CartItem) {
  cart.updateQuantity(item.id, item.quantity + 1);
}
function decrement(item: CartItem) {
  if (item.quantity <= 1) { cart.removeItem(item.id); return; }
  cart.updateQuantity(item.id, item.quantity - 1);
}

onMounted(() => cart.fetchCart());
</script>
