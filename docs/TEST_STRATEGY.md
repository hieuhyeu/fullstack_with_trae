# Test Strategy - Chiến Lược Kiểm Thử
# Dự án: Adidas Clone Vietnam (adidas.vn)

---

## 1. Tổng Quan Chiến Lược

### 1.1 Mục Tiêu Chất Lượng

| Metric | Target | Current |
|--------|--------|---------|
| Code Coverage | ≥ 80% | - |
| Test Pass Rate | 100% | - |
| Critical Bugs | 0 | - |
| High Bugs | < 3 | - |
| Lighthouse Score | ≥ 90 | - |
| API Response Time | < 500ms | - |
| Build Success Rate | 100% | - |

### 1.2 Test Pyramid

```
                    ┌─────────────────┐
                    │      E2E        │  ← Playwright/Cypress
                    │    (10 tests)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │         Integration          │  ← Supertest
              │        (30-50 tests)          │
              └──────────────┬──────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │              Unit Tests              │  ← Jest
         │            (100-150 tests)           │
         └─────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │          Performance & Security            │
    │    (Lighthouse, k6, Security scans)        │
    └─────────────────────────────────────────────┘
```

### 1.3 Testing Scope

**In Scope:**
- ✅ Unit tests cho services, utilities, validators
- ✅ Integration tests cho API endpoints
- ✅ Component tests cho Vue components
- ✅ E2E tests cho critical user flows
- ✅ Performance tests (Lighthouse, load testing)
- ✅ Security tests (SQL injection, XSS)
- ✅ Accessibility tests (WCAG 2.1 AA)

**Out of Scope:**
- Visual regression tests (Phase 2)
- Load testing với >1000 concurrent users (Phase 2)
- Cross-browser testing IE11

---

## 2. Test Environment Setup

### 2.1 Test Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                      TEST ENVIRONMENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐      ┌─────────────┐      ┌───────────┐ │
│   │ Jest + Vue  │      │   Supertest  │      │ Playwright │ │
│   │ Test Utils  │      │   (API)      │      │  (E2E)     │ │
│   └──────┬──────┘      └──────┬──────┘      └─────┬─────┘ │
│          │                    │                    │        │
│          └────────────────────┼────────────────────┘        │
│                               │                              │
│                    ┌──────────▼──────────┐                   │
│                    │   Test Database     │                   │
│                    │   (PostgreSQL)      │                   │
│                    └──────────┬──────────┘                   │
│                               │                              │
│                    ┌──────────▼──────────┐                   │
│                    │   Redis (Mocked)    │                   │
│                    └─────────────────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Environment Configuration

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/adidas_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret-key-123456
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

### 2.3 Test Database Setup

```javascript
// tests/setup/database.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setupTestDatabase() {
  // Run migrations
  await execAsync('npx prisma migrate deploy');
  
  // Seed test data
  await execAsync('npm run db:seed:test');
}

export async function teardownTestDatabase() {
  // Reset database
  await execAsync('npm run db:reset:test');
}

export async function clearAllTables() {
  // Clear all data but keep schema
  await prisma.$executeRaw`
    TRUNCATE TABLE 
      profiles, categories, products, 
      product_variants, product_images, 
      inventory, cart_items, orders, 
      order_items, favorites, addresses
    CASCADE
  `;
}
```

---

## 3. Backend Testing

### 3.1 Unit Tests

#### 3.1.1 Product Service Tests

```javascript
// backend/tests/unit/services/productService.test.js

describe('ProductService', () => {
  let productService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      products: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    productService = new ProductService(mockPrisma);
  });

  describe('getProducts', () => {
    test('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name_vi: 'Product 1', price: 100 },
        { id: '2', name_vi: 'Product 2', price: 200 },
      ];
      
      mockPrisma.products.findMany.mockResolvedValue(mockProducts);
      mockPrisma.products.count.mockResolvedValue(50);

      const result = await productService.getProducts({
        page: 1,
        per_page: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(50);
      expect(result.meta.total_pages).toBe(3);
      expect(mockPrisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      );
    });

    test('should filter by category', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(0);

      await productService.getProducts({ category: 'giay' });

      expect(mockPrisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'giay' },
          }),
        })
      );
    });

    test('should filter by price range', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(0);

      await productService.getProducts({
        min_price: 1000000,
        max_price: 5000000,
      });

      expect(mockPrisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: 1000000,
              lte: 5000000,
            },
          }),
        })
      );
    });

    test('should sort by price ascending', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(0);

      await productService.getProducts({ sort: 'price_asc' });

      expect(mockPrisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
    });

    test('should sort by newest first', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(0);

      await productService.getProducts({ sort: 'newest' });

      expect(mockPrisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: 'desc' },
        })
      );
    });

    test('should perform full-text search', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.products.count.mockResolvedValue(0);

      await productService.getProducts({ search: 'ultraboost' });

      expect(mockPrisma.products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            search_vector: expect.anything(),
          }),
        })
      );
    });
  });

  describe('getProductBySlug', () => {
    test('should return product with variants and images', async () => {
      const mockProduct = {
        id: '1',
        name_vi: 'Ultraboost 22',
        slug: 'ultraboost-22',
        variants: [{ id: 'v1', size: '42', color: 'Black' }],
        images: [{ id: 'i1', url: 'http://...', is_primary: true }],
      };

      mockPrisma.products.findUnique.mockResolvedValue(mockProduct);

      const result = await productService.getProductBySlug('ultraboost-22');

      expect(result.slug).toBe('ultraboost-22');
      expect(result.variants).toHaveLength(1);
      expect(result.images).toHaveLength(1);
    });

    test('should throw NotFoundError for non-existent product', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(null);

      await expect(
        productService.getProductBySlug('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createProduct', () => {
    test('should create product with auto-generated slug', async () => {
      const input = {
        name_vi: 'Giày Mới',
        price: 2000000,
      };

      const created = {
        id: '1',
        ...input,
        slug: 'giay-moi',
      };

      mockPrisma.products.create.mockResolvedValue(created);

      const result = await productService.createProduct(input);

      expect(result.slug).toBe('giay-moi');
      expect(mockPrisma.products.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.any(String),
          }),
        })
      );
    });

    test('should reject duplicate slug', async () => {
      mockPrisma.products.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint',
          'P2002',
          '1.0'
        )
      );

      await expect(
        productService.createProduct({ name_vi: 'Duplicate', price: 100 })
      ).rejects.toThrow(ConflictError);
    });
  });
});
```

