<template>
  <div class="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-[420px]">
      <!-- Logo -->
      <div class="text-center mb-10">
        <RouterLink to="/" class="inline-block">
          <svg viewBox="0 0 94 64" class="h-8 w-auto fill-black mx-auto" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L32 0h10.9L10.9 64H0zm20.3 0L52.3 0h10.9L31.2 64H20.3zm20.3 0L72.6 0h10.9L51.5 64H40.6z"/>
          </svg>
        </RouterLink>
        <h1 class="mt-6 text-[22px] font-black uppercase tracking-[0.08em]">Đăng nhập</h1>
        <p class="mt-1.5 text-[13px] text-black/50">Chào mừng trở lại với adidas</p>
      </div>

      <!-- Google OAuth button -->
      <button
        @click="handleGoogle"
        :disabled="submitting"
        class="w-full flex items-center justify-center gap-3 border border-black/20 bg-white py-3.5 text-[13px] font-semibold hover:border-black transition-colors mb-6 disabled:opacity-50"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Tiếp tục với Google
      </button>

      <!-- Divider -->
      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 h-px bg-black/10"></div>
        <span class="text-[11px] text-black/30 uppercase tracking-[0.1em]">hoặc</span>
        <div class="flex-1 h-px bg-black/10"></div>
      </div>

      <!-- Email/Password Form -->
      <form @submit.prevent="handleEmailLogin" class="space-y-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="ten@email.com"
            class="w-full h-11 px-3.5 border text-[13px] outline-none transition-colors placeholder:text-black/30"
            :class="errors.email ? 'border-red-500' : 'border-black/20 focus:border-black'"
          />
          <p v-if="errors.email" class="mt-1 text-[11px] text-red-500">{{ errors.email }}</p>
        </div>

        <div>
          <div class="flex justify-between mb-1.5">
            <label class="text-[11px] font-bold uppercase tracking-[0.1em]">Mật khẩu</label>
            <a href="#" class="text-[11px] text-black/50 hover:text-black transition-colors">Quên mật khẩu?</a>
          </div>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="w-full h-11 px-3.5 pr-10 border text-[13px] outline-none transition-colors placeholder:text-black/30"
              :class="errors.password ? 'border-red-500' : 'border-black/20 focus:border-black'"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors">
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="mt-1 text-[11px] text-red-500">{{ errors.password }}</p>
        </div>

        <!-- Error message -->
        <div v-if="errorMsg" class="bg-red-50 border border-red-200 px-4 py-3 text-[12px] text-red-600">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-black text-white py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] hover:bg-black/85 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ submitting ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>

      <!-- Register link -->
      <p class="mt-6 text-center text-[12px] text-black/50">
        Chưa có tài khoản?
        <RouterLink to="/register" class="text-black font-semibold hover:underline underline-offset-2">Đăng ký ngay</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useCartStore } from "../../stores/cart";

const auth = useAuthStore();
const cart = useCartStore();
const router = useRouter();
const route = useRoute();

const form = ref({ email: "", password: "" });
const errors = ref({ email: "", password: "" });
const errorMsg = ref("");
const submitting = ref(false);
const showPassword = ref(false);

const redirect = (route.query.redirect as string) || "/";

async function handleGoogle() {
  submitting.value = true;
  try {
    await auth.loginWithGoogle();
    // Redirect happens via OAuth callback
  } catch (err: any) {
    errorMsg.value = err.message || "Đăng nhập Google thất bại";
    submitting.value = false;
  }
}

async function handleEmailLogin() {
  errors.value = { email: "", password: "" };
  errorMsg.value = "";

  if (!form.value.email) { errors.value.email = "Email không được để trống"; return; }
  if (!form.value.password) { errors.value.password = "Mật khẩu không được để trống"; return; }

  submitting.value = true;
  try {
    await auth.loginWithEmail(form.value.email, form.value.password);
    await cart.fetchCart();
    router.push(redirect);
  } catch (err: any) {
    errorMsg.value = err.message?.includes("Invalid login") ? "Email hoặc mật khẩu không đúng" : (err.message || "Đăng nhập thất bại");
  } finally {
    submitting.value = false;
  }
}
</script>
