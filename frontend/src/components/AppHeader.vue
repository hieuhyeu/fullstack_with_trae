<template>
  <header class="w-full z-50 bg-white">
    <!-- Top utility bar -->
    <div class="bg-white border-b border-black/8">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16 flex justify-end items-center h-8 gap-6">
        <a href="#" class="text-[11px] text-black/60 hover:text-black transition-colors">Trợ giúp</a>
        <RouterLink to="/orders" class="text-[11px] text-black/60 hover:text-black transition-colors">Theo dõi đơn hàng</RouterLink>
        <template v-if="auth.isLoggedIn">
          <div class="relative" ref="userMenuRef">
            <button @click="userMenuOpen = !userMenuOpen" class="flex items-center gap-1.5 text-[11px] font-medium text-black hover:text-black/70 transition-colors">
              <div class="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">
                {{ userInitial }}
              </div>
              {{ auth.user?.user_metadata?.full_name?.split(' ')[0] || auth.user?.email?.split('@')[0] }}
            </button>
            <div v-if="userMenuOpen" class="absolute right-0 top-full mt-1 w-44 bg-white border border-black/10 shadow-lg z-50">
              <RouterLink to="/profile" @click="userMenuOpen = false" class="block px-4 py-2.5 text-[12px] hover:bg-black/5 transition-colors">Tài khoản của tôi</RouterLink>
              <RouterLink to="/orders" @click="userMenuOpen = false" class="block px-4 py-2.5 text-[12px] hover:bg-black/5 transition-colors">Đơn hàng</RouterLink>
              <button @click="handleLogout" class="w-full text-left px-4 py-2.5 text-[12px] hover:bg-black/5 transition-colors border-t border-black/8">Đăng xuất</button>
            </div>
          </div>
        </template>
        <template v-else>
          <RouterLink to="/login" class="text-[11px] text-black/60 hover:text-black transition-colors font-medium">Đăng nhập</RouterLink>
        </template>
      </div>
    </div>

    <!-- Main nav -->
    <div class="border-b border-black/10">
      <div class="max-w-[1440px] mx-auto px-6 lg:px-16 flex items-center justify-between h-[60px]">
        <!-- Logo -->
        <RouterLink to="/" class="flex-shrink-0 mr-8">
          <svg viewBox="0 0 94 64" class="h-7 w-auto fill-black" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L32 0h10.9L10.9 64H0zm20.3 0L52.3 0h10.9L31.2 64H20.3zm20.3 0L72.6 0h10.9L51.5 64H40.6z"/>
          </svg>
        </RouterLink>

        <!-- Nav links (desktop) -->
        <nav class="hidden lg:flex items-center gap-0 flex-1">
          <RouterLink
            v-for="item in navItems" :key="item.label"
            :to="item.to"
            class="px-3 py-2 text-[13px] font-medium uppercase tracking-[0.06em] text-black hover:text-black/60 transition-colors whitespace-nowrap"
          >{{ item.label }}</RouterLink>
        </nav>

        <!-- Right actions -->
        <div class="flex items-center gap-2 ml-4">
          <!-- Search -->
          <div class="relative hidden md:flex items-center">
            <input
              v-model="searchQuery"
              @keydown.enter="handleSearch"
              placeholder="Tìm kiếm"
              class="h-9 w-52 pl-9 pr-3 border border-black/20 text-[13px] outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/40"
            />
            <svg class="absolute left-2.5 w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <!-- Favorites icon -->
          <button class="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors rounded-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          <!-- Cart -->
          <RouterLink to="/cart" class="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors rounded-sm relative">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span v-if="cart.itemCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full">
              {{ cart.itemCount > 9 ? '9+' : cart.itemCount }}
            </span>
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";

const auth = useAuthStore();
const cart = useCartStore();
const router = useRouter();

const searchQuery = ref("");
const userMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

const navItems = [
  { label: "Nam", to: "/products?q=nam" },
  { label: "Nữ", to: "/products?q=nu" },
  { label: "Trẻ Em", to: "/products?q=tre-em" },
  { label: "Thể Thao", to: "/products?q=the-thao" },
  { label: "Bộ Sưu Tập", to: "/products?q=bo-suu-tap" },
  { label: "Giảm Giá", to: "/products?q=outlet" },
];

const userInitial = computed(() => {
  const name = auth.user?.user_metadata?.full_name || auth.user?.email || "U";
  return name.charAt(0).toUpperCase();
});

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/products?q=${encodeURIComponent(searchQuery.value.trim())}`);
    searchQuery.value = "";
  }
}

async function handleLogout() {
  userMenuOpen.value = false;
  await auth.logout();
  cart.items = [];
  router.push("/");
}

function handleClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>