#### 3.1.2 Cart Service Tests

```javascript
// backend/tests/unit/services/cartService.test.js

describe('CartService', () => {
  let cartService;
  let mockPrisma;
  let mockRedis;

  beforeEach(() => {
    mockPrisma = {
      cart_items: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      products: { findUnique: jest.fn() },
      product_variants: { findUnique: jest.fn() },
      inventory: { findUnique: jest.fn() },
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    cartService = new CartService(mockPrisma, mockRedis);
  });

  describe('getCart', () => {
    test('should return cart with computed totals', async () => {
      const mockItems = [
        {
          id: 'item1',
          quantity: 2,
          product: { price: 1000000 },
          variant: { price_modifier: 0 },
        },
        {
          id: 'item2',
          quantity: 1,
          product: { price: 500000 },
          variant: { price_modifier: 50000 },
        },
      ];

      mockPrisma.cart_items.findMany.mockResolvedValue(mockItems);

      const result = await cartService.getCart('user-123');

      expect(result.items).toHaveLength(2);
      expect(result.item_count).toBe(3);
      expect(result.subtotal).toBe(2550000);
    });

    test('should return empty cart when no items', async () => {
      mockPrisma.cart_items.findMany.mockResolvedValue([]);

      const result = await cartService.getCart('user-123');

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
    });
  });

  describe('addToCart', () => {
    const mockProduct = {
      id: 'prod-1',
      name_vi: 'Test Product',
      price: 1000000,
      status: 'active',
    };

    const mockVariant = {
      id: 'var-1',
      product_id: 'prod-1',
      is_active: true,
    };

    const mockInventory = {
      variant_id: 'var-1',
      available_quantity: 10,
    };

    test('should add new item to cart', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product_variants.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrisma.cart_items.findUnique.mockResolvedValue(null);
      mockPrisma.cart_items.create.mockResolvedValue({
        id: 'new-item',
        product_id: 'prod-1',
        variant_id: 'var-1',
        quantity: 1,
      });

      const result = await cartService.addToCart('user-1', {
        product_id: 'prod-1',
        variant_id: 'var-1',
        quantity: 1,
      });

      expect(result.quantity).toBe(1);
      expect(mockPrisma.cart_items.create).toHaveBeenCalled();
    });

    test('should update quantity if item already in cart', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product_variants.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrisma.cart_items.findUnique.mockResolvedValue({
        id: 'existing-item',
        quantity: 1,
      });
      mockPrisma.cart_items.update.mockResolvedValue({
        id: 'existing-item',
        quantity: 3,
      });

      const result = await cartService.addToCart('user-1', {
        product_id: 'prod-1',
        variant_id: 'var-1',
        quantity: 2,
      });

      expect(result.quantity).toBe(3);
      expect(mockPrisma.cart_items.update).toHaveBeenCalled();
    });

    test('should throw error if quantity exceeds limit', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product_variants.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrisma.cart_items.findUnique.mockResolvedValue(null);

      await expect(
        cartService.addToCart('user-1', {
          product_id: 'prod-1',
          variant_id: 'var-1',
          quantity: 15,
        })
      ).rejects.toThrow(ValidationError);
    });

    test('should throw error if insufficient stock', async () => {
      mockPrisma.products.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product_variants.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.inventory.findUnique.mockResolvedValue({
        variant_id: 'var-1',
        available_quantity: 5,
      });
      mockPrisma.cart_items.findUnique.mockResolvedValue(null);

      await expect(
        cartService.addToCart('user-1', {
          product_id: 'prod-1',
          variant_id: 'var-1',
          quantity: 10,
        })
      ).rejects.toThrow(InsufficientStockError);
    });

    test('should throw error if product inactive', async () => {
      mockPrisma.products.findUnique.mockResolvedValue({
        ...mockProduct,
        status: 'discontinued',
      });

      await expect(
        cartService.addToCart('user-1', {
          product_id: 'prod-1',
          variant_id: 'var-1',
          quantity: 1,
        })
      ).rejects.toThrow(ProductNotAvailableError);
    });
  });

  describe('updateCartItem', () => {
    test('should update quantity correctly', async () => {
      mockPrisma.cart_items.findUnique.mockResolvedValue({
        id: 'item-1',
        quantity: 1,
        variant: { product: { price: 100 } },
      });
      mockPrisma.inventory.findUnique.mockResolvedValue({
        available_quantity: 10,
      });
      mockPrisma.cart_items.update.mockResolvedValue({
        id: 'item-1',
        quantity: 5,
      });

      const result = await cartService.updateCartItem('user-1', 'item-1', 5);

      expect(result.quantity).toBe(5);
    });

    test('should reject negative quantity', async () => {
      await expect(
        cartService.updateCartItem('user-1', 'item-1', 0)
      ).rejects.toThrow(ValidationError);
    });

    test('should reject quantity > 10', async () => {
      await expect(
        cartService.updateCartItem('user-1', 'item-1', 11)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('removeFromCart', () => {
    test('should remove item from cart', async () => {
      mockPrisma.cart_items.findUnique.mockResolvedValue({
        id: 'item-1',
        user_id: 'user-1',
      });

      await cartService.removeFromCart('user-1', 'item-1');

      expect(mockPrisma.cart_items.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    test('should throw error if item not found', async () => {
      mockPrisma.cart_items.findUnique.mockResolvedValue(null);

      await expect(
        cartService.removeFromCart('user-1', 'item-1')
      ).rejects.toThrow(NotFoundError);
    });

    test('should throw error if item belongs to different user', async () => {
      mockPrisma.cart_items.findUnique.mockResolvedValue({
        id: 'item-1',
        user_id: 'user-2',
      });

      await expect(
        cartService.removeFromCart('user-1', 'item-1')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
```

