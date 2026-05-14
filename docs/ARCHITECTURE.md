# Architecture Document - Kiến Trúc Hệ Thống
# Dự án: Adidas Clone Vietnam (adidas.vn)

---

## 1. Tổng Quan Kiến Trúc

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Browser)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Vue.js Application                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  Router   │  │  Pinia   │  │  Axios   │  │  Service Worker │   │   │
│  │  │ (Routing) │  │ (State)  │  │  (HTTP)  │  │  (Offline/PWA)  │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (REST API)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Netlify Functions                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  CORS    │  │ Rate Limiter│  │  Helmet   │  │   JWT Verify    │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER (Node.js)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Express.js Server                             │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    API Routes                                 │   │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │   │   │
│  │  │  │  /auth   │  │/products │  │  /cart   │  │  /orders   │   │   │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘   │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                   Middleware Stack                            │   │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │   │   │
│  │  │  │Logger  │ │Auth    │ │RBAC    │ │Validator│ │Error     │  │   │   │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │                          Service Layer                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │ │
│  │  │ ProductSvc   │  │  CartSvc    │  │  OrderSvc   │                  │ │
│  │  │ (Caching)   │  │ (Redis)     │  │ (Inventory) │                  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│    SUPABASE LAYER       │ │     REDIS CACHE         │ │    CDN / STORAGE        │
│  ┌───────────────────┐  │ │  ┌─────────────────┐   │ │  ┌───────────────────┐  │
│  │ PostgreSQL (Data)  │  │ │  │ Product Cache   │   │ │  │ Product Images    │  │
│  │ - RLS Policies     │  │ │  │ Session Store   │   │ │  │ User Avatars      │  │
│  │ - Full-text Search │  │ │  │ Distributed Lock│   │ │  │ Banners           │  │
│  │ - Triggers         │  │ │  └─────────────────┘   │ │  └───────────────────┘  │
│  └───────────────────┘  │ │                         │ │                         │
│  ┌───────────────────┐  │ │                         │ │                         │
│  │ Supabase Auth     │  │ │                         │ │                         │
│  │ - JWT Tokens      │  │ │                         │ │                         │
│  │ - Google OAuth    │  │ │                         │ │                         │
│  └───────────────────┘  │ │                         │ │                         │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

### 1.2 Technology Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Vue.js 3 | 3.4+ | Progressive JS Framework |
| | Vite | 5.0+ | Build Tool & Dev Server |
| | Tailwind CSS | 3.4+ | Utility-first CSS |
| | Pinia | 2.1+ | State Management |
| | Vue Router | 4.2+ | Client-side Routing |
| **Backend** | Node.js | 18+ | JavaScript Runtime |
| | Express.js | 4.18+ | Web Framework |
| | Supabase | 2.0+ | Database & Auth |
| | Redis | 7.0+ | Caching & Locking |
| **Infrastructure** | Netlify | - | Hosting & CDN |
| | GitHub Actions | - | CI/CD Pipeline |
| | Supabase | - | Database as a Service |

### 1.3 Architecture Principles

1. **Separation of Concerns**: Frontend tách biệt với Backend
2. **Single Source of Truth**: Supabase là database chính
3. **Caching Strategy**: Redis cache với TTL phù hợp
4. **Stateless API**: Backend không lưu session state
5. **Horizontal Scalability**: Thiết kế hỗ trợ scale ngang
6. **Security First**: RLS, JWT, HTTPS, Input validation

---

## 2. Frontend Architecture (Vue.js)

### 2.1 Project Structure

