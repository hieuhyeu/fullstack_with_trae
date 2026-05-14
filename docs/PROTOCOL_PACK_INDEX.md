# Protocol Pack Index
# Dự án: Adidas Clone Vietnam (adidas.vn)

---

## 📦 Protocol Pack Overview

Đây là bộ tài liệu protocol pack hoàn chỉnh cho dự án Adidas Clone Vietnam, được thiết kế theo tiêu chuẩn production-grade với stack Vue.js + Node.js + Supabase + Netlify.

---

## 📚 Documents List

### 1. PRD.md - Product Requirements Document
**Mục đích:** Định nghĩa sản phẩm, user stories, và requirements

**Nội dung chính:**
- Tổng quan sản phẩm (Vision & Mission)
- User Stories chi tiết (15 stories chính)
- Non-functional requirements (Performance, Security, Accessibility)
- Tech Stack overview
- MVP Scope
- Project Structure

**Sử dụng cho:**
- Planning phase
- Sprint planning
- Requirement validation
- Stakeholder alignment

---

### 2. DATAMODEL.md - Database Schema Specification
**Mục đích:** Thiết kế database hoàn chỉnh với Supabase PostgreSQL

**Nội dung chính:**
- 14 tables đầy đủ (profiles, categories, products, variants, inventory, orders, etc.)
- Row Level Security (RLS) policies
- Indexes cho performance
- Functions & Triggers (business logic)
- Supabase Storage buckets
- Migration files structure

**Tables chính:**
```
profiles → users (auth.users)
categories → products → product_variants → inventory
           → product_images
orders → order_items
cart_items
favorites
addresses
banners
promotions
```

**Sử dụng cho:**
- Database setup (Supabase Dashboard)
- Migration creation
- Data integrity validation
- RLS policy development

---

### 3. API.md - RESTful API Specification
**Mục đích:** Định nghĩa tất cả API endpoints

**Nội dung chính:**
- Authentication APIs (register, login, Google OAuth, refresh token)
- Product APIs (list, detail, search, autocomplete, featured)
- Category APIs (tree, detail, products by category)
- Cart APIs (CRUD, apply promo)
- Order APIs (create, list, detail, cancel)
- Address APIs (CRUD, default address)
- Review APIs
- Admin APIs (product CRUD, order management, analytics)
- Webhook APIs
- Error codes
- Rate limiting

**Endpoints:** 50+ endpoints đầy đủ

**Sử dụng cho:**
- Backend development
- Frontend API integration
- API documentation (Swagger/OpenAPI)
- Testing strategy

---

### 4. TEST_STRATEGY.md - Chiến lược Kiểm thử
**Mục đích:** Đảm bảo chất lượng code với test coverage ≥ 80%

**Nội dung chính:**
- Test Pyramid (Unit → Integration → E2E)
- Unit Tests (Product Service, Cart Service, Inventory Service, Validators)
- Integration Tests (Auth flow, Cart & Checkout flow)
- Component Tests (Vue components với Vue Test Utils)
- E2E Tests (Playwright - critical user flows)
- Performance Tests (Lighthouse CI, k6 load testing)
- Security Tests (SQL injection, XSS prevention)
- CI/CD Integration (GitHub Actions)

**Test Coverage Target:**
- Backend: ≥ 80%
- Frontend: ≥ 80%
- Integration: 30-50 tests
- E2E: 10-20 tests

**Sử dụng cho:**
- Writing unit tests
- CI/CD pipeline setup
- Performance benchmarking
- Security auditing

---

### 5. ARCHITECTURE.md - Kiến trúc Hệ thống
**Mục đích:** Thiết kế architecture tổng thể cho hệ thống

**Nội dung chính:**
- System Overview (layered architecture diagram)
- Frontend Architecture (Vue.js structure, Component hierarchy, Pinia stores, Router)
- Backend Architecture (Node.js/Express, Controllers, Services, Middleware)
- Database Architecture (Supabase, RLS, Indexing strategy)
- Caching Architecture (Redis cache, cache invalidation)
- Security Architecture (JWT, RBAC, Rate limiting, Helmet)
- Deployment Architecture (Netlify, CI/CD pipeline)
- Monitoring & Logging (Winston, Sentry)
- Performance Optimization
- Scalability Considerations

**Sử dụng cho:**
- Code generation
- Architecture review
- Performance optimization
- Scaling planning

---

## 🎯 How to Use This Protocol Pack

### Phase 1: Understanding (Ngày 1)
1. **Đọc PRD.md** để hiểu sản phẩm cần xây dựng
2. **Đọc ARCHITECTURE.md** để hiểu tổng quan hệ thống
3. **Đọc DATAMODEL.md** để nắm database schema

### Phase 2: Database Setup (Ngày 2-3)
1. **Sử dụng DATAMODEL.md** để tạo Supabase tables
2. **Tạo migration files** theo cấu trúc trong docs
3. **Cấu hình RLS policies**
4. **Setup storage buckets**
5. **Seed data** (categories, admin user)