#### 3.1.3 Inventory Service Tests (Distributed Locking)

```javascript
// backend/tests/unit/services/inventoryService.test.js

describe('InventoryService', () => {
  let inventoryService;
  let mockPrisma;
  let mockRedis;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      inventory: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      eval: jest.fn(),
    };

    inventoryService = new InventoryService(mockPrisma, mockRedis);
  });

  describe('reserveInventory', () => {
    test('should reserve inventory successfully', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variant_id: 'var-1',
        quantity: 100,
        reserved_quantity: 10,
        available_quantity: 90,
      });

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockRedis.set.mockResolvedValue('OK');

      const result = await inventoryService.reserveInventory(
        'var-1',
        5,
        'order-123'
      );

      expect(result.success).toBe(true);
      expect(result.reserved_quantity).toBe(5);
    });

    test('should fail if insufficient available quantity', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variant_id: 'var-1',
        quantity: 10,
        reserved_quantity: 8,
        available_quantity: 2,
      });

      const result = await inventoryService.reserveInventory(
        'var-1',
        5,
        'order-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_STOCK');
    });

    test('should handle concurrent reservations with distributed lock', async () => {
      const lockKey = 'inventory:lock:var-1:order-456';
      const lockValue = Date.now().toString();

      mockRedis.set.mockImplementation(async (key, value, options) => {
        if (key === lockKey) {
          return 'OK';
        }
        return 'OK';
      });

      mockRedis.eval.mockResolvedValue(1);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variant_id: 'var-1',
        quantity: 5,
        reserved_quantity: 0,
        available_quantity: 5,
      });

      const result = await inventoryService.reserveInventoryWithLock(
        'var-1',
        3,
        'order-456',
        { timeout: 5000 }
      );

      expect(result.success).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        lockKey,
        expect.any(String),
        expect.objectContaining({ nx: true, px: 5000 })
      );
    });

    test('should release lock after timeout', async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await inventoryService.reserveInventoryWithLock(
        'var-1',
        3,
        'order-456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('LOCK_TIMEOUT');
    });
  });

  describe('deductInventory', () => {
    test('should deduct inventory on order confirmation', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variant_id: 'var-1',
        quantity: 100,
        reserved_quantity: 10,
      });

      mockPrisma.inventory.update.mockResolvedValue({
        id: 'inv-1',
        quantity: 95,
        reserved_quantity: 5,
      });

      const result = await inventoryService.deductInventory('var-1', 5);

      expect(result.quantity).toBe(95);
      expect(result.reserved_quantity).toBe(5);
    });
  });

  describe('releaseInventory', () => {
    test('should release reserved inventory on order cancel', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variant_id: 'var-1',
        quantity: 100,
        reserved_quantity: 10,
      });

      mockPrisma.inventory.update.mockResolvedValue({
        id: 'inv-1',
        quantity: 100,
        reserved_quantity: 5,
      });

      const result = await inventoryService.releaseInventory('var-1', 5);

      expect(result.reserved_quantity).toBe(5);
    });

    test('should not allow reserved_quantity to go negative', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variant_id: 'var-1',
        quantity: 100,
        reserved_quantity: 3,
      });

      mockPrisma.inventory.update.mockResolvedValue({
        id: 'inv-1',
        quantity: 100,
        reserved_quantity: 0,
      });

      const result = await inventoryService.releaseInventory('var-1', 10);

      expect(result.reserved_quantity).toBe(0);
    });
  });

  describe('getAvailability', () => {
    test('should return availability status', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        variant_id: 'var-1',
        quantity: 50,
        reserved_quantity: 10,
        available_quantity: 40,
        reorder_level: 5,
      });

      const result = await inventoryService.getAvailability('var-1');

      expect(result.is_available).toBe(true);
      expect(result.available_quantity).toBe(40);
      expect(result.is_low_stock).toBe(false);
    });

    test('should flag low stock items', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        variant_id: 'var-1',
        quantity: 10,
        reserved_quantity: 5,
        available_quantity: 5,
        reorder_level: 10,
      });

      const result = await inventoryService.getAvailability('var-1');

      expect(result.is_low_stock).toBe(true);
      expect(result.should_restock).toBe(true);
    });

    test('should flag out of stock items', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        variant_id: 'var-1',
        quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
      });

      const result = await inventoryService.getAvailability('var-1');

      expect(result.is_available).toBe(false);
      expect(result.is_out_of_stock).toBe(true);
    });
  });
});
```

#### 3.1.4 Validator Tests

```javascript
// backend/tests/unit/validators/authValidators.test.js

describe('AuthValidators', () => {
  describe('registerSchema', () => {
    test('should validate correct registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123',
        full_name: 'Nguyễn Văn A',
        phone: '0912345678',
      };

      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    test('should reject weak password (too short)', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'short',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    test('should reject password without uppercase', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'weakpass123',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('uppercase');
    });

    test('should reject password without number', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'WeakPassword',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('number');
    });

    test('should validate Vietnamese phone format', () => {
      const validPhones = [
        '0912345678',
        '0987654321',
        '84123456789',
        '+84912345678',
      ];

      validPhones.forEach((phone) => {
        const { error } = registerSchema.validate({
          email: 'user@example.com',
          password: 'SecurePass123',
          phone,
        });
        expect(error).toBeUndefined();
      });
    });

    test('should reject invalid phone format', () => {
      const invalidPhones = ['123', 'abcdefgh', '12345'];

      invalidPhones.forEach((phone) => {
        const { error } = registerSchema.validate({
          email: 'user@example.com',
          password: 'SecurePass123',
          phone,
        });
        expect(error).toBeDefined();
      });
    });
  });

  describe('loginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should require email', () => {
      const { error } = loginSchema.validate({
        password: 'password123',
      });
      expect(error).toBeDefined();
    });

    test('should require password', () => {
      const { error } = loginSchema.validate({
        email: 'user@example.com',
      });
      expect(error).toBeDefined();
    });
  });
});
```

