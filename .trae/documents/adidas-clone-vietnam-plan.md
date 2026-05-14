# Kế Hoạch Triển Khai Dự Án Adidas Clone Vietnam

## 📋 Tổng Quan Dự Án

**Mục tiêu:** Xây dựng hệ thống e-commerce production-ready clone trang adidas.vn hoàn chỉnh với frontend Vue.js và backend Node.js + Supabase.

**Phạm vi:** 8 phase triển khai, đảm bảo quality standards và testing coverage ≥80%

---

## 🗄️ PHASE 1: Database Schema & Supabase Setup

### 1.1 Thiết kế Database Schema

**Bảng chính cần tạo:**

```
1. users (Extended from Supabase Auth)
   - id (UUID, primary key)
   - email (unique)
   - full_name
   - phone
   - role (enum: 'customer', 'admin')
   - avatar_url
   - created_at, updated_at

2. categories
   - id (UUID, primary key)
   - name_vi (Tiếng Việt)
   - name_en (English)
   - slug (URL-friendly)
   - parent_id (self-referential FK)
   - image_url
   - sort_order
   - is_active

3. products
   - id (UUID, primary key)
   - name_vi, name_en
   - slug
   - description_vi, description_en
   - price (DECIMAL)
   - original_price
   - category_id (FK)
   - brand
   - rating (DECIMAL)
   - review_count
   - is_featured, is_active
   - created_at, updated_at

4. product_variants
   - id (UUID, primary key)
   - product_id (FK)
   - size (VARCHAR: '38', '39', '40', etc.)
   - color (VARCHAR)
   - color_code (HEX)
   - sku
   - price_modifier (extra cost)

5. inventory
   - id (UUID, primary key)
   - variant_id (FK)
   - quantity
   - reserved_quantity
   - warehouse_location
   - last_restocked

6. product_images
   - id (UUID, primary key)
   - product_id (FK)
   - url
   - alt_text_vi, alt_text_en
   - is_primary
   - sort_order

7. orders
   - id (UUID, primary key)
   - user_id (FK)
   - status (enum: pending, confirmed, processing, shipped, delivered, cancelled)
   - total_amount
   - shipping_address (JSONB)
   - payment_method
   - payment_status
   - notes
   - created_at

8. order_items
   - id (UUID, primary key)
   - order_id (FK)
   - product_id (FK)
   - variant_id (FK)
   - quantity
   - unit_price
   - subtotal

9. cart_items
   - id (UUID, primary key)
   - user_id (FK)
   - product_id (FK)
   - variant_id (FK)
   - quantity
   - created_at, updated_at
```

### 1.2 Cấu hình Supabase

**Row Level Security (RLS) Policies:**
- Users chỉ đọc/ghi cart_items của chính mình
- Admin có full access
- Products public read-only
- Orders chỉ user sở hữu mới thấy

**Indexes cần tạo:**
- `idx_products_category` on products(category_id)
- `idx_products_slug` on products(slug)
- `idx_inventory_variant` on inventory(variant_id)
- `idx_orders_user` on orders(user_id)
- `idx_cart_user` on cart_items(user_id)

**Full-text Search:**
- Tạo search vector cho products (name + description)
- Sử dụng `to_tsvector('vietnamese', ...)` cho search tiếng Việt

### 1.3 Storage Buckets

```
1. product-images (public bucket)
   - Folder structure: /products/{product_id}/
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/webp

2. user-avatars (private bucket)
   - Folder structure: /avatars/{user_id}/
```

---

## 🖥️ PHASE 2: Backend API Development (Node.js + Express)

