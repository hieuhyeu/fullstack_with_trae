import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./style.css";

// Layouts & Pages
import DefaultLayout from "./layouts/DefaultLayout.vue";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // Auth pages (no layout wrapper)
    {
      path: "/login",
      name: "login",
      component: () => import("./pages/auth/LoginPage.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("./pages/auth/RegisterPage.vue"),
    },
    {
      path: "/auth/callback",
      name: "auth-callback",
      component: () => import("./pages/auth/CallbackPage.vue"),
    },

    // Main app with DefaultLayout
    {
      path: "/",
      component: DefaultLayout,
      children: [
        {
          path: "",
          name: "home",
          component: () => import("./pages/HomePage.vue"),
        },
        {
          path: "products",
          name: "products",
          component: () => import("./pages/ProductsPage.vue"),
        },
        {
          path: "products/:slug",
          name: "product-detail",
          component: () => import("./pages/ProductDetailPage.vue"),
        },
        {
          path: "cart",
          name: "cart",
          component: () => import("./pages/CartPage.vue"),
        },
        {
          path: "checkout",
          name: "checkout",
          component: () => import("./pages/CheckoutPage.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "order-success/:orderId",
          name: "order-success",
          component: () => import("./pages/OrderSuccessPage.vue"),
        },
        {
          path: "orders",
          name: "orders",
          component: () => import("./pages/user/OrderHistoryPage.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "orders/:orderId",
          name: "order-detail",
          component: () => import("./pages/user/OrderDetailPage.vue"),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
});

// Auth guard
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const { useAuthStore } = await import("./stores/auth");
    const auth = useAuthStore();
    if (!auth.isLoggedIn) {
      return { name: "login", query: { redirect: to.fullPath } };
    }
  }
});

const pinia = createPinia();
const app = createApp(App);
app.use(pinia).use(router);

// Init auth store after pinia is ready
import("./stores/auth").then(({ useAuthStore }) => {
  const auth = useAuthStore();
  auth.init().then(() => {
    // Fetch cart if already logged in
    if (auth.isLoggedIn) {
      import("./stores/cart").then(({ useCartStore }) => {
        useCartStore().fetchCart();
      });
    }
  });
});

app.mount("#app");