### 3.2 Integration Tests

#### 3.2.1 Authentication Integration Tests

```javascript
// backend/tests/integration/auth.test.js

describe('Authentication API', () => {
  let app;
  let request;
  let testUser;

  beforeAll(async () => {
    app = require('../../src/app');
    request = supertest(app);
  });

  afterAll(async () => {
    await clearAllTables();
  });

  describe('POST /auth/register', () => {
    test('should register new user successfully', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123',
          full_name: 'New User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
    });

    test('should reject duplicate email', async () => {
      await request
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123',
        });

      const response = await request
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_EMAIL_EXISTS');
    });

    test('should reject invalid email format', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject weak password', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should sanitize input to prevent XSS', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'SecurePass123',
          full_name: '<script>alert("xss")</script>',
        })
        .expect(201);

      const user = await getUserByEmail('user@example.com');
      expect(user.full_name).not.toContain('<script>');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'logintest@example.com',
        password: 'SecurePass123',
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.user.email).toBe('logintest@example.com');
    });

    test('should reject invalid password', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should reject non-existent email', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        })
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: 'anypassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/google', () => {
    test('should authenticate with valid Google token', async () => {
      const mockGoogleToken = 'valid_google_id_token';

      jest.spyOn(googleAuth, 'verifyIdToken').mockResolvedValue({
        getEmail: () => 'googleuser@gmail.com',
        getPayload: () => ({
          name: 'Google User',
          picture: 'https://google.com/avatar.jpg',
        }),
      });

      const response = await request
        .post('/api/v1/auth/google')
        .send({ id_token: mockGoogleToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('googleuser@gmail.com');
    });

    test('should create new user for first-time Google login', async () => {
      const mockGoogleToken = 'new_google_id_token';

      jest.spyOn(googleAuth, 'verifyIdToken').mockResolvedValue({
        getEmail: () => 'newgoogle@gmail.com',
        getPayload: () => ({ name: 'New Google User' }),
      });

      const response = await request
        .post('/api/v1/auth/google')
        .send({ id_token: mockGoogleToken })
        .expect(200);

      expect(response.body.data.is_new_user).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    let authToken;

    beforeEach(async () => {
      const user = await createTestUser({ email: 'me@example.com' });
      authToken = generateTestToken(user.id);
    });

    test('should return current user profile', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@example.com');
    });

    test('should reject request without token', async () => {
      const response = await request.get('/api/v1/auth/me').expect(401);

      expect(response.body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });

    test('should reject expired token', async () => {
      const expiredToken = generateTestToken('user-123', { expiresIn: '-1h' });

      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
    });

    test('should reject invalid token', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });
  });
});
```

#### 3.2.2 Cart & Checkout Integration Tests

```javascript
// backend/tests/integration/cart.test.js

describe('Cart & Checkout API', () => {
  let app;
  let request;
  let authToken;
  let testProduct;
  let testVariant;

  beforeAll(async () => {
    app = require('../../src/app');
    request = supertest(app);
  });

  beforeEach(async () => {
    const user = await createTestUser();
    authToken = generateTestToken(user.id);

    testProduct = await createTestProduct({
      name_vi: 'Test Product',
      price: 1000000,
      status: 'active',
    });

    testVariant = await createTestVariant({
      product_id: testProduct.id,
      size: '42',
      color: 'Black',
    });

    await createTestInventory({
      variant_id: testVariant.id,
      quantity: 100,
      reserved_quantity: 0,
    });
  });

  describe('GET /cart', () => {
    test('should return empty cart for new user', async () => {
      const response = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.subtotal).toBe(0);
    });

    test('should return cart with items', async () => {
      await createTestCartItem({
        user_id: getUserIdFromToken(authToken),
        product_id: testProduct.id,
        variant_id: testVariant.id,
        quantity: 2,
      });

      const response = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.subtotal).toBe(2000000);
    });
  });

  describe('POST /cart/items', () => {
    test('should add item to cart', async () => {
      const response = await request
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProduct.id,
          variant_id: testVariant.id,
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(1);
    });

    test('should require authentication', async () => {
      const response = await request
        .post('/api/v1/cart/items')
        .send({
          product_id: testProduct.id,
          variant_id: testVariant.id,
          quantity: 1,
        })
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    });

    test('should validate product exists', async () => {
      const response = await request
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'non-existent-id',
          variant_id: testVariant.id,
          quantity: 1,
        })
        .expect(400);

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    test('should check inventory availability', async () => {
      await updateTestInventory({
        variant_id: testVariant.id,
        quantity: 0,
      });

      const response = await request
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProduct.id,
          variant_id: testVariant.id,
          quantity: 1,
        })
        .expect(400);

      expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
    });
  });

  describe('POST /orders (Checkout)', () => {
    beforeEach(async () => {
      await createTestCartItem({
        user_id: getUserIdFromToken(authToken),
        product_id: testProduct.id,
        variant_id: testVariant.id,
        quantity: 2,
      });
    });

    test('should create order from cart', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipping_address: {
            full_name: 'Nguyễn Văn A',
            phone: '0912345678',
            address_line1: '123 Đường ABC',
            city: 'TP HCM',
          },
          payment_method: 'cod',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order_number).toBeDefined();
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.total_amount).toBe(2000000);
    });

    test('should deduct inventory on checkout', async () => {
      const initialInventory = await getInventory(testVariant.id);

      await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipping_address: {
            full_name: 'Nguyễn Văn A',
            phone: '0912345678',
            address_line1: '123 Đường ABC',
            city: 'TP HCM',
          },
          payment_method: 'cod',
        })
        .expect(201);

      const updatedInventory = await getInventory(testVariant.id);
      expect(updatedInventory.quantity).toBe(
        initialInventory.quantity - 2
      );
    });

    test('should clear cart after checkout', async () => {
      await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipping_address: {
            full_name: 'Nguyễn Văn A',
            phone: '0912345678',
            address_line1: '123 Đường ABC',
            city: 'TP HCM',
          },
          payment_method: 'cod',
        })
        .expect(201);

      const cartResponse = await request
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cartResponse.body.data.items).toHaveLength(0);
    });

    test('should reject empty cart checkout', async () => {
      await clearTestCart(getUserIdFromToken(authToken));

      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipping_address: {
            full_name: 'Nguyễn Văn A',
            phone: '0912345678',
            address_line1: '123 Đường ABC',
            city: 'TP HCM',
          },
          payment_method: 'cod',
        })
        .expect(400);

      expect(response.body.error.code).toBe('CART_EMPTY');
    });

    test('should validate shipping address', async () => {
      const response = await request
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipping_address: {
            full_name: 'Nguyễn Văn A',
          },
          payment_method: 'cod',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

## 4. Frontend Testing

### 4.1 Component Tests

#### 4.1.1 ProductCard Component

```javascript
// frontend/tests/unit/components/ProductCard.test.js