### 2.1 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js (Supabase client)
│   │   ├── redis.js (Redis client)
│   │   └── env.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js (JWT verification)
│   │   ├── rbac.js (Role-based access)
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   ├── inventoryService.js
│   │   └── cacheService.js (Redis)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── validators.js
│   └── app.js
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── .env.example
```

### 2.2 API Endpoints chi tiết

**Authentication:**
```
POST   /api/auth/register      - Đăng ký tài khoản
POST   /api/auth/login         - Đăng nhập
POST   /api/auth/google        - Google OAuth
GET    /api/auth/me            - Lấy profile hiện tại
PUT    /api/auth/profile       - Cập nhật profile
POST   /api/auth/logout        - Đăng xuất
```

**Products:**
```
GET    /api/products           - Danh sách sản phẩm (pagination, filter, sort)
GET    /api/products/:slug     - Chi tiết sản phẩm
GET    /api/products/search    - Full-text search
GET    /api/products/featured  - Sản phẩm nổi bật
GET    /api/categories          - Danh sách categories
GET    /api/categories/:slug   - Sản phẩm theo category
```

**Cart:**
```
GET    /api/cart               - Lấy cart hiện tại
POST   /api/cart/items         - Thêm vào cart
PUT    /api/cart/items/:id     - Cập nhật số lượng
DELETE /api/cart/items/:id     - Xóa khỏi cart
DELETE /api/cart               - Clear cart
```

**Orders:**
```
POST   /api/orders             - Tạo order từ cart
GET    /api/orders             - Lịch sử orders
GET    /api/orders/:id         - Chi tiết order
PUT    /api/orders/:id/cancel  - Hủy order
```

**Admin (Protected):**
```
CRUD   /api/admin/products     - Quản lý sản phẩm
CRUD   /api/admin/categories   - Quản lý categories
GET    /api/admin/orders       - Quản lý orders
PUT    /api/admin/orders/:id   - Cập nhật order status
CRUD   /api/admin/inventory    - Quản lý inventory
GET    /api/admin/analytics    - Dashboard analytics
GET    /api/admin/users        - Quản lý users
```

### 2.3 Redis Caching Strategy

**Cache Keys:**
```
products:list:{page}:{filters}:{sort}  - TTL: 5 minutes
products:detail:{slug}                 - TTL: 10 minutes
categories:tree                        - TTL: 1 hour
cart:{user_id}                         - TTL: 24 hours
```

**Distributed Locking cho Inventory:**
```javascript
// Khi user checkout, lock variant trong 30 giây
LOCK_KEY = `inventory:lock:${variant_id}:${user_id}`
LOCK_VALUE = timestamp + random

// Sử dụng SETNX với expiration
// Nếu lock thành công -> proceed checkout
// Nếu lock fail -> báo "Sản phẩm đang được xử lý bởi người khác"
```

---

## 🎨 PHASE 3: Frontend Customer Site (Vue.js)

### 3.1 Project Structure

```
frontend/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppFooter.vue
│   │   │   ├── ProductCard.vue
│   │   │   └── LoadingSpinner.vue
│   │   ├── product/
│   │   │   ├── ProductGrid.vue
│   │   │   ├── ProductGallery.vue
│   │   │   ├── SizeSelector.vue
│   │   │   └── ColorSelector.vue
│   │   ├── cart/
│   │   │   ├── CartDrawer.vue
│   │   │   └── CartItem.vue
│   │   └── checkout/
│   │       └── CheckoutForm.vue
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── ProductDetailView.vue
│   │   ├── CategoryView.vue
│   │   ├── SearchView.vue
│   │   ├── CartView.vue
│   │   ├── CheckoutView.vue
│   │   ├── OrderSuccessView.vue
│   │   └── auth/
│   │       ├── LoginView.vue
│   │       └── RegisterView.vue
│   ├── stores/
│   │   ├── auth.js (Pinia)
│   │   ├── cart.js
│   │   ├── products.js
│   │   └── ui.js
│   ├── composables/
│   │   ├── useProducts.js
│   │   ├── useCart.js
│   │   └── useAuth.js
│   ├── router/
│   │   └── index.js
│   ├── services/
│   │   └── api.js (Axios instance)
│   ├── utils/
│   │   └── helpers.js
│   ├── App.vue
│   └── main.js
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── tests/
├── package.json
└── vite.config.js
```

### 3.2 Component Library

**Core Components cần xây dựng:**

1. **AppHeader.vue** (sticky, responsive)
   - Logo
   - Navigation menu
   - Search bar với autocomplete
   - User dropdown (login/logout)
   - Cart icon với badge count
   - Mobile hamburger menu

2. **ProductCard.vue**
   - Product image với hover effect
   - Product name, price
   - Quick add to cart button
   - Wishlist icon
   - Sale badge nếu có

3. **ProductGallery.vue**
   - Main image với zoom on hover
   - Thumbnail gallery
   - Lightbox modal

4. **SizeSelector.vue**
   - Size buttons grid
   - Disable unavailable sizes
   - Size guide modal

5. **CartDrawer.vue**
   - Slide-in from right
   - Item list với quantity controls
   - Subtotal calculation
   - Checkout button

### 3.3 Views chi tiết

**HomeView.vue:**
- Hero banner carousel (3-5 slides)
- Category cards grid
- Featured products section
- New arrivals section
- Newsletter signup

**ProductDetailView.vue:**
- Breadcrumb navigation
- Product gallery với zoom
- Size & color selectors
- Size guide modal
- Add to cart button
- Product description tabs
- Related products carousel
- Reviews section

**CategoryView.vue:**
- Category header
- Filter sidebar (size, color, price range)
- Sort dropdown
- Product grid với infinite scroll
- Pagination

### 3.4 State Management (Pinia)

```javascript
// stores/cart.js
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    isDrawerOpen: false
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  },
  actions: {
    async fetchCart(),
    async addToCart(productId, variantId, quantity),
    async updateQuantity(itemId, quantity),
    async removeItem(itemId)
  }
})
```

### 3.5 Performance Optimization

**Lazy Loading:**
```vue
<!-- Route-based code splitting -->
const ProductDetail = () => import('./views/ProductDetailView.vue')

