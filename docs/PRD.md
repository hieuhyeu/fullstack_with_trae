# PRD - Product Requirements Document
# Dự án: Adidas Clone Vietnam (adidas.vn)

---

## 1. Tổng Quan Sản Phẩm

### 1.1 Vision & Mission

**Vision:** Tạo ra một nền tảng thương mại điện tử Nike chuyên nghiệp, mang đến trải nghiệm mua sắm Adidas chính hãng tốt nhất tại Việt Nam với hiệu suất cao và giao diện người dùng hiện đại.

**Mission:** Cung cấp giải pháp e-commerce end-to-end với:
- Frontend Vue.js tốc độ cao
- Backend Node.js scalable
- Database Supabase với RLS security
- Deployment Netlify tự động

### 1.2 Target Users

| User Segment | Mô tả | Primary Goals |
|-------------|-------|---------------|
| **Khách hàng Việt Nam** | Người mua sắm online 18-45 tuổi | Tìm kiếm, so sánh, mua giày Adidas |
| **Admin/Manager** | Nhân viên quản lý cửa hàng | Quản lý sản phẩm, đơn hàng, kho |
| **Investors** | Nhà đầu tư tiềm năng | Demo prototype với 100+ sản phẩm |

### 1.3 Success Metrics

- **Performance:** Lighthouse Score ≥ 90, Load time < 3s (3G)
- **Functionality:** Test coverage ≥ 80%
- **Scalability:** Hỗ trợ 1000+ concurrent users
- **Security:** Zero SQL injection, XSS protection

---

## 2. User Stories & Features

### 2.1 Customer Features

#### 🔐 Authentication
```
US-001: Đăng ký tài khoản
├── Actor: Guest user
├── Trigger: Click "Đăng ký" button
├── Precondition: Chưa có tài khoản
├── Flow:
│   1. User nhập email, password, full_name
│   2. System validate input
│   3. System tạo user trong Supabase Auth
│   4. System redirect về homepage
│   5. Hiển thị toast "Đăng ký thành công"
├── Postcondition: User đã login, có thể mua hàng
└── Acceptance: Email unique, password ≥ 8 chars

US-002: Đăng nhập Google OAuth
├── Actor: Guest user
├── Trigger: Click "Đăng nhập với Google"
├── Flow:
│   1. Redirect to Google OAuth
│   2. User authorize app
│   3. Google callback with token
│   4. System create/update user
│   5. Redirect về homepage
└── Acceptance: User login thành công

US-003: Đăng xuất
├── Actor: Logged-in user
├── Flow:
│   1. Click "Đăng xuất"
│   2. Clear local session
│   3. Redirect về homepage
└── Acceptance: Session cleared
```

#### 🛍️ Product Browsing
```
US-010: Xem trang chủ
├── Actor: Any user
├── Trigger: Access homepage "/"
├── Flow:
│   1. Load hero banners (3-5 slides)
│   2. Load category cards
│   3. Load featured products (8-12 items)
│   4. Load new arrivals section
│   5. Display newsletter signup
└── Acceptance: Page load < 3s

US-011: Tìm kiếm sản phẩm
├── Actor: Any user
├── Trigger: Type in search bar
├── Flow:
│   1. User nhập ≥ 2 ký tự
│   2. Show autocomplete suggestions (debounce 300ms)
│   3. User chọn hoặc Enter
│   4. Navigate to /search?q={keyword}
│   5. Display filtered results
└── Acceptance: Search results relevant

US-012: Xem chi tiết sản phẩm
├── Actor: Any user
├── Trigger: Click product card
├── Flow:
│   1. Navigate to /products/{slug}
│   2. Load product details
│   3. Load image gallery
│   4. Load size/color variants
│   5. Load related products
│   6. Load reviews
└── Acceptance: All info displayed correctly

US-013: Lọc sản phẩm theo category
├── Actor: Any user
├── Trigger: Click category menu
├── Flow:
│   1. Navigate to /category/{slug}
│   2. Load category header
│   3. Load products (pagination 20/page)
│   4. Show filter sidebar
│   5. Allow sort by: price, newest, popular
└── Acceptance: Filters work correctly
```