import { render, screen, fireEvent } from '@testing-library/vue';
import { createTestingPinia } from '@pinia/testing';
import ProductCard from '@/components/product/ProductCard.vue';

describe('ProductCard', () => {
  const mockProduct = {
    id: 'prod-1',
    name_vi: 'Giày Ultraboost 22',
    slug: 'giay-ultraboost-22',
    price: 4500000,
    original_price: 5000000,
    discount_percentage: 10,
    rating: 4.5,
    review_count: 125,
    thumbnail_url: 'https://example.com/image.jpg',
    is_new: true,
    is_featured: false,
    category: {
      name_vi: 'Giày',
      slug: 'giay',
    },
  };

  const renderComponent = (props = {}) => {
    return render(ProductCard, {
      props: {
        product: mockProduct,
        ...props,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          NuxtImg: true,
          Icon: true,
        },
      },
    });
  };

  test('should render product information', () => {
    renderComponent();

    expect(screen.getByText('Giày Ultraboost 22')).toBeInTheDocument();
    expect(screen.getByText('4.500.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('5.000.000 ₫')).toBeInTheDocument();
  });

  test('should display discount badge when discounted', () => {
    renderComponent();

    expect(screen.getByText('-10%')).toBeInTheDocument();
  });

  test('should not display discount badge when no discount', () => {
    renderComponent({
      product: {
        ...mockProduct,
        original_price: 4500000,
        discount_percentage: 0,
      },
    });

    expect(screen.queryByText(/-10%/)).not.toBeInTheDocument();
  });

  test('should display "NEW" badge for new products', () => {
    renderComponent({
      product: {
        ...mockProduct,
        is_new: true,
      },
    });

    expect(screen.getByText('MỚI')).toBeInTheDocument();
  });

  test('should emit add-to-cart event when button clicked', async () => {
    const { emitted } = renderComponent();

    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await fireEvent.click(addButton);

    expect(emitted()['add-to-cart']).toBeTruthy();
    expect(emitted()['add-to-cart'][0]).toEqual([{ product: mockProduct }]);
  });

  test('should show loading state when adding to cart', async () => {
    renderComponent();

    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await fireEvent.click(addButton);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('should display rating stars', () => {
    renderComponent();

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(125)')).toBeInTheDocument();
  });

  test('should navigate to product detail on click', async () => {
    const mockRouter = {
      push: jest.fn(),
    };

    renderComponent();
    
    const card = screen.getByTestId('product-card');
    await fireEvent.click(card);

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'product-slug',
        params: { slug: 'giay-ultraboost-22' },
      })
    );
  });

  test('should handle out of stock state', () => {
    renderComponent({
      product: {
        ...mockProduct,
        status: 'out_of_stock',
      },
    });

    expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thêm vào giỏ/i })).not.toBeInTheDocument();
  });
});
```

#### 4.1.2 CartDrawer Component

```javascript
// frontend/tests/unit/components/CartDrawer.test.js

import { render, screen, fireEvent } from '@testing-library/vue';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import CartDrawer from '@/components/cart/CartDrawer.vue';
import { useCartStore } from '@/stores/cart';

describe('CartDrawer', () => {
  let cartStore;

  beforeEach(() => {
    setActivePinia(createTestingPinia());
    cartStore = useCartStore();
  });

  const mockCartItems = [
    {
      id: 'item-1',
      product: {
        id: 'prod-1',
        name_vi: 'Giày Ultraboost',
        slug: 'giay-ultraboost',
        thumbnail_url: 'https://example.com/image1.jpg',
      },
      variant: {
        size: '42',
        color: 'Black',
      },
      quantity: 2,
      unit_price: 4500000,
      subtotal: 9000000,
    },
    {
      id: 'item-2',
      product: {
        id: 'prod-2',
        name_vi: 'Áo Thun Adidas',
        slug: 'ao-thun-adidas',
        thumbnail_url: 'https://example.com/image2.jpg',
      },
      variant: {
        size: 'L',
        color: 'White',
      },
      quantity: 1,
      unit_price: 800000,
      subtotal: 800000,
    },
  ];

  test('should open drawer when isOpen is true', () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
  });

  test('should close drawer when close button clicked', async () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    const closeButton = screen.getByRole('button', { name: /đóng/i });
    await fireEvent.click(closeButton);

    expect(cartStore.isDrawerOpen).toBe(false);
  });

  test('should display cart items', () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(screen.getByText('Giày Ultraboost')).toBeInTheDocument();
    expect(screen.getByText('Áo Thun Adidas')).toBeInTheDocument();
  });

  test('should calculate and display total correctly', () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(screen.getByText('9.800.000 ₫')).toBeInTheDocument();
  });

  test('should display empty cart message', () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = [];

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(screen.getByText('Giỏ hàng trống')).toBeInTheDocument();
    expect(screen.getByText('Khám phá sản phẩm')).toBeInTheDocument();
  });

  test('should emit checkout event when checkout button clicked', async () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;

    const { emitted } = render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    const checkoutButton = screen.getByRole('button', {
      name: /thanh toán/i,
    });
    await fireEvent.click(checkoutButton);

    expect(emitted()['checkout']).toBeTruthy();
  });

  test('should call updateQuantity when quantity changed', async () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;
    cartStore.updateQuantity = jest.fn();

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    const increaseButton = screen.getByTestId('increase-quantity-0');
    await fireEvent.click(increaseButton);

    expect(cartStore.updateQuantity).toHaveBeenCalledWith('item-1', 3);
  });

  test('should call removeItem when remove button clicked', async () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;
    cartStore.removeItem = jest.fn();

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    const removeButton = screen.getByTestId('remove-item-0');
    await fireEvent.click(removeButton);

    expect(cartStore.removeItem).toHaveBeenCalledWith('item-1');
  });

  test('should prevent body scroll when drawer is open', () => {
    cartStore.isDrawerOpen = true;
    cartStore.items = mockCartItems;

    render(CartDrawer, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Transition: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(document.body.style.overflow).toBe('hidden');
  });
});
```

### 4.2 Store Tests (Pinia)

```javascript
// frontend/tests/unit/stores/cart.test.js