<!-- Image lazy loading -->
<img v-lazy="src" />

<!-- Infinite scroll cho product lists -->
<infinite-scroll @load-more="loadProducts" />
```

**Caching Strategy:**
- Service Worker cho static assets
- LocalStorage cho cart persistence
- SWR (Stale-While-Revalidate) cho API calls

---

## 📊 PHASE 4: Admin Dashboard

### 4.1 Admin Views

```
admin/
├── DashboardView.vue        - Analytics overview
├── products/
│   ├── ProductListView.vue  - Product table với CRUD
│   └── ProductFormView.vue  - Add/Edit form
├── categories/
│   └── CategoryView.vue
├── orders/
│   ├── OrderListView.vue
│   └── OrderDetailView.vue
├── inventory/
│   └── InventoryView.vue    - Stock management
├── users/
│   └── UserListView.vue
└── settings/
    └── SettingsView.vue
```

### 4.2 Features

1. **Dashboard Analytics:**
   - Total revenue (today, week, month)
   - Orders count by status
   - Top selling products
   - Low stock alerts
   - Revenue chart (Chart.js)

2. **Product Management:**
   - DataGrid với search, filter, sort
   - Bulk actions (activate, deactivate, delete)
   - Image upload với preview
   - Rich text editor cho description

3. **Order Management:**
   - Status timeline view
   - Update status với notes
   - Print invoice
   - Export CSV

4. **Inventory Management:**
   - Stock level indicators
   - Restock form
   - Low stock notifications
   - Warehouse assignment

---

## 🧪 PHASE 5: Testing (≥80% Coverage)

### 5.1 Backend Tests (Jest + Supertest)

**Unit Tests:**
```javascript
// tests/unit/services/productService.test.js
describe('ProductService', () => {
  test('should filter products by category')
  test('should apply pagination correctly')
  test('should calculate total pages')
  test('should sort products by price')
})

// tests/unit/services/cartService.test.js
describe('CartService', () => {
  test('should add item to cart')
  test('should update quantity')
  test('should prevent negative quantity')
  test('should calculate total correctly')
})

// tests/unit/services/inventoryService.test.js
describe('InventoryService', () => {
  test('should reserve inventory')
  test('should release inventory on timeout')
  test('should handle concurrent reservations')
})
```

**Integration Tests:**
```javascript
// tests/integration/auth.test.js
describe('Authentication Flow', () => {
  test('should register new user')
  test('should login with valid credentials')
  test('should reject invalid credentials')
  test('should handle Google OAuth')
})

// tests/integration/cart.test.js
describe('Cart Operations', () => {
  test('should add product to cart')
  test('should checkout cart successfully')
  test('should handle inventory conflict')
})
```

### 5.2 Frontend Tests (Jest + Vue Test Utils)

**Component Tests:**
```javascript
// tests/unit/components/ProductCard.test.js
describe('ProductCard', () => {
  test('should render product info')
  test('should emit add-to-cart event')
  test('should show sale badge when discounted')
})

// tests/unit/components/CartDrawer.test.js
describe('CartDrawer', () => {
  test('should open/close drawer')
  test('should display cart items')
  test('should calculate total')
  test('should update quantity')
})
```

**Page Tests:**
```javascript
// tests/integration/HomePage.test.js
describe('HomePage', () => {
  test('should load hero banners')
  test('should display featured products')
  test('should navigate to product detail')
})
```

### 5.3 Test Coverage Targets

```
Frontend: ≥ 80%
├── Components: 85%
├── Composables: 75%
└── Utils: 80%

Backend: ≥ 80%
├── Controllers: 85%
├── Services: 80%
├── Middleware: 75%
└── Utils: 80%
```

---

## 🚀 PHASE 6: CI/CD Pipeline

### 6.1 GitHub Actions Workflows

**.github/workflows/ci.yml:**
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run ESLint
        run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build
        run: npm run build
```

**.github/workflows/deploy-preview.yml:**
```yaml
name: Deploy Preview
on: pull_request
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: ./dist
          production-deploy: false
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**.github/workflows/deploy-production.yml:**
```yaml
name: Deploy Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Trigger Netlify deploy
        run: |
          curl -X POST -H "Content-Type: application/json" \
            -d '{"hook_url": "${{ secrets.NETLIFY_HOOK_URL }}"}' \
            https://api.netlify.com/api/v1/hooks