#### 🛒 Cart & Checkout
```
US-020: Thêm vào giỏ hàng
├── Actor: Logged-in customer
├── Trigger: Click "Thêm vào giỏ"
├── Precondition: Đã chọn size/color
├── Flow:
│   1. Validate size/color selected
│   2. Check inventory availability
│   3. Add to cart_items table
│   4. Update cart store (Pinia)
│   5. Open cart drawer
│   6. Show success toast
└── Acceptance: Item in cart, badge updated

US-021: Cập nhật số lượng trong giỏ
├── Actor: Logged-in customer
├── Trigger: Click +/- buttons
├── Flow:
│   1. Validate new quantity (1-10)
│   2. Check inventory
│   3. Update cart_items
│   4. Recalculate total
│   5. Update UI
└── Acceptance: Quantity updated, total correct

US-022: Xóa item khỏi giỏ
├── Actor: Logged-in customer
├── Trigger: Click delete icon
├── Flow:
│   1. Remove from cart_items
│   2. Update store
│   3. Recalculate total
│   4. Update UI
└── Acceptance: Item removed

US-023: Checkout
├── Actor: Logged-in customer
├── Trigger: Click "Thanh toán"
├── Flow:
│   1. Validate cart not empty
│   2. Show checkout form
│   3. Enter shipping address
│   4. Select payment method
│   5. Review order summary
│   6. Confirm order
│   7. Create order + order_items
│   8. Deduct inventory (distributed lock)
│   9. Clear cart
│   10. Redirect to success page
└── Acceptance: Order created, inventory updated
```

#### 📦 Order Management
```
US-030: Xem lịch sử đơn hàng
├── Actor: Logged-in customer
├── Trigger: Click "Đơn hàng của tôi"
├── Flow:
│   1. Load orders from orders table
│   2. Display order list with status
│   3. Show order date, total, status
└── Acceptance: All user orders displayed

US-031: Xem chi tiết đơn hàng
├── Actor: Logged-in customer
├── Trigger: Click order item
├── Flow:
│   1. Load order + order_items
│   2. Display order details
│   3. Show tracking timeline
│   4. Show shipping address
└── Acceptance: Complete order info shown

US-032: Hủy đơn hàng
├── Actor: Logged-in customer
├── Trigger: Click "Hủy đơn"
├── Precondition: Order status = 'pending' or 'confirmed'
├── Flow:
│   1. Confirm cancellation
│   2. Update order status = 'cancelled'
│   3. Restore inventory
│   4. Show success message
└── Acceptance: Order cancelled, stock restored
```

### 2.2 Admin Features

#### 📦 Product Management
```
US-100: CRUD sản phẩm
├── Actor: Admin
├── Flow:
│   1. Navigate to /admin/products
│   2. View product list (datagrid)
│   3. Click "Thêm mới" / "Sửa" / "Xóa"
│   4. Fill product form
│   5. Upload images
│   6. Set variants & inventory
│   7. Save to database
└── Acceptance: Product CRUD works

US-101: Quản lý tồn kho
├── Actor: Admin
├── Flow:
│   1. Navigate to /admin/inventory
│   2. View stock levels
│   3. Update quantity
│   4. Set low stock alerts
└── Acceptance: Inventory accurate
```

#### 📊 Order Management
```
US-110: Xem & cập nhật đơn hàng
├── Actor: Admin
├── Flow:
│   1. Navigate to /admin/orders
│   2. View all orders
│   3. Filter by status
│   4. Update order status
│   5. Add tracking notes
└── Acceptance: Status updates reflected
```

#### 📈 Analytics Dashboard
```
US-120: Xem dashboard analytics
├── Actor: Admin
├── Flow:
│   1. Navigate to /admin
│   2. View KPI cards
│   3. View revenue chart
│   4. View top products
│   5. View low stock alerts
└── Acceptance: Data accurate & real-time
```

---

## 3. Non-Functional Requirements

### 3.1 Performance
| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 3s (3G) | Lighthouse |
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| API Response Time | < 500ms | APM |
| Cache Hit Ratio | ≥ 70% | Redis metrics |

### 3.2 Security
- **Authentication:** JWT tokens với 24h expiry
- **Authorization:** RBAC (customer, admin roles)
- **Data Protection:** RLS policies on all tables
- **Input Validation:** All user inputs sanitized
- **HTTPS:** All traffic encrypted