import { setActivePinia } from 'pinia';
import { createPinia } from 'pinia';
import { useCartStore } from '@/stores/cart';
import { vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CartStore', () => {
  let cartStore;
  let mockApi;

  beforeEach(() => {
    setActivePinia(createPinia());
    cartStore = useCartStore();
    mockApi = require('@/services/api').default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('state', () => {
    test('should have correct initial state', () => {
      expect(cartStore.items).toEqual([]);
      expect(cartStore.isDrawerOpen).toBe(false);
      expect(cartStore.isLoading).toBe(false);
      expect(cartStore.error).toBe(null);
    });
  });

  describe('getters', () => {
    test('totalItems should return sum of all quantities', () => {
      cartStore.items = [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 3 },
        { id: '3', quantity: 1 },
      ];

      expect(cartStore.totalItems).toBe(6);
    });

    test('totalItems should return 0 for empty cart', () => {
      cartStore.items = [];
      expect(cartStore.totalItems).toBe(0);
    });

    test('subtotal should calculate correct total', () => {
      cartStore.items = [
        { quantity: 2, unit_price: 1000000 },
        { quantity: 1, unit_price: 500000 },
      ];

      expect(cartStore.subtotal).toBe(2500000);
    });

    test('isEmpty should return true when no items', () => {
      cartStore.items = [];
      expect(cartStore.isEmpty).toBe(true);
    });

    test('isEmpty should return false when has items', () => {
      cartStore.items = [{ id: '1', quantity: 1 }];
      expect(cartStore.isEmpty).toBe(false);
    });
  });

  describe('actions', () => {
    describe('fetchCart', () => {
      test('should fetch cart from API', async () => {
        const mockResponse = {
          data: {
            items: [
              { id: '1', product: { name_vi: 'Product 1' }, quantity: 2 },
            ],
          },
        };
        mockApi.get.mockResolvedValue(mockResponse);

        await cartStore.fetchCart();

        expect(mockApi.get).toHaveBeenCalledWith('/cart');
        expect(cartStore.items).toEqual(mockResponse.data.items);
        expect(cartStore.isLoading).toBe(false);
      });

      test('should handle API error', async () => {
        mockApi.get.mockRejectedValue(new Error('Network error'));

        await cartStore.fetchCart();

        expect(cartStore.error).toBe('Network error');
        expect(cartStore.isLoading).toBe(false);
      });
    });

    describe('addToCart', () => {
      test('should add item to cart', async () => {
        const mockResponse = {
          data: {
            id: 'new-item',
            product_id: 'prod-1',
            variant_id: 'var-1',
            quantity: 1,
          },
        };
        mockApi.post.mockResolvedValue(mockResponse);

        await cartStore.addToCart('prod-1', 'var-1', 1);

        expect(mockApi.post).toHaveBeenCalledWith('/cart/items', {
          product_id: 'prod-1',
          variant_id: 'var-1',
          quantity: 1,
        });
        expect(cartStore.isDrawerOpen).toBe(true);
      });

      test('should open drawer on success', async () => {
        mockApi.post.mockResolvedValue({ data: {} });

        await cartStore.addToCart('prod-1', 'var-1', 1);

        expect(cartStore.isDrawerOpen).toBe(true);
      });
    });

    describe('updateQuantity', () => {
      test('should update item quantity', async () => {
        cartStore.items = [{ id: 'item-1', quantity: 1 }];
        mockApi.put.mockResolvedValue({
          data: { id: 'item-1', quantity: 5 },
        });

        await cartStore.updateQuantity('item-1', 5);

        expect(mockApi.put).toHaveBeenCalledWith('/cart/items/item-1', {
          quantity: 5,
        });
        expect(cartStore.items[0].quantity).toBe(5);
      });

      test('should not update if quantity is 0', async () => {
        await cartStore.updateQuantity('item-1', 0);

        expect(mockApi.put).not.toHaveBeenCalled();
      });

      test('should not update if quantity > 10', async () => {
        await cartStore.updateQuantity('item-1', 15);

        expect(mockApi.put).not.toHaveBeenCalled();
      });
    });

    describe('removeItem', () => {
      test('should remove item from cart', async () => {
        cartStore.items = [
          { id: 'item-1' },
          { id: 'item-2' },
        ];
        mockApi.delete.mockResolvedValue({});

        await cartStore.removeItem('item-1');

        expect(mockApi.delete).toHaveBeenCalledWith('/cart/items/item-1');
        expect(cartStore.items).toHaveLength(1);
        expect(cartStore.items[0].id).toBe('item-2');
      });
    });

    describe('clearCart', () => {
      test('should clear all items', async () => {
        cartStore.items = [{ id: 'item-1' }];
        mockApi.delete.mockResolvedValue({});

        await cartStore.clearCart();

        expect(cartStore.items).toEqual([]);
      });
    });

    describe('openDrawer/closeDrawer', () => {
      test('openDrawer should set isDrawerOpen to true', () => {
        cartStore.openDrawer();
        expect(cartStore.isDrawerOpen).toBe(true);
      });

      test('closeDrawer should set isDrawerOpen to false', () => {
        cartStore.isDrawerOpen = true;
        cartStore.closeDrawer();
        expect(cartStore.isDrawerOpen).toBe(false);
      });
    });
  });

  describe('persistence', () => {
    test('should persist cart items to localStorage', async () => {
      cartStore.items = [{ id: '1', quantity: 2 }];

      const stored = JSON.parse(localStorage.getItem('cart'));
      expect(stored).toEqual([{ id: '1', quantity: 2 }]);
    });

    test('should restore cart from localStorage', () => {
      localStorage.setItem('cart', JSON.stringify([{ id: '1', quantity: 2 }]));

      setActivePinia(createPinia());
      const restoredCartStore = useCartStore();

      expect(restoredCartStore.items).toEqual([{ id: '1', quantity: 2 }]);
    });
  });
});
```

---

## 5. E2E Tests (Playwright)

### 5.1 Critical User Flows

```typescript
// frontend/tests/e2e/checkout.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('complete checkout flow from product detail', async ({ page }) => {
    await test.step('Navigate to product', async () => {
      await page.click('[data-testid="featured-product-1"]');
      await expect(page).toHaveURL(/\/products\//);
    });

    await test.step('Select size and color', async () => {
      await page.click('[data-testid="size-42"]');
      await page.click('[data-testid="color-black"]');
    });

    await test.step('Add to cart', async () => {
      await page.click('[data-testid="add-to-cart-btn"]');
      await expect(page.locator('.toast-success')).toBeVisible();
    });

    await test.step('Open cart drawer', async () => {
      await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    });

    await test.step('Proceed to checkout', async () => {
      await page.click('[data-testid="checkout-btn"]');
      await expect(page).toHaveURL('/checkout');
    });

    await test.step('Fill shipping address', async () => {
      await page.fill('[name="full_name"]', 'Nguyễn Văn A');
      await page.fill('[name="phone"]', '0912345678');
      await page.fill('[name="address_line1"]', '123 Đường ABC');
      await page.fill('[name="city"]', 'TP Hồ Chí Minh');
    });

    await test.step('Select payment method', async () => {
      await page.click('[data-testid="payment-cod"]');
    });

    await test.step('Place order', async () => {
      await page.click('[data-testid="place-order-btn"]');
      await expect(page).toHaveURL('/order-success');
    });

    await test.step('Verify order confirmation', async () => {
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(page.locator('.order-success-message')).toContainText(
        'đặt hàng thành công'
      );
    });
  });

  test('should show login required for add to cart', async ({ page }) => {
    await page.click('[data-testid="featured-product-1"]');
    await page.click('[data-testid="add-to-cart-btn"]');

    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
    await expect(page.locator('.login-prompt')).toContainText(
      'Vui lòng đăng nhập'
    );
  });

  test('should handle inventory conflict', async ({ page }) => {
    await page.click('[data-testid="featured-product-1"]');
    await page.click('[data-testid="add-to-cart-btn"]');

    await expect(page.locator('.error-toast')).toContainText('Hết hàng');
  });
});

