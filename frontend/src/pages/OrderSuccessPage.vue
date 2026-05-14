<template>
  <div class="max-w-[1440px] mx-auto px-6 lg:px-16 py-20">
    <div class="max-w-xl mx-auto text-center">
      <!-- Success checkmark -->
      <div class="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
      </div>

      <h1 class="text-[28px] font-black uppercase tracking-[0.06em] mb-3">Đặt hàng thành công!</h1>
      <p class="text-[14px] text-black/50 mb-8">
        Cảm ơn bạn đã mua sắm. Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.
      </p>

      <!-- Order number card -->
      <div class="bg-[#FAFAFA] border border-black/10 p-8 mb-10 text-left">
        <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40 mb-2">Mã đơn hàng</p>
        <p class="text-[24px] font-black tracking-wider mb-6">{{ orderNumber }}</p>

        <div class="h-px bg-black/8 mb-6"></div>

        <div class="space-y-3 text-[13px]">
          <div class="flex justify-between">
            <span class="text-black/50">Phương thức thanh toán</span>
            <span class="font-medium">Thanh toán khi nhận hàng (COD)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-black/50">Vận chuyển</span>
            <span class="font-medium text-green-600">Miễn phí</span>
          </div>
          <div class="flex justify-between">
            <span class="text-black/50">Thời gian giao hàng dự kiến</span>
            <span class="font-medium">3-5 ngày làm việc</span>
          </div>
        </div>

        <!-- Timeline -->
        <div class="mt-8">
          <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-black/40 mb-4">Trạng thái đơn hàng</p>
          <div class="flex items-center gap-0">
            <div v-for="(step, idx) in steps" :key="step.label" class="flex-1 flex flex-col items-center">
              <div class="flex items-center w-full">
                <div class="flex-1 h-0.5" :class="idx === 0 ? 'bg-transparent' : (idx <= 1 ? 'bg-black' : 'bg-black/15')"></div>
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  :class="step.active ? 'bg-black text-white' : 'bg-black/10 text-black/30'">
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 h-0.5" :class="idx === steps.length - 1 ? 'bg-transparent' : 'bg-black/15'"></div>
              </div>
              <p class="text-[9px] font-semibold uppercase tracking-[0.06em] mt-2 text-center"
                :class="step.active ? 'text-black' : 'text-black/30'">{{ step.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA buttons -->
      <div class="flex flex-col sm:flex-row gap-3">
        <RouterLink to="/"
          class="flex-1 flex items-center justify-center bg-black text-white py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-black/85 transition-colors">
          Tiếp tục mua sắm
        </RouterLink>
        <RouterLink to="/orders"
          class="flex-1 flex items-center justify-center border border-black py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-black/5 transition-colors">
          Xem đơn hàng
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const orderNumber = computed(() => (route.query.order_number as string) || route.params.orderId as string || "---");

const steps = [
  { label: "Đặt hàng", active: true },
  { label: "Xác nhận", active: true },
  { label: "Đang giao", active: false },
  { label: "Đã nhận", active: false },
];
</script>