```
frontend/
├── public/
│   ├── robots.txt                    # SEO
│   ├── sitemap.xml                   # Sitemap
│   └── favicon.ico
│
├── src/
│   ├── assets/
│   │   ├── images/                   # Static images
│   │   ├── icons/                    # SVG icons
│   │   └── styles/
│   │       ├── main.css              # Global styles
│   │       └── tailwind.css          # Tailwind imports
│   │
│   ├── components/                   # Reusable components
│   │   ├── common/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppFooter.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   ├── Toast.vue
│   │   │   └── ErrorBoundary.vue
│   │   │
│   │   ├── product/
│   │   │   ├── ProductCard.vue
│   │   │   ├── ProductGrid.vue
│   │   │   ├── ProductGallery.vue
│   │   │   ├── SizeSelector.vue
│   │   │   ├── ColorSelector.vue
│   │   │   └── SizeGuide.vue
│   │   │
│   │   ├── cart/
│   │   │   ├── CartDrawer.vue
│   │   │   ├── CartItem.vue
│   │   │   └── CartSummary.vue
│   │   │
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.vue
│   │   │   ├── ShippingForm.vue
│   │   │   └── PaymentOptions.vue
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.vue
│   │   │   ├── RegisterForm.vue
│   │   │   └── GoogleButton.vue
│   │   │
│   │   └── admin/
│   │       ├── AdminSidebar.vue
│   │       ├── DataTable.vue
│   │       └── StatCard.vue
│   │
│   ├── composables/                  # Vue Composables (Logic reuse)
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useProducts.js
│   │   ├── usePagination.js
│   │   ├── useDebounce.js
│   │   └── useToast.js
│   │
│   ├── layouts/
│   │   ├── DefaultLayout.vue         # Main layout
│   │   ├── AuthLayout.vue            # Auth pages
│   │   └── AdminLayout.vue           # Admin dashboard
│   │
│   ├── router/
│   │   └── index.js
│   │       ├── routes.js             # Route definitions
│   │       └── guards.js             # Navigation guards
│   │
│   ├── services/
│   │   ├── api.js                    # Axios instance
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   └── adminService.js
│   │
│   ├── stores/                       # Pinia Stores
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── products.js
│   │   ├── ui.js
│   │   └── admin.js
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── constants.js
│   │
│   ├── views/                        # Page Components
│   │   ├── HomeView.vue
│   │   ├── product/
│   │   │   ├── ProductDetailView.vue
│   │   │   └── ProductListView.vue
│   │   ├── category/
│   │   │   └── CategoryView.vue
│   │   ├── cart/
│   │   │   └── CartView.vue
│   │   ├── checkout/
│   │   │   ├── CheckoutView.vue
│   │   │   └── OrderSuccessView.vue
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── user/
│   │   │   ├── ProfileView.vue
│   │   │   └── OrderHistoryView.vue
│   │   └── admin/
│   │       ├── DashboardView.vue
│   │       ├── AdminProductsView.vue
│   │       ├── AdminOrdersView.vue
│   │       └── AdminUsersView.vue
│   │
│   ├── App.vue
│   └── main.js
│
├── tests/
│   ├── unit/                         # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                          # E2E tests
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── .env.example
```

### 2.2 Component Architecture

#### Component Hierarchy

```
App
├── RouterView
│   ├── DefaultLayout
│   │   ├── AppHeader
│   │   │   ├── Logo
│   │   │   ├── NavigationMenu
│   │   │   ├── SearchBar
│   │   │   ├── CartIcon (with badge)
│   │   │   └── UserMenu (dropdown)
│   │   │
│   │   ├── RouterView (page content)
│   │   │   ├── HomeView
│   │   │   │   ├── HeroBanner (carousel)
│   │   │   │   ├── CategoryCards
│   │   │   │   └── ProductGrid (featured)
│   │   │   │
│   │   │   ├── ProductDetailView
│   │   │   │   ├── Breadcrumb
│   │   │   │   ├── ProductGallery
│   │   │   │   ├── ProductInfo
│   │   │   │   ├── SizeSelector
│   │   │   │   ├── ColorSelector
│   │   │   │   ├── AddToCartButton
│   │   │   │   ├── ProductTabs
│   │   │   │   └── RelatedProducts
│   │   │   │
│   │   │   └── CartView
│   │   │       ├── CartItems
│   │   │       ├── CartSummary
│   │   │       └── CheckoutButton
│   │   │
│   │   └── AppFooter
│   │
│   ├── AuthLayout
│   │   ├── RouterView
│   │   │   ├── LoginView
│   │   │   └── RegisterView
│   │   └── AuthFooter
│   │
│   └── AdminLayout
│       ├── AdminSidebar
│       ├── AdminHeader
│       └── RouterView
│           ├── DashboardView
│           ├── AdminProductsView
│           └── AdminOrdersView
│
└── CartDrawer (portal/teleport)
├── ToastContainer (portal/teleport)
└── ModalContainer (portal/teleport)
```

### 2.3 State Management (Pinia)

#### Store Architecture

```javascript
// stores/index.js - Store Registry

import { createPinia } from 'pinia';

export const pinia = createPinia();

// Auth Store - User authentication state
export { useAuthStore } from './auth';

// Cart Store - Shopping cart state
export { useCartStore } from './cart';

// Products Store - Product listings & filters
export { useProductsStore } from './products';

// UI Store - UI state (modals, toasts, theme)
export { useUIStore } from './ui';

// Admin Store - Admin dashboard state
export { useAdminStore } from './admin';
```

#### Store Structure Example

```javascript
// stores/cart.js
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { cartApi } from '@/services/api';

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref([]);
  const isDrawerOpen = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters (Computed)
  const totalItems = computed(() => 
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const subtotal = computed(() => 
    items.value.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  );

  const isEmpty = computed(() => items.value.length === 0);

  // Actions
  async function fetchCart() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await cartApi.getCart();
      items.value = response.data.items;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function addToCart(productId, variantId, quantity) {
    isLoading.value = true;
    
    try {
      const response = await cartApi.addItem({ productId, variantId, quantity });
      await fetchCart(); // Refresh cart
      isDrawerOpen.value = true;
      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Persistence (localStorage)
  function persistToStorage() {
    localStorage.setItem('cart', JSON.stringify(items.value));
  }

  function restoreFromStorage() {
    const stored = localStorage.getItem('cart');
    if (stored) {
      items.value = JSON.parse(stored);
    }
  }

  return {
    // State
    items,
    isDrawerOpen,
    isLoading,
    error,
    // Getters
    totalItems,
    subtotal,
    isEmpty,
    // Actions
    fetchCart,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    openDrawer,
    closeDrawer,
  };
});
```