test.describe('Authentication Flow', () => {
  test('register new user', async ({ page }) => {
    await page.goto('/auth/register');

    await test.step('Fill registration form', async () => {
      await page.fill('[name="email"]', 'newuser@example.com');
      await page.fill('[name="password"]', 'SecurePass123');
      await page.fill('[name="full_name"]', 'New User');
    });

    await test.step('Submit form', async () => {
      await page.click('[data-testid="register-btn"]');
    });

    await test.step('Verify redirect and success', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.locator('.user-menu')).toContainText('New User');
    });
  });

  test('login with Google OAuth', async ({ page }) => {
    await page.goto('/auth/login');

    await test.step('Click Google login', async () => {
      await page.click('[data-testid="google-login-btn"]');
    });

    await test.step('Handle Google OAuth popup', async ({ context }) => {
      const popupPromise = context.waitForEvent('page');
      await page.click('[data-testid="google-login-btn"]');
      const popup = await popupPromise;

      await popup.fill('[name="email"]', 'test@gmail.com');
      await popup.fill('[name="password"]', 'testpassword');
      await popup.click('[type="submit"]');

      await popup.waitForURL('**/auth/callback/**');
    });

    await test.step('Verify logged in', async () => {
      await expect(page.locator('.user-menu')).toBeVisible();
    });
  });
});
```

---

## 6. Performance Testing

### 6.1 Lighthouse CI Configuration

```javascript
// lighthouse.config.js

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/products/giay-ultraboost-22',
        'http://localhost:3000/category/giay',
        'http://localhost:3000/cart',
        'http://localhost:3000/checkout',
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Server running',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'uses-responsive-images': 'warn',
        'uses-optimized-images': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 6.2 Load Testing Script (k6)

