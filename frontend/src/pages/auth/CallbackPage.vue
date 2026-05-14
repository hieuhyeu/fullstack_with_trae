<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <svg class="w-8 h-8 animate-spin mx-auto mb-4 text-black/30" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-[13px] text-black/50">Đang xử lý đăng nhập...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth";
import { useCartStore } from "../../stores/cart";

const router = useRouter();
const auth = useAuthStore();
const cart = useCartStore();

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    auth.user = session.user;
    auth.accessToken = session.access_token;
    await cart.fetchCart();
    router.replace("/");
  } else {
    router.replace("/login");
  }
});
</script>