### 2.4 Routing Architecture

```javascript
// router/routes.js
export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: 'Adidas Việt Nam - Thương hiệu thể thao hàng đầu' }
      },
      {
        path: 'products/:slug',
        name: 'product-detail',
        component: () => import('@/views/product/ProductDetailView.vue'),
        meta: { title: 'Chi tiết sản phẩm' }
      },
      {
        path: 'category/:slug',
        name: 'category',
        component: () => import('@/views/category/CategoryView.vue'),
        meta: { title: 'Danh mục sản phẩm' }
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('@/views/SearchView.vue'),
        meta: { title: 'Tìm kiếm' }
      },
      {
        path: 'cart',
        name: 'cart',
        component: () => import('@/views/cart/CartView.vue'),
        meta: { title: 'Giỏ hàng', requiresAuth: true }
      },
      {
        path: 'checkout',
        name: 'checkout',
        component: () => import('@/views/checkout/CheckoutView.vue'),
        meta: { 
          title: 'Thanh toán', 
          requiresAuth: true 
        }
      },
      {
        path: 'order-success/:orderId',
        name: 'order-success',
        component: () => import('@/views/checkout/OrderSuccessView.vue'),
        meta: { title: 'Đặt hàng thành công' }
      },
    ]
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: 'Đăng nhập', guestOnly: true }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { title: 'Đăng ký', guestOnly: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/views/admin/AdminProductsView.vue'),
        meta: { title: 'Quản lý sản phẩm' }
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/views/admin/AdminOrdersView.vue'),
        meta: { title: 'Quản lý đơn hàng' }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/AdminUsersView.vue'),
        meta: { title: 'Quản lý người dùng' }
      }
    ]
  }
];
```

### 2.5 API Service Layer

```javascript
// services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 3. Backend Architecture (Node.js)

### 3.1 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js              # Main config loader
│   │   ├── database.js           # Supabase client
│   │   ├── redis.js              # Redis client
│   │   └── env.js                # Environment validation
│   │
│   ├── controllers/              # Request handlers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── addressController.js
│   │   ├── reviewController.js
│   │   └── admin/
│   │       ├── productAdminController.js
│   │       ├── orderAdminController.js
│   │       └── analyticsController.js
│   │
│   ├── services/                 # Business logic
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   ├── inventoryService.js   # With distributed locking
│   │   ├── cacheService.js       # Redis caching
│   │   ├── emailService.js
│   │   └── analyticsService.js
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access
│   │   ├── rateLimiter.js
│   │   ├── validator.js         # Request validation
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   ├── cors.js
│   │   ├── helmet.js            # Security headers
│   │   └── requestId.js
│   │
│   ├── routes/                  # API routes
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── addresses.js
│   │   ├── favorites.js
│   │   ├── banners.js
│   │   └── admin/
│   │       ├── index.js
│   │       ├── products.js
│   │       ├── orders.js
│   │       ├── users.js
│   │       └── analytics.js
│   │
│   ├── validators/              # Request validation schemas
│   │   ├── authValidator.js
│   │   ├── productValidator.js
│   │   ├── cartValidator.js
│   │   ├── orderValidator.js
│   │   └── commonValidator.js
│   │
│   ├── utils/                   # Utility functions
│   │   ├── logger.js            # Winston logger
│   │   ├── errors.js            # Custom error classes
│   │   ├── helpers.js
│   │   ├── slugify.js
│   │   └── pricing.js
│   │
│   ├── types/                   # TypeScript types (JSDoc)
│   │   ├── user.js
│   │   ├── product.js
│   │   ├── order.js
│   │   └── api.js
│   │
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── validators/
│   └── integration/
│
├── prisma/                      # Prisma schema (if using)
│   └── schema.prisma
│
├── package.json
├── .env.example
└── .eslintrc.js
```

### 3.2 Controller Architecture

```javascript
// controllers/productController.js

import { productService } from '@/services';
import { validate } from '@/middleware/validator';
import { productListSchema, productDetailSchema } from '@/validators/productValidator';
import { ApiError } from '@/utils/errors';

/**
 * @route   GET /api/v1/products
 * @desc    Get paginated product list
 * @access  Public
 */
export async function getProducts(req, res, next) {
  try {
    // Validate query params
    const validatedData = await validate(productListSchema, req.query);

    // Get from service (with caching)
    const result = await productService.getProducts(validatedData);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/v1/products/:slug
 * @desc    Get product detail by slug
 * @access  Public
 */
export async function getProductBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Sản phẩm không tồn tại');
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products with full-text search
 * @access  Public
 */
export async function searchProducts(req, res, next) {
  try {
    const { q, page = 1, per_page = 20 } = req.query;

    if (!q || q.length < 2) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Từ khóa tìm kiếm quá ngắn');
    }

    const result = await productService.searchProducts({
      query: q,
      page: parseInt(page),
      per_page: parseInt(per_page),
    });

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getProducts,
  getProductBySlug,
  searchProducts,
  getFeaturedProducts,
  getNewArrivals,
  getRelatedProducts,
};
```

