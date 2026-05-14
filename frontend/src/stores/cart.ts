import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "./auth";

const API = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:3000/v1";

export type CartItem = {
  id: string;
  product: {
    id: string;
    name_vi: string;
    slug: string;
    thumbnail_url: string | null;
  };
  variant: {
    id: string;
    size: string;
    color: string;
    sku: string | null;
  } | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_available: boolean;
  stock_quantity: number | null;
};

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);
  const loading = ref(false);
  const isDrawerOpen = ref(false);

  const itemCount = computed(() => items.value.reduce((s, i) => s + i.quantity, 0));
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.subtotal, 0));
  const isEmpty = computed(() => items.value.length === 0);

  function authHeaders(): Record<string, string> {
    const auth = useAuthStore();
    const headers: Record<string, string> = {};
    if (auth.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }
    return headers;
  }

  async function fetchCart() {
    const auth = useAuthStore();
    if (!auth.isLoggedIn) { items.value = []; return; }
    loading.value = true;
    try {
      const res = await fetch(`${API}/cart`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      items.value = json.data?.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function addItem(productId: string, variantId: string, quantity = 1) {
    loading.value = true;
    try {
      const res = await fetch(`${API}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? `HTTP ${res.status}`);
      }
      await fetchCart();
    } finally {
      loading.value = false;
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    loading.value = true;
    try {
      const res = await fetch(`${API}/cart/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchCart();
    } finally {
      loading.value = false;
    }
  }

  async function removeItem(itemId: string) {
    loading.value = true;
    try {
      const res = await fetch(`${API}/cart/items/${itemId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchCart();
    } finally {
      loading.value = false;
    }
  }

  async function clearCart() {
    await fetch(`${API}/cart`, { method: "DELETE", headers: authHeaders() });
    items.value = [];
  }

  return { items, loading, isDrawerOpen, itemCount, subtotal, isEmpty, fetchCart, addItem, updateQuantity, removeItem, clearCart };
});