```javascript
// tests/performance/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const scenarios = [
    { weight: 40, name: 'Browse Products', fn: browseProducts },
    { weight: 20, name: 'Search Products', fn: searchProducts },
    { weight: 15, name: 'View Product Detail', fn: viewProductDetail },
    { weight: 10, name: 'Add to Cart', fn: addToCart },
    { weight: 10, name: 'Checkout', fn: checkout },
    { weight: 5, name: 'User Auth', fn: userAuth },
  ];

  const scenario = weightedRandom(scenarios);
  scenario.fn();

  sleep(1);
}

function browseProducts() {
  const res = http.get(`${BASE_URL}/api/v1/products?page=1&per_page=20`);
  
  check(res, {
    'browse products status 200': (r) => r.status === 200,
    'browse products has data': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.length > 0;
    },
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
}

function searchProducts() {
  const queries = ['ultraboost', 'giày chạy', 'áo thun', 'adidas'];
  const query = queries[Math.floor(Math.random() * queries.length)];

  const res = http.get(
    `${BASE_URL}/api/v1/products/search?q=${encodeURIComponent(query)}`
  );

  check(res, {
    'search status 200': (r) => r.status === 200,
    'search returns results': (r) => {
      const body = JSON.parse(r.body);
      return body.success;
    },
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
}

function viewProductDetail() {
  const productSlugs = [
    'giay-ultraboost-22',
    'ao-thun-essentials',
    'quan-short-almalusa',
  ];
  const slug = productSlugs[Math.floor(Math.random() * productSlugs.length)];

  const res = http.get(`${BASE_URL}/api/v1/products/${slug}`);

  check(res, {
    'product detail status 200': (r) => r.status === 200,
    'product has variants': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.variants;
    },
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
}

function addToCart() {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
  };

  const res = http.post(
    `${BASE_URL}/api/v1/cart/items`,
    JSON.stringify({
      product_id: 'prod-test-1',
      variant_id: 'var-test-1',
      quantity: 1,
    }),
    { headers }
  );

  check(res, {
    'add to cart success': (r) => r.status === 201,
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
}

function checkout() {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
  };

  const res = http.post(
    `${BASE_URL}/api/v1/orders`,
    JSON.stringify({
      shipping_address: {
        full_name: 'Test User',
        phone: '0912345678',
        address_line1: '123 Test St',
        city: 'HCMC',
      },
      payment_method: 'cod',
    }),
    { headers }
  );

  check(res, {
    'checkout success': (r) => r.status === 201,
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
}

function userAuth() {
  const res = http.get(`${BASE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  check(res, {
    'auth check success': (r) => r.status === 200,
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
}

function weightedRandom(scenarios) {
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      return scenario;
    }
  }

  return scenarios[0];
}

let cachedToken = null;
function getAuthToken() {
  if (cachedToken) {
    return cachedToken;
  }

  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'LoadTest123',
    })
  );

  if (res.status === 200) {
    cachedToken = JSON.parse(res.body).data.access_token;
    return cachedToken;
  }

  return null;
}
```

---

## 7. Security Testing

### 7.1 SQL Injection Tests

```javascript
// tests/security/sql-injection.test.js

describe('SQL Injection Prevention', () => {
  test('should prevent SQL injection in search query', async () => {
    const maliciousQueries = [
      "'; DROP TABLE products;--",
      "' OR '1'='1",
      "'; SELECT * FROM users;--",
      "1; DELETE FROM orders;--",
    ];

    for (const query of maliciousQueries) {
      const response = await request
        .get(`/api/v1/products?search=${encodeURIComponent(query)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    }
  });

  test('should prevent SQL injection in login', async () => {
    const response = await request
      .post('/api/v1/auth/login')
      .send({
        email: "admin'--",
        password: 'anypassword',
      })
      .expect(401);

    expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });
});
```

### 7.2 XSS Prevention Tests

```javascript
// tests/security/xss.test.js

describe('XSS Prevention', () => {
  test('should sanitize user input in registration', async () => {
    const response = await request
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'SecurePass123',
        full_name: '<script>alert("xss")</script>',
      })
      .expect(201);

    const user = await getUserByEmail('user@example.com');
    expect(user.full_name).not.toContain('<script>');
    expect(user.full_name).toContain('&lt;script&gt;');
  });

  test('should prevent XSS in product reviews', async () => {
    const response = await request
      .post('/api/v1/products/test-product/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        rating: 5,
        comment: '<img src=x onerror=alert("xss")>',
      })
      .expect(201);

    expect(response.body.data.comment).not.toContain('<img');
  });
});
```

---

## 8. Test Coverage Reports

### 8.1 Coverage Configuration

```javascript
// jest.config.js

module.exports = {
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/**/*.test.js',
    '!backend/src/**/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './backend/src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './backend/src/middleware/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};
```

### 8.2 Coverage Badge

```markdown
![Coverage](https://img.shields.io/badge/coverage-80%25-green)
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: adidas_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/adidas_test
          REDIS_URL: redis://localhost:6379/1

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: adidas_test
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/adidas_test
          REDIS_URL: redis://localhost:6379/1

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  lighthouse:
    name: Lighthouse Performance
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Lighthouse CI
        run: npm run test:lighthouse
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## 10. Test Reporting

### 10.1 Test Summary

| Test Type | Target | Framework | CI Integration |
|-----------|--------|-----------|-----------------|
| Unit Tests (Backend) | ≥ 80% | Jest | ✅ Every PR |
| Unit Tests (Frontend) | ≥ 80% | Vitest | ✅ Every PR |
| Integration Tests | 50 tests | Supertest | ✅ Every PR |
| E2E Tests | 20 tests | Playwright | ✅ Every PR |
| Performance Tests | Lighthouse ≥ 90 | Lighthouse CI | ✅ Main branch |
| Security Tests | SAST + DAST | Snyk + OWASP | ✅ Weekly |

### 10.2 Test Metrics Dashboard

```
┌────────────────────────────────────────────────────────────┐
│                    TEST DASHBOARD                          │
├────────────────────────────────────────────────────────────┤
│  Total Tests: 350          Passed: 345 (98.6%)           │
│  Failed: 5                 Skipped: 0                      │
├────────────────────────────────────────────────────────────┤
│  Unit Tests        [████████████████████] 150/150 (100%)   │
│  Integration       [████████████████████] 50/50 (100%)   │
│  E2E Tests         [█████████████████    ] 18/20 (90%)    │
│  Performance       [████████████████████] 90/100        │
├────────────────────────────────────────────────────────────┤
│  Coverage: 82%  │  Build: ✅ Pass  │  Deploy: Ready       │
└────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** 2026-05-13
**Author:** QA Team
**Status:** Ready for Implementation