### 3.3 Service Layer Architecture

```javascript
// services/productService.js

import { supabase } from '@/config/database';
import { cacheService } from './cacheService';
import { ApiError } from '@/utils/errors';

class ProductService {
  constructor() {
    this.cachePrefix = 'products';
    this.cacheTTL = 300; // 5 minutes
  }

  /**
   * Get paginated products with filters
   */
  async getProducts(params) {
    const {
      page = 1,
      per_page = 20,
      category,
      sort = 'newest',
      min_price,
      max_price,
      color,
      size,
      is_featured,
      is_new,
    } = params;

    // Generate cache key
    const cacheKey = this.generateCacheKey('list', params);

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name_vi, slug),
        images:product_images(id, url, is_primary)
      `)
      .eq('status', 'active');

    // Apply filters
    if (category) {
      query = query.eq('category.slug', category);
    }

    if (min_price) {
      query = query.gte('price', min_price);
    }

    if (max_price) {
      query = query.lte('price', max_price);
    }

    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured);
    }

    if (is_new !== undefined) {
      query = query.eq('is_new', is_new);
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('sold_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'DATABASE_ERROR', error.message);
    }

    const result = {
      data,
      meta: {
        page,
        per_page,
        total: count,
        total_pages: Math.ceil(count / per_page),
        has_next: page * per_page < count,
        has_prev: page > 1,
      },
    };

    // Cache result
    await cacheService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

    return result;
  }

  /**
   * Get product by slug with all details
   */
  async getProductBySlug(slug) {
    const cacheKey = `${this.cachePrefix}:detail:${slug}`;

    // Try cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*, parent:categories(*)),
        images:product_images(*),
        variants:product_variants(*, inventory(*))
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return null;
    }

    // Transform data
    const product = this.transformProductDetail(data);

    // Cache
    await cacheService.set(cacheKey, JSON.stringify(product), this.cacheTTL * 2);

    return product;
  }

  /**
   * Full-text search products
   */
  async searchProducts({ query, page = 1, per_page = 20 }) {
    const cacheKey = `${this.cachePrefix}:search:${query}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Use PostgreSQL full-text search
    const { data, error, count } = await supabase
      .from('products')
      .select(`
        id, name_vi, slug, price, thumbnail_url,
        category:categories(name_vi, slug)
      `, { count: 'exact' })
      .textSearch('search_vector', query, { type: 'websearch' })
      .eq('status', 'active')
      .order('rating', { ascending: false })
      .range((page - 1) * per_page, page * per_page - 1);

    if (error) {
      throw new ApiError(500, 'SEARCH_ERROR', error.message);
    }

    const result = {
      data,
      meta: {
        page,
        per_page,
        total: count,
        total_pages: Math.ceil(count / per_page),
      },
    };

    await cacheService.set(cacheKey, JSON.stringify(result), 60); // 1 min cache for search

    return result;
  }

  /**
   * Invalidate product cache
   */
  async invalidateCache(slug = null) {
    if (slug) {
      await cacheService.del(`${this.cachePrefix}:detail:${slug}`);
    }
    await cacheService.delPattern(`${this.cachePrefix}:list:*`);
    await cacheService.delPattern(`${this.cachePrefix}:search:*`);
  }

  /**
   * Generate unique cache key
   */
  generateCacheKey(type, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join(':');
    return `${this.cachePrefix}:${type}:${sortedParams}`;
  }

  /**
   * Transform product detail response
   */
  transformProductDetail(product) {
    return {
      id: product.id,
      name_vi: product.name_vi,
      name_en: product.name_en,
      slug: product.slug,
      description_vi: product.description_vi,
      price: product.price,
      original_price: product.original_price,
      rating: product.rating,
      review_count: product.review_count,
      images: product.images?.map(img => ({
        id: img.id,
        url: img.url,
        is_primary: img.is_primary,
      })),
      variants: product.variants?.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        color_code: v.color_code,
        price: product.price + (v.price_modifier || 0),
        is_available: v.inventory?.available_quantity > 0,
        stock_quantity: v.inventory?.available_quantity || 0,
      })),
      category: product.category,
    };
  }
}

export const productService = new ProductService();
```

### 3.4 Distributed Locking (Redis)

```javascript
// services/inventoryService.js

import { supabase } from '@/config/database';
import { redis } from '@/config/redis';
import { ApiError } from '@/utils/errors';

class InventoryService {
  constructor() {
    this.lockPrefix = 'inventory:lock:';
    this.lockTTL = 30000; // 30 seconds
    this.retryDelay = 100;
    this.maxRetries = 3;
  }

  /**
   * Reserve inventory with distributed locking
   * Prevents race condition when 2 users buy the same last item
   */
  async reserveInventoryWithLock(variantId, quantity, userId, orderId) {
    const lockKey = `${this.lockPrefix}${variantId}`;
    const lockValue = `${Date.now()}:${userId}:${orderId}`;

    // Try to acquire lock
    const lockAcquired = await this.acquireLock(lockKey, lockValue);

    if (!lockAcquired) {
      return {
        success: false,
        error: 'LOCK_FAILED',
        message: 'Sản phẩm đang được xử lý bởi người khác, vui lòng thử lại',
      };
    }

    try {
      // Check availability
      const inventory = await this.getInventory(variantId);

      if (!inventory) {
        return { success: false, error: 'INVENTORY_NOT_FOUND' };
      }

      if (inventory.available_quantity < quantity) {
        return {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          message: `Chỉ còn ${inventory.available_quantity} sản phẩm`,
        };
      }

      // Reserve inventory
      const updated = await this.updateInventoryReservation(
        variantId,
        quantity,
        'reserve'
      );

      return {
        success: true,
        reserved_quantity: quantity,
        remaining_stock: updated.available_quantity,
      };
    } finally {
      // Always release lock
      await this.releaseLock(lockKey, lockValue);
    }
  }

  /**
   * Acquire distributed lock
   */
  async acquireLock(key, value) {
    // SET NX PX - Set if not exists with expiry
    const result = await redis.set(key, value, {
      NX: true,
      PX: this.lockTTL,
    });

    return result === 'OK';
  }

  /**
   * Release distributed lock
   */
  async releaseLock(key, expectedValue) {
    // Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await redis.eval(script, 1, key, expectedValue);
  }

  /**
   * Get inventory for variant
   */
  async getInventory(variantId) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .single();

    if (error) {
      throw new ApiError(500, 'DATABASE_ERROR', error.message);
    }

    return {
      quantity: data.quantity,
      reserved_quantity: data.reserved_quantity,
      available_quantity: data.quantity - data.reserved_quantity,
    };
  }

  /**
   * Update inventory reservation
   */
  async updateInventoryReservation(variantId, quantity, action) {
    const updateData = action === 'reserve'
      ? { reserved_quantity: { increment: quantity } }
      : { reserved_quantity: { decrement: quantity } };

    const { data, error } = await supabase.rpc('update_inventory_reservation', {
      p_variant_id: variantId,
      p_quantity: quantity,
      p_action: action,
    });

    if (error) {
      throw new ApiError(500, 'DATABASE_ERROR', error.message);
    }

    return data;
  }

  /**
   * Deduct inventory on order confirmation
   */
  async deductInventory(variantId, quantity) {
    const { data, error } = await supabase.rpc('deduct_inventory', {
      p_variant_id: variantId,
      p_quantity: quantity,
    });

    if (error) {
      throw new ApiError(500, 'DEDUCT_ERROR', error.message);
    }

    return data;
  }
}

export const inventoryService = new InventoryService();
```

### 3.5 Middleware Architecture

```javascript
// middleware/auth.js

import jwt from 'jsonwebtoken';
import { supabase } from '@/config/database';
import { ApiError } from '@/utils/errors';

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'AUTH_TOKEN_REQUIRED', 'Vui lòng đăng nhập');
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      throw new ApiError(401, 'AUTH_USER_NOT_FOUND', 'Người dùng không tồn tại');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'AUTH_ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'AUTH_TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'AUTH_TOKEN_INVALID', 'Token không hợp lệ'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    return authenticate(req, res, next);
  } catch {
    // Silently continue without auth
    next();
  }
}

/**
 * Require specific roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'AUTH_REQUIRED', 'Vui lòng đăng nhập'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'PERMISSION_DENIED', 'Bạn không có quyền truy cập')
      );
    }

    next();
  };
}

export default {
  authenticate,
  optionalAuth,
  requireRole,
};
```

---

## 4. Database Architecture (Supabase)

### 4.1 Schema Design Principles

1. **Normalization**: Third Normal Form (3NF)
2. **Indexing Strategy**: Composite indexes for common queries
3. **Partitioning**: By date for orders table (future)
4. **Full-text Search**: Vietnamese tsvector index
5. **RLS**: Row Level Security on all tables

### 4.2 Database Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRESQL                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                         │
│  │  profiles   │◄──────── Auth.users (1:1)                              │
│  │  (extends)  │                                                         │
│  └──────┬──────┘                                                         │
│         │                                                                │
│         │ 1:N                                                           
│         ▼                                                                │
│  ┌─────────────┐     N:1     ┌─────────────┐                             │
│  │  cart_items │────────────│  products   │──────► N:1 categories       
│  └─────────────┘             └──────┬──────┘                             │
│                                      │                                    │
│  ┌─────────────┐                    │         ┌──────────────────┐       │
│  │   orders    │────────────────────┼────────│ product_variants │       │
│  └──────┬──────┘                    │         └────────┬─────────┘       │
│         │                           │                  │                  │
│         │ 1:N                       │                  │ 1:1              │
│         ▼                           ▼                  ▼                  │
│  ┌─────────────┐             ┌─────────────┐   ┌─────────────┐          │
│  │ order_items │             │product_images│   │  inventory  │          │
│  └─────────────┘             └─────────────┘   └─────────────┘          │
│                                                                         │
│  ┌─────────────┐                                                         │
│  │ favorites   │◄──────── products (N:1)                                 │
│  └─────────────┘                                                         │
│                                                                         │
│  ┌─────────────┐                                                         │
│  │ addresses   │◄──────── profiles (N:1)                                 │
│  └─────────────┘                                                         │
│                                                                         │
│  ┌─────────────┐                                                         │
│  │ categories  │◄──────── products (N:1, self-ref for hierarchy)         
│  └─────────────┘                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 RLS (Row Level Security) Architecture

```sql
-- Example: RLS Policy for Cart Items

-- 1. Users can only SELECT their own cart items
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

-- 2. Users can only INSERT to their own cart
CREATE POLICY "Users can add to own cart"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Users can only UPDATE their own cart
CREATE POLICY "Users can update own cart"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Users can only DELETE their own cart items
CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);

-- Example: Admin can access all
CREATE POLICY "Admin can view all orders"
ON orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 4.4 Indexing Strategy

```sql
-- Performance indexes for common queries

-- Product listing (most common query)
CREATE INDEX idx_products_category_status 
ON products(category_id, status) 
WHERE status = 'active';

-- Featured products
CREATE INDEX idx_products_featured 
ON products(is_featured, created_at DESC) 
WHERE is_featured = true;

-- User orders
CREATE INDEX idx_orders_user_created 
ON orders(user_id, created_at DESC);

-- Cart items for user
CREATE INDEX idx_cart_user_selected 
ON cart_items(user_id, is_selected) 
WHERE is_selected = true;

-- Inventory availability
CREATE INDEX idx_inventory_variant_available 
ON inventory(variant_id, available_quantity) 
WHERE available_quantity > 0;

-- Full-text search
CREATE INDEX idx_products_search_vector 
ON products USING GIN(search_vector);

-- Covering indexes for read performance
CREATE INDEX idx_products_list_covering 
ON products(status, category_id, created_at DESC)
INCLUDE (id, name_vi, price, slug, thumbnail_url);
```

---

## 5. Caching Architecture (Redis)

### 5.1 Cache Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CACHE HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   L1: In-Memory (Application)                                           │
│   ├── Hot data (current user's cart)                                   │
│   └── Frequently accessed (category list)                               │
│                                                                         │
│   L2: Redis (Distributed)                                               │
│   ├── Product listings (TTL: 5 min)                                    │
│   ├── Product details (TTL: 10 min)                                    │
│   ├── Category tree (TTL: 1 hour)                                      │
│   └── Search results (TTL: 1 min)                                      │
│                                                                         │
│   L3: Database (Supabase PostgreSQL)                                   │
│   └── Source of truth                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cache Key Patterns

```javascript
// Cache key naming convention: {entity}:{type}:{identifier}

// Product cache keys
products:list:category_giay:page_1:sort_newest    // TTL: 5 min
products:detail:giay-ultraboost-22                 // TTL: 10 min
products:search:ultraboost:page_1                  // TTL: 1 min
products:featured:limit_12                         // TTL: 5 min

// Category cache keys
categories:tree                                     // TTL: 1 hour
categories:detail:giay                             // TTL: 1 hour

// Cart cache keys
cart:user_123                                      // TTL: 24 hours

// Lock keys
inventory:lock:var_456:user_789                    // TTL: 30 sec

// Session keys
session:user_123                                   // TTL: 7 days
```

### 5.3 Cache Invalidation Strategy

```javascript
// Event-driven cache invalidation

// When product is updated
productService.on('updated', async (product) => {
  // Invalidate detail cache
  await cache.del(`products:detail:${product.slug}`);
  
  // Invalidate all list caches (pattern)
  await cache.delPattern('products:list:*');
  
  // Invalidate search caches
  await cache.delPattern('products:search:*');
});

// When inventory changes
inventoryService.on('changed', async (variantId) => {
  // Invalidate related product detail
  const product = await getProductByVariant(variantId);
  await cache.del(`products:detail:${product.slug}`);
});
```

---

## 6. Security Architecture

### 6.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Network Security                                      │   │
│  │  ├── HTTPS everywhere                                           │   │
│  │  ├── CDN (Cloudflare) for DDoS protection                       │   │
│  │  └── WAF (Web Application Firewall)                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 2: Application Security                                   │   │
│  │  ├── Helmet.js (Security headers)                                │   │
│  │  ├── CORS configuration                                          │   │
│  │  ├── Rate limiting                                               │   │
│  │  └── Input validation & sanitization                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 3: Authentication & Authorization                        │   │
│  │  ├── JWT tokens (1h expiry)                                     │   │
│  │  ├── Refresh tokens (7 days)                                    │   │
│  │  ├── Google OAuth 2.0                                           │   │
│  │  └── Role-based access control (RBAC)                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 4: Database Security                                     │   │
│  │  ├── Row Level Security (RLS)                                   │   │
│  │  ├── Parameterized queries (no SQL injection)                   │   │
│  │  └── Least privilege principle                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 JWT Token Architecture

```javascript
// Token structure

// Access Token Payload
{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1705312800,
  "exp": 1705316400  // +1 hour
}

// Refresh Token Payload
{
  "sub": "user-uuid-123",
  "type": "refresh",
  "iat": 1705312800,
  "exp": 1705917600  // +7 days
}
```

### 6.3 Rate Limiting

```javascript
// Rate limit configuration

const rateLimits = {
  // General API - 100 requests/minute
  general: {
    windowMs: 60 * 1000,
    max: 100,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  },
  
  // Auth endpoints - 5 requests/minute
  auth: {
    windowMs: 60 * 1000,
    max: 5,
    message: 'Quá nhiều lần thử, vui lòng đợi'
  },
  
  // Search - 30 requests/minute
  search: {
    windowMs: 60 * 1000,
    max: 30,
    message: 'Quá nhiều tìm kiếm'
  },
  
  // Cart operations - 20 requests/minute
  cart: {
    windowMs: 60 * 1000,
    max: 20,
    message: 'Thao tác quá nhanh'
  },
};
```

---

## 7. Deployment Architecture

### 7.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NETLIFY DEPLOYMENT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                        GIT REPOSITORY                              │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐                            │   │
│   │  │ main    │  │develop  │  │ PR #123 │                            │   │
│   │  │ (prod)  │  │ (staging)│  │(preview)│                            │   │
│   │  └────┬────┘  └────┬────┘  └────┬────┘                            │   │
│   └───────┼───────────┼───────────┼────────────────────────────────────┘   │
│           │           │           │                                        │
│           │           │           ▼                                        │
│           │           │    ┌─────────────┐                                 │
│           │           │    │   Netlify   │                                 │
│           │           │    │   Preview   │                                 │
│           │           │    │  Deploy #123│                                 │
│           │           │    └─────────────┘                                 │
│           │           │           │                                        │
│           │           ▼           │                                        │
│           │    ┌─────────────┐     │                                        │
│           │    │   Staging    │     │                                        │
│           │    │  Deploy      │     │                                        │
│           │    └─────────────┘     │                                        │
│           │           │           │                                        │
│           ▼           │           │                                        │
│    ┌─────────────┐    │           │                                        │
│    │ Production  │    │           │                                        │
│    │ Deploy      │    │           │                                        │
│    └─────────────┘    │           │                                        │
│           │           │           │                                        │
└───────────┼───────────┼───────────┼────────────────────────────────────────┘
            │           │           │
            ▼           ▼           ▼
    ┌───────────────────────────────────────────┐
    │              CDN EDGE NETWORK             │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
    │  │Singapore│ │Vietnam  │ │HongKong │    │
    │  └─────────┘ └─────────┘ └─────────┘    │
    └───────────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────┐
    │           SUPABASE (Database)              │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
    │  │PostgreSQL│ │  Auth   │ │ Storage │      │
    │  └─────────┘ └─────────┘ └─────────┘      │
    └───────────────────────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────┐
    │              REDIS (Cache)                │
    │  ┌─────────────────────────────────┐     │
    │  │ Upstash / Redis Cloud           │     │
    │  └─────────────────────────────────┘     │
    └───────────────────────────────────────────┘
```

### 7.2 Environment Configuration

```bash
# Frontend (.env.production)
VITE_API_URL=https://api.adidas-clone.vn/v1
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GA_ID=G-XXXXXXXXXX

# Backend (.env.production)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=<32-char-secret>
REDIS_URL=redis://...
CORS_ORIGIN=https://adidas-clone.vn
```

### 7.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: Lint & Type Check
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  # Job 2: Unit Tests
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  # Job 3: Build
  build:
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  # Job 4: Deploy Preview (PR)
  deploy-preview:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: ashleycheung/setup-netlify@v1
        with:
          publish-dir: ./dist
          production-deploy: false
      - name: Deploy preview
        run: netlify deploy --dir=dist --prod=false
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  # Job 5: Deploy Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://adidas-clone.vn
    steps:
      - uses: actions/checkout@v3
      - uses: ashleycheung/setup-netlify@v1
        with:
          publish-dir: ./dist
          production-deploy: true
      - name: Deploy to production
        run: netlify deploy --dir=dist --prod=true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  # Job 6: Lighthouse Performance
  lighthouse:
    runs-on: ubuntu-latest
    needs: [deploy-production]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Run Lighthouse CI
        run: npm run test:lighthouse
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## 8. Monitoring & Logging

### 8.1 Logging Architecture

```javascript
// utils/logger.js

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    
    // File transport (error only in production)
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport (all logs)
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Morgan middleware for HTTP request logging
export const httpLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});
```

### 8.2 Error Tracking

```javascript
// Sentry integration for error tracking

import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new RewriteFrames({
      root: global.__rootdir__,
    }),
  ],
  tracesSampler: (samplingContext) => {
    if (samplingContext.transactionContext.name.includes('health')) {
      return 0;
    }
    return 0.1;
  },
  beforeSend(event) {
    // Filter out expected errors
    if (event.exception?.values?.[0]?.type === 'ApiError') {
      return null;
    }
    return event;
  },
});

// Express error handler with Sentry
app.use((err, req, res, next) => {
  if (err.statusCode === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  Sentry.captureException(err);
  logger.error('Unhandled error', { err, req: req.path });

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Đã xảy ra lỗi' 
        : err.message,
    },
  });
});
```

### 8.3 Health Check

```javascript
// routes/health.js

import express from 'express';
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'adidas-clone-api',
    version: process.env.VERSION || '1.0.0',
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check database
    await supabase.from('profiles').select('id').limit(1);
    health.checks.database = 'healthy';
  } catch {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Check Redis
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const status = health.status || 'healthy';
  res.status(status === 'healthy' ? 200 : 503).json(health);
});

export default router;
```

---

## 9. Performance Optimization

### 9.1 Frontend Optimizations

```javascript
// vite.config.js - Build optimizations

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-utils': ['axios', 'lodash-es'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios'],
  },
  css: {
    devSourcemap: true,
  },
});
```

### 9.2 Image Optimization

```vue
<!-- ProductCard.vue -->
<template>
  <img 
    :src="optimizedImageUrl"
    :alt="product.name_vi"
    loading="lazy"
    decoding="async"
    srcset="
      ${imageUrl}?w=300 300w,
      ${imageUrl}?w=600 600w,
      ${imageUrl}?w=900 900w
    "
    sizes="
      (max-width: 640px) 100vw,
      (max-width: 1024px) 50vw,
      33vw
    "
  />
</template>

<script setup>
const optimizedImageUrl = computed(() => {
  const baseUrl = product.thumbnail_url;
  return `${baseUrl}?w=600&format=webp&quality=80`;
});
</script>
```

### 9.3 Database Query Optimization

```sql
-- Use covering indexes for faster reads
CREATE INDEX idx_products_covering 
ON products(status, category_id, created_at DESC)
INCLUDE (id, name_vi, slug, price, thumbnail_url);

-- Partial indexes for active records
CREATE INDEX idx_products_active 
ON products(created_at DESC) 
WHERE status = 'active';

-- Use materialized views for complex aggregations
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', created_at);

CREATE UNIQUE INDEX ON monthly_sales(month);

-- Refresh concurrently
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
```

---

## 10. Scalability Considerations

### 10.1 Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       HORIZONTAL SCALING                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        Load Balancer                                    │
│                     (Netlify CDN)                                       │
│                           │                                             │
│         ┌─────────────────┼─────────────────┐                          │
│         │                 │                 │                          │
│         ▼                 ▼                 ▼                          │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐                    │
│   │  Server 1 │     │  Server 2 │     │  Server 3 │                    │
│   │  (Node.js) │     │  (Node.js) │     │  (Node.js) │                    │
│   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘                    │
│         │                 │                 │                          │
│         └────────────┬────┴─────────────────┘                          │
│                      │                                                 │
│                      ▼                                                 │
│              ┌───────────────┐                                         │
│              │    Redis      │ ◄── Cache Layer                         │
│              │   (Shared)    │ ◄── Sessions                            │
│              └───────┬───────┘                                         │
│                      │                                                 │
│                      ▼                                                 │
│              ┌───────────────┐                                         │
│              │   Supabase    │ ◄── Database                            │
│              │  PostgreSQL   │ ◄── Auth                                │
│              └───────────────┘                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Database Sharding (Future)

- Shard by user_id for orders table
- Shard by category for products (future)
- Use Supabase BRIN indexes for time-series data

### 10.3 CDN Strategy

```javascript
// Image CDN configuration
const cdnConfig = {
  domains: ['images.adidas-clone.vn'],
  formats: ['image/avif', 'image/webp', 'image/jpeg'],
  quality: 80,
  resize: {
    small: 300,
    medium: 600,
    large: 900,
    xlarge: 1200,
  },
  transforms: {
    thumbnail: '?w=300&h=300&fit=crop',
    productCard: '?w=600&h=600&fit=crop',
    productDetail: '?w=1200&fit=max',
  },
};
```

---

## 11. Disaster Recovery

### 11.1 Backup Strategy

```yaml
# Supabase Backup Configuration
backups:
  - name: daily_backup
    schedule: "0 2 * * *"  # 2 AM daily
    retention: 30_days
    type: full
    
  - name: point_in_time
    schedule: continuous
    retention: 7_days
    type: incremental
```

### 11.2 Recovery Plan

1. **Database Failure**: Restore from latest backup (< 24h data loss)
2. **Redis Failure**: Rebuild cache from database (cache warm-up)
3. **Frontend Failure**: Instant failover via Netlify CDN
4. **Full Outage**: Multi-region deployment (Phase 2)

---

**Document Version:** 1.0
**Last Updated:** 2026-05-13
**Author:** Architecture Team
**Status:** Approved for Implementation