### Phase 3: Backend Development (Ngày 4-8)
1. **Sử dụng ARCHITECTURE.md** để setup project structure
2. **Implement API endpoints** theo API.md
3. **Viết unit tests** theo TEST_STRATEGY.md
4. **Cấu hình Redis caching**
5. **Implement distributed locking**

### Phase 4: Frontend Development (Ngày 9-15)
1. **Sử dụng ARCHITECTURE.md** để setup Vue.js project
2. **Implement components** theo Component hierarchy
3. **Implement stores** (Pinia)
4. **Setup routing**
5. **API integration**
6. **Viết component tests**

### Phase 5: Testing (Ngày 16-18)
1. **Chạy integration tests**
2. **Chạy E2E tests**
3. **Performance testing** (Lighthouse)
4. **Fix bugs**

### Phase 6: Deployment (Ngày 19-20)
1. **Setup Netlify**
2. **Configure CI/CD**
3. **Deploy production**

---

## 🔗 Document Dependencies

```
PRD.md (Sản phẩm cần xây dựng)
    │
    ├── DATAMODEL.md (Dữ liệu cần quản lý)
    │       │
    │       └── API.md (Endpoints để CRUD data)
    │
    ├── ARCHITECTURE.md (Kiến trúc hệ thống)
    │       │
    │       ├── Frontend (Vue.js structure)
    │       ├── Backend (Node.js structure)
    │       └── Infrastructure (Supabase, Redis, Netlify)
    │
    └── TEST_STRATEGY.md (Đảm bảo chất lượng)
            │
            ├── Unit Tests
            ├── Integration Tests
            └── E2E Tests
```

---

## 📊 Quick Reference

### Tech Stack Matrix

| Layer | Technology | Document Reference |
|-------|------------|-------------------|
| Frontend | Vue.js 3, Vite, Tailwind | ARCHITECTURE.md (Section 2) |
| State | Pinia | ARCHITECTURE.md (Section 2.3) |
| Backend | Node.js, Express | ARCHITECTURE.md (Section 3) |
| Database | Supabase PostgreSQL | DATAMODEL.md |
| Auth | Supabase Auth + JWT | API.md, ARCHITECTURE.md (Section 6) |
| Cache | Redis | ARCHITECTURE.md (Section 5) |
| Deployment | Netlify | ARCHITECTURE.md (Section 7) |
| CI/CD | GitHub Actions | TEST_STRATEGY.md (Section 9) |

### API Endpoints Summary

| Category | Endpoints | CRUD Operations |
|----------|-----------|-----------------|
| Auth | 8 | Register, Login, OAuth, Profile |
| Products | 7 | List, Detail, Search, Featured |
| Categories | 3 | List, Detail, Products |
| Cart | 7 | CRUD, Apply Promo |
| Orders | 4 | Create, List, Detail, Cancel |
| Addresses | 5 | CRUD, Default |
| Admin | 10+ | Products, Orders, Users, Analytics |

### Database Tables Summary

| Table | Type | RLS | Purpose |
|-------|------|-----|---------|
| profiles | Base | Yes | User profiles |
| categories | Base | Yes | Product categories |
| products | Base | Yes | Product catalog |
| product_variants | Base | Yes | Size/Color variants |
| product_images | Base | Yes | Product images |
| inventory | Base | Yes | Stock management |
| orders | Base | Yes | Customer orders |
| order_items | Base | Yes | Order line items |
| cart_items | Base | Yes | Shopping cart |
| favorites | Base | Yes | Wishlist |
| addresses | Base | Yes | Saved addresses |
| banners | Content | Yes | Homepage banners |
| promotions | Content | Yes | Discount codes |

---

## 🚀 Quick Start Checklist

### Prerequisites
- [ ] Node.js 18+
- [ ] npm or yarn
- [ ] Supabase account
- [ ] GitHub account
- [ ] Netlify account

### Database Setup
- [ ] Tạo Supabase project
- [ ] Run migrations từ DATAMODEL.md
- [ ] Setup RLS policies
- [ ] Configure storage buckets
- [ ] Enable Google OAuth

### Backend Setup
- [ ] Clone backend template
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Run migrations
- [ ] Test API endpoints

### Frontend Setup
- [ ] Clone frontend template
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Start development server
- [ ] Run tests

### Deployment
- [ ] Connect GitHub to Netlify
- [ ] Configure environment variables
- [ ] Deploy staging
- [ ] Deploy production
- [ ] Setup monitoring

---

## 📞 Support & Resources

### Internal Documents
- [PRD.md](PRD.md) - Product Requirements
- [DATAMODEL.md](DATAMODEL.md) - Database Schema
- [API.md](API.md) - API Documentation
- [TEST_STRATEGY.md](TEST_STRATEGY.md) - Testing Strategy
- [ARCHITECTURE.md](ARCHITECTURE.md) - System Architecture

### External Resources
- [Vue.js Documentation](https://vuejs.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

## 📝 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-13 | Dev Team | Initial protocol pack |

---

**Protocol Pack Version:** 1.0  
**Created:** 2026-05-13  
**Last Updated:** 2026-05-13  
**Status:** ✅ Ready for Implementation  
**Total Documents:** 5  
**Total Pages (estimated):** ~150 pages  
**Coverage:** Full-stack E-commerce System