### 3.3 Accessibility (WCAG 2.1 AA)
- Semantic HTML elements
- Keyboard navigation support
- ARIA labels on interactive elements
- Color contrast ratio ≥ 4.5:1
- Focus indicators visible

### 3.4 SEO
- Meta tags for all pages
- Structured data (JSON-LD)
- sitemap.xml generation
- robots.txt configuration
- Open Graph tags for social sharing

---

## 4. Technical Stack

### 4.1 Frontend
```
Vue 3 (Composition API)
├── Vite (Build tool)
├── Pinia (State management)
├── Vue Router 4 (Routing)
├── Tailwind CSS 3 (Styling)
├── VueUse (Composables)
├── Swiper.js (Carousels)
├── Axios (HTTP client)
└── VeeValidate (Form validation)
```

### 4.2 Backend
```
Node.js 18+
├── Express.js (Framework)
├── Supabase JS (Database client)
├── Redis (Caching)
├── JWT (Authentication)
├── Express Validator (Input validation)
├── Helmet (Security headers)
└── CORS (Cross-origin)
```

### 4.3 Database (Supabase)
```
PostgreSQL 15
├── Row Level Security (RLS)
├── Full-text search (Vietnamese)
├── Realtime subscriptions
├── Storage (Images)
└── Auth (Google OAuth)
```

### 4.4 Infrastructure
```
Netlify
├── Frontend hosting
├── CI/CD auto-deploy
├── Preview deployments
└── CDN distribution

Redis (Upstash/Redis Cloud)
├── Product caching
├── Session storage
└── Distributed locking
```

---

## 5. MVP Scope

### 5.1 Must Have (MVP)
- ✅ User registration/login (email + Google OAuth)
- ✅ Product browsing (home, category, search, detail)
- ✅ Cart operations (add, update, remove)
- ✅ Checkout flow (basic)
- ✅ Order history
- ✅ Admin: Product CRUD
- ✅ Admin: Order management
- ✅ Mock data: 100+ products

### 5.2 Should Have (Phase 2)
- [ ] Advanced search filters
- [ ] Product reviews & ratings
- [ ] Wishlist functionality
- [ ] Size guide modal
- [ ] Order tracking
- [ ] Email notifications

### 5.3 Nice to Have (Phase 3)
- [ ] Loyalty/reward points
- [ ] Coupon/Promotion system
- [ ] Multiple shipping options
- [ ] Payment gateway integration (VNPay, MoMo)
- [ ] Mobile app (React Native)

---

## 6. Project Structure

### 6.1 Monorepo Structure
```
adidas-clone/
├── frontend/                 # Vue.js customer site
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── layouts/
│   │   ├── router/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── utils/
│   │   ├── views/
│   │   ├── App.vue
│   │   └── main.js
│   ├── tests/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── supabase/                  # Database migrations
│   ├── migrations/
│   └── config.toml
│
├── docs/                      # Documentation
│   ├── README.md
│   ├── API.md
│   └── DEPLOY.md
│
├── .github/                    # CI/CD
│   └── workflows/
│
├── package.json               # Root workspace
└── README.md
```

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase rate limits | High | Medium | Implement Redis caching |
| OAuth integration fails | High | Low | Fallback to email/password |
| Inventory race condition | High | Medium | Redis distributed locking |
| SEO crawl issues | Medium | Low | Proper meta tags, sitemap |
| Mobile responsiveness | Medium | Low | Mobile-first design |

---

## 8. Out of Scope

- Payment gateway integration (MVP cash on delivery only)
- Multi-language support (VN only for MVP)
- Inventory warehouse management
- Supplier management
- Returns & refunds flow
- Mobile native app
- Offline mode
- Social login other than Google

---

## 9. Success Criteria

### 9.1 Technical
- ✅ All 15 user stories implemented
- ✅ Lighthouse score ≥ 90
- ✅ Test coverage ≥ 80%
- ✅ Zero critical bugs
- ✅ Production deployment successful

### 9.2 Business
- ✅ Demo-able for investors
- ✅ 100+ products displayed
- ✅ Complete checkout flow
- ✅ Admin dashboard functional

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-13  
**Author:** Development Team  
**Status:** Ready for Development
