<template>
  <div class="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-[420px]">
      <div class="text-center mb-10">
        <RouterLink to="/">
          <svg viewBox="0 0 94 64" class="h-8 w-auto fill-black mx-auto" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L32 0h10.9L10.9 64H0zm20.3 0L52.3 0h10.9L31.2 64H20.3zm20.3 0L72.6 0h10.9L51.5 64H40.6z"/>
          </svg>
        </RouterLink>
        <h1 class="mt-6 text-[22px] font-black uppercase tracking-[0.08em]">Tạo tài khoản</h1>
        <p class="mt-1.5 text-[13px] text-black/50">Miễn phí. Hưởng ưu đãi ngay hôm nay.</p>
      </div>

      <button @click="handleGoogle" :disabled="submitting"
        class="w-full flex items-center justify-center gap-3 border border-black/20 bg-white py-3.5 text-[13px] font-semibold hover:border-black transition-colors mb-6 disabled:opacity-50">
        <svg class="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Đăng ký với Google
      </button>

      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 h-px bg-black/10"></div>
        <span class="text-[11px] text-black/30 uppercase tracking-[0.1em]">hoặc</span>
        <div class="flex-1 h-px bg-black/10"></div>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5">Họ và tên</label>
          <input v-model="form.fullName" type="text" placeholder="Nguyễn Văn A"
            class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5">Email</label>
          <input v-model="form.email" type="email" required placeholder="ten@email.com"
            class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5">Mật khẩu</label>
          <input v-model="form.password" type="password" required placeholder="Tối thiểu 8 ký tự"
            class="w-full h-11 px-3.5 border border-black/20 focus:border-black text-[13px] outline-none transition-colors placeholder:text-black/30"/>
        </div>

        <div v-if="errorMsg" class="bg-red-50 border border-red-200 px-4 py-3 text-[12px] text-red-600">{{ errorMsg }}</div>
        <div v-if="successMsg" class="bg-green-50 border border-green-200 px-4 py-3 text-[12px] text-green-700">{{ successMsg }}</div>

        <button type="submit" :disabled="submitting"
          class="w-full bg-black text-white py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] hover:bg-black/85 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ submitting ? 'Đang tạo tài khoản...' : 'Đăng ký' }}
        </button>
      </form>

      <p class="mt-6 text-center text-[12px] text-black/50">
        Đã có tài khoản?
        <RouterLink to="/login" class="text-black font-semibold hover:underline underline-offset-2">Đăng nhập</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const form = ref({ fullName: "", email: "", password: "" });
const errorMsg = ref("");
const successMsg = ref("");
const submitting = ref(false);

async function handleGoogle() {
  submitting.value = true;
  try { await auth.loginWithGoogle(); } catch (e: any) { errorMsg.value = e.message; submitting.value = false; }
}

async function handleRegister() {
  errorMsg.value = ""; successMsg.value = "";
  if (form.value.password.length < 8) { errorMsg.value = "Mật khẩu phải có ít nhất 8 ký tự"; return; }
  submitting.value = true;
  try {
    await auth.registerWithEmail(form.value.email, form.value.password, form.value.fullName);
    successMsg.value = "Tạo tài khoản thành công! Vui lòng kiểm tra email để xác nhận.";
  } catch (e: any) {
    errorMsg.value = e.message || "Đăng ký thất bại";
  } finally { submitting.value = false; }
}
</script>