```

### 6.2 Database Migration Strategy

**Supabase Migrations:**
```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_rls_policies.sql
├── 003_add_indexes.sql
├── 004_seed_products.sql
└── 005_add_analytics_functions.sql
```

**Migration execution:**
- Manual trigger qua Supabase dashboard
- Hoặc CLI: `supabase db push`

---

## 📖 PHASE 7: Documentation

### 7.1 README.md (Tiếng Việt)

**Nội dung:**
1. Giới thiệu dự án
2. Tính năng chính
3. Tech stack
4. Prerequisites
5. Setup local development
6. Environment variables
7. Database setup guide
8. Deployment guide
9. API documentation links
10. Testing guide
11. Contributing guidelines

### 7.2 API Documentation (Swagger/OpenAPI)

**swagger.yaml endpoints:**
- Authentication APIs
- Product APIs
- Cart APIs
- Order APIs
- Admin APIs

**Interactive docs URL:** `/api/docs`

### 7.3 Supabase Setup Guide

**Nội dung chi tiết:**
1. Tạo Supabase project
2. Run migrations
3. Enable Google OAuth
4. Configure RLS policies
5. Setup storage buckets
6. Environment variables reference

---

## 📁 PHASE 8: Mock Data & Demo

### 8.1 Mock API với 100+ Products

**Seed data categories:**
- Giày thể thao (40 products)
- Áo (30 products)
- Quần (20 products)
- Phụ kiện (20 products)

**Mock data structure:**
```javascript
// mock/products.js
export const products = [
  {
    id: 'uuid-1',
    name_vi: 'Giày Ultraboost 22',
    name_en: 'Ultraboost 22 Shoes',
    slug: 'giay-ultraboost-22',
    price: 4500000,
    original_price: 5000000,
    category_id: 'cat-shoes',
    images: [...],
    variants: [...],
    rating: 4.8,
    review_count: 256
  },
  // ... 99 more products
]
```

### 8.2 Demo Features

**Pre-configured scenarios:**
1. User đăng nhập thành công
2. Thêm sản phẩm vào cart
3. Checkout thành công
4. Admin login và quản lý
5. Inventory conflict demo

---

## ✅ Checklist Hoàn Thành

### Phase 1: Database ✓
- [ ] Schema design
- [ ] Supabase setup
- [ ] RLS policies
- [ ] Indexes
- [ ] Storage buckets

### Phase 2: Backend ✓
- [ ] Project structure
- [ ] All API endpoints
- [ ] Redis caching
- [ ] Distributed locking
- [ ] Error handling

### Phase 3: Frontend ✓
- [ ] All views
- [ ] Components
- [ ] State management
- [ ] Routing
- [ ] Performance optimization

### Phase 4: Admin ✓
- [ ] Dashboard
- [ ] Product CRUD
- [ ] Order management
- [ ] Inventory management
- [ ] Analytics

### Phase 5: Testing ✓
- [ ] Unit tests
- [ ] Integration tests
- [ ] Coverage ≥ 80%
- [ ] Performance tests

### Phase 6: CI/CD ✓
- [ ] GitHub Actions
- [ ] Preview deployments
- [ ] Production deployment

### Phase 7: Documentation ✓
- [ ] README tiếng Việt
- [ ] API docs
- [ ] Supabase guide

### Phase 8: Demo ✓
- [ ] 100+ mock products
- [ ] Demo scenarios

---

## ⏱️ Timeline Ước Tính

| Phase | Thời gian | Giai đoạn |
|-------|-----------|-----------|
| Phase 1 | 1-2 ngày | Database & Supabase |
| Phase 2 | 3-4 ngày | Backend API |
| Phase 3 | 5-7 ngày | Frontend Customer |
| Phase 4 | 2-3 ngày | Admin Dashboard |
| Phase 5 | 2-3 ngày | Testing |
| Phase 6 | 1 ngày | CI/CD |
| Phase 7 | 1 ngày | Documentation |
| Phase 8 | 1 ngày | Mock Data |
| **Tổng** | **16-22 ngày** | **Full System** |

---

## 🎯 Quality Gates

**Trước khi deliver:**
1. ✅ Lighthouse Score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
2. ✅ Test Coverage ≥ 80%
3. ✅ Tất cả tests pass
4. ✅ ESLint/Prettier clean
5. ✅ Security scan passed
6. ✅ Production build success
7. ✅ Deploy verified

**Performance Targets:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Load time on 3G: < 3s

---

## 📦 Deliverables

1. ✅ Source code repository với clear structure
2. ✅ Database schema & migrations
3. ✅ API documentation (Swagger)
4. ✅ Unit & Integration tests
5. ✅ CI/CD pipeline configuration
6. ✅ README tiếng Việt chi tiết
7. ✅ Demo deployment URLs
8. ✅ Performance & coverage reports
