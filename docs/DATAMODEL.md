# Data Model - Database Schema Specification
# Dự án: Adidas Clone Vietnam (adidas.vn)

---

## 1. Tổng Quan Database

### 1.1 Database Type
- **Engine:** PostgreSQL 15 (via Supabase)
- **Version Control:** Supabase Migrations
- **Security:** Row Level Security (RLS) enabled on all tables
- **Region:** Southeast Asia (Singapore)

### 1.2 Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PUBLIC SCHEMA                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │ profiles │───<│  users   │    │ categories│                │
│  └──────────┘    └────┬─────┘    └────┬─────┘                 │
│                       │               │                        │
│                       │        ┌──────┴──────┐                 │
│                       │        │             │                  │
│                  ┌────▼─────┐  │  ┌─────────▼──────┐           │
│                  │cart_items│  │  │   products     │           │
│                  └────┬─────┘  │  └─────────┬──────┘           │
│                       │        │            │                   │
│                       │        │    ┌──────┴──────┐            │
│                       │        │    │             │             │
│                  ┌────▼────────▼────▼──────┐                   │
│                  │       orders             │                   │
│                  │    (order_items)         │                   │
│                  └─────────────────────────┘                   │
│                                                                  │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────────┐      │
│  │  favorites  │  │ product_images │  │product_variants │      │
│  └─────────────┘  └───────┬────────┘  └────────┬────────┘      │
│                           │                   │                │
│                           └───────┬───────────┘                │
│                                   │                             │
│                          ┌────────▼────────┐                   │
│                          │   inventory     │                   │
│                          └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tables Definition

### 2.1 profiles (Extended User Profile)

**Mục đích:** Lưu trữ thông tin mở rộng của user sau khi đăng ký qua Supabase Auth

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK, FK auth.users | User identifier |
| email | TEXT | UNIQUE, NOT NULL | Email address |
| full_name | TEXT | - | Họ và tên đầy đủ |
| phone | VARCHAR(20) | - | Số điện thoại |
| avatar_url | TEXT | - | URL avatar từ Google OAuth |
| role | user_role | DEFAULT 'customer' | Phân quyền |
| is_active | BOOLEAN | DEFAULT true | Tài khoản active |
| email_verified | BOOLEAN | DEFAULT false | Email đã verify |
| last_login_at | TIMESTAMPTZ | - | Lần đăng nhập cuối |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Thời gian tạo |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Thời gian cập nhật |

---

### 2.2 categories (Product Categories)

**Mục đích:** Phân loại sản phẩm theo danh mục (Giày, Áo, Quần, Phụ kiện)

```sql
CREATE TYPE category_type AS ENUM ('shoes', 'apparel', 'accessories', 'collections');

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    type category_type DEFAULT 'apparel',
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete categories"
    ON categories FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Category ID |
| name_vi | TEXT | NOT NULL | Tên tiếng Việt |
| name_en | TEXT | NOT NULL | Tên tiếng Anh |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly slug |
| description | TEXT | - | Mô tả category |
| type | category_type | DEFAULT 'apparel' | Loại category |
| parent_id | UUID | FK categories | Category cha (self-reference) |
| image_url | TEXT | - | Hình ảnh category |
| icon | VARCHAR(50) | - | Icon class/name |
| sort_order | INTEGER | DEFAULT 0 | Thứ tự hiển thị |
| is_active | BOOLEAN | DEFAULT true | Đang active |

**Sample Data:**
```sql
INSERT INTO categories (name_vi, name_en, slug, type, sort_order) VALUES
('Giày', 'Shoes', 'giay', 'shoes', 1),
('Áo', 'Apparel', 'ao', 'apparel', 2),
('Quần', 'Pants', 'quan', 'apparel', 3),
('Phụ kiện', 'Accessories', 'phu-kien', 'accessories', 4);
```

---

### 2.3 products (Product Catalog)

**Mục đích:** Lưu trữ thông tin sản phẩm chính

```sql
CREATE TYPE product_status AS ENUM ('draft', 'active', 'discontinued');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(12, 2) CHECK (original_price >= price),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(100) DEFAULT 'Adidas',
    model VARCHAR(100),
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50),
    weight DECIMAL(8, 2),
    rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    status product_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    tags TEXT[],
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_new ON products(is_new) WHERE is_new = true;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating DESC);

-- Full-text Search Index
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Auto update search_vector
CREATE OR REPLACE FUNCTION update_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('vietnamese',
        COALESCE(NEW.name_vi, '') || ' ' ||
        COALESCE(NEW.name_en, '') || ' ' ||
        COALESCE(NEW.description_vi, '') || ' ' ||
        COALESCE(NEW.brand, '') || ' ' ||
        COALESCE(NEW.model, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_products_search
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_products_search_vector();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone"
    ON products FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view all products"
    ON products FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert products"
    ON products FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update products"
    ON products FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete products"
    ON products FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Product ID |
| name_vi | TEXT | NOT NULL | Tên tiếng Việt |
| name_en | TEXT | NOT NULL | Tên tiếng Anh |
| slug | TEXT | UNIQUE, NOT NULL | URL slug |
| description_vi | TEXT | - | Mô tả tiếng Việt |
| description_en | TEXT | - | Mô tả tiếng Anh |
| price | DECIMAL(12,2) | NOT NULL, >= 0 | Giá bán |
| original_price | DECIMAL(12,2) | >= price | Giá gốc (so sánh) |
| category_id | UUID | FK categories | Category ID |
| brand | VARCHAR(100) | DEFAULT 'Adidas' | Thương hiệu |
| model | VARCHAR(100) | - | Model sản phẩm |
| sku | VARCHAR(50) | UNIQUE | Stock keeping unit |
| barcode | VARCHAR(50) | - | Barcode |
| weight | DECIMAL(8,2) | - | Trọng lượng (kg) |
| rating | DECIMAL(3,2) | DEFAULT 0, 0-5 | Đánh giá trung bình |
| review_count | INTEGER | DEFAULT 0 | Số lượng review |
| sold_count | INTEGER | DEFAULT 0 | Số đã bán |
| view_count | INTEGER | DEFAULT 0 | Số lượt xem |
| wishlist_count | INTEGER | DEFAULT 0 | Số wishlist |
| status | product_status | DEFAULT 'draft' | Trạng thái |
| is_featured | BOOLEAN | DEFAULT false | Sản phẩm nổi bật |
| is_new | BOOLEAN | DEFAULT false | Sản phẩm mới |
| is_bestseller | BOOLEAN | DEFAULT false | Sản phẩm bán chạy |
| tags | TEXT[] | - | Tags array |
| search_vector | TSVECTOR | - | Full-text search vector |

---

### 2.4 product_variants (Size & Color Variants)

**Mục đích:** Lưu trữ các biến thể sản phẩm theo size và color

```sql
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(20) NOT NULL,
    size_type VARCHAR(20) DEFAULT 'standard',
    color VARCHAR(50) NOT NULL,
    color_code VARCHAR(7),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(50),
    price_modifier DECIMAL(12, 2) DEFAULT 0,
    compare_at_price DECIMAL(12, 2),
    weight DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, size, color)
);

-- Indexes
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_size ON product_variants(size);
CREATE INDEX idx_variants_color ON product_variants(color);

-- RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone"
    ON product_variants FOR SELECT USING (true);

CREATE POLICY "Admins can manage variants"
    ON product_variants FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Variant ID |
| product_id | UUID | FK, NOT NULL | Product cha |
| size | VARCHAR(20) | NOT NULL | Kích thước (38, 39, 40...) |
| size_type | VARCHAR(20) | DEFAULT 'standard' | Loại size |
| color | VARCHAR(50) | NOT NULL | Màu sắc |
| color_code | VARCHAR(7) | - | Mã màu HEX |
| sku | VARCHAR(100) | UNIQUE | SKU variant |
| barcode | VARCHAR(50) | - | Barcode variant |
| price_modifier | DECIMAL(12,2) | DEFAULT 0 | Phụ thu theo variant |
| compare_at_price | DECIMAL(12,2) | - | Giá so sánh |
| weight | DECIMAL(8,2) | - | Trọng lượng |
| is_active | BOOLEAN | DEFAULT true | Đang bán |
| is_default | BOOLEAN | DEFAULT false | Variant mặc định |
| sort_order | INTEGER | DEFAULT 0 | Thứ tự |

**Size Types:**
- `standard`: Kích thước giày (38, 39, 40...)
- `numeric`: Size quần (28, 30, 32...)
- `letter`: Size áo (S, M, L, XL...)

---

### 2.5 product_images (Product Media Gallery)

**Mục đích:** Lưu trữ hình ảnh sản phẩm (multiple images per product)

```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text_vi TEXT,
    alt_text_en TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images are viewable by everyone"
    ON product_images FOR SELECT USING (true);

CREATE POLICY "Admins can manage images"
    ON product_images FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Image ID |
| product_id | UUID | FK, NOT NULL | Product cha |
| url | TEXT | NOT NULL | URL image (Supabase Storage) |
| alt_text_vi | TEXT | - | Alt text tiếng Việt |
| alt_text_en | TEXT | - | Alt text tiếng Anh |
| width | INTEGER | - | Chiều rộng (px) |
| height | INTEGER | - | Chiều cao (px) |
| file_size | INTEGER | - | Kích thước file (bytes) |
| is_primary | BOOLEAN | DEFAULT false | Ảnh chính |
| sort_order | INTEGER | DEFAULT 0 | Thứ tự hiển thị |

---

### 2.6 inventory (Stock Management)

**Mục đích:** Quản lý tồn kho theo variant, hỗ trợ reserved quantity cho concurrency

```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    reorder_level INTEGER DEFAULT 5,
    max_stock_level INTEGER,
    lead_time_days INTEGER DEFAULT 7,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_quantity CHECK (reserved_quantity <= quantity)
);

-- Indexes
CREATE INDEX idx_inventory_variant ON inventory(variant_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= reorder_level;

-- RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory is viewable by everyone"
    ON inventory FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory"
    ON inventory FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Inventory ID |
| variant_id | UUID | FK, NOT NULL | Variant ID |
| warehouse_id | UUID | FK warehouses | Kho hàng |
| quantity | INTEGER | NOT NULL, >= 0 | Tổng số lượng |
| reserved_quantity | INTEGER | DEFAULT 0, >= 0 | Đã reserved |
| available_quantity | INTEGER | GENERATED | Khả dụng = quantity - reserved |
| reorder_level | INTEGER | DEFAULT 5 | Mức reorder |
| max_stock_level | INTEGER | - | Tối đa |
| lead_time_days | INTEGER | DEFAULT 7 | Lead time nhập hàng |
| last_restocked_at | TIMESTAMPTZ | - | Lần nhập kho cuối |

**Generated Column:**
```sql
available_quantity = quantity - reserved_quantity
```

**Constraint:**
- `quantity >= reserved_quantity`: Không reserved nhiều hơn tồn kho

---

### 2.7 warehouses (Physical Warehouses)

**Mục đích:** Quản lý thông tin kho hàng vật lý

```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Vietnam',
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Warehouses are viewable by everyone"
    ON warehouses FOR SELECT USING (true);

CREATE POLICY "Admins can manage warehouses"
    ON warehouses FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

### 2.8 cart_items (Shopping Cart)

**Mục đích:** Lưu trữ giỏ hàng của user (persistent cart)

```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

-- Indexes
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
CREATE INDEX idx_cart_variant ON cart_items(variant_id);

-- RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
    ON cart_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart"
    ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
    ON cart_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
    ON cart_items FOR DELETE USING (auth.uid() = user_id);
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Cart item ID |
| user_id | UUID | FK, NOT NULL | User ID |
| product_id | UUID | FK, NOT NULL | Product ID |
| variant_id | UUID | FK | Variant ID (size/color) |
| quantity | INTEGER | NOT NULL, 1-10 | Số lượng |
| is_selected | BOOLEAN | DEFAULT true | Được chọn để checkout |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Thời gian thêm |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Cập nhật cuối |

**Business Rules:**
- `quantity BETWEEN 1 AND 10`: Giới hạn số lượng mỗi item
- User chỉ thấy cart của chính mình (RLS enforced)

---

### 2.9 orders (Customer Orders)

**Mục đích:** Lưu trữ đơn hàng của khách hàng

```sql
CREATE TYPE order_status AS ENUM (
    'pending',      -- Chờ xác nhận
    'confirmed',   -- Đã xác nhận
    'processing',  -- Đang xử lý
    'shipped',     -- Đã gửi hàng
    'delivered',   -- Đã giao hàng
    'cancelled',   -- Đã hủy
    'refunded'      -- Đã hoàn tiền
);

CREATE TYPE payment_method AS ENUM (
    'cod',          -- Cash on Delivery
    'bank_transfer', -- Chuyển khoản
    'momo',         -- MoMo
    'vnpay'         -- VNPay
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_fee DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method payment_method DEFAULT 'cod',
    payment_status payment_status DEFAULT 'pending',
    payment_id VARCHAR(100),
    paid_at TIMESTAMPTZ,
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    notes TEXT,
    is_online BOOLEAN DEFAULT true,
    referrer_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment ON orders(payment_status);

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
    ON orders FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

CREATE POLICY "Admins can update all orders"
    ON orders FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

**Shipping Address JSONB Structure:**
```json
{
  "full_name": "Nguyễn Văn A",
  "phone": "0912345678",
  "address_line1": "123 Đường ABC",
  "address_line2": "Phường XYZ",
  "ward": "Phường 1",
  "district": "Quận 1",
  "city": "TP Hồ Chí Minh",
  "postal_code": "700000",
  "country": "Vietnam"
}
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Order ID |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | Mã đơn hàng |
| user_id | UUID | FK, NOT NULL | User ID |
| status | order_status | DEFAULT 'pending' | Trạng thái đơn |
| subtotal | DECIMAL(12,2) | NOT NULL | Tổng phụ |
| discount_amount | DECIMAL(12,2) | DEFAULT 0 | Giảm giá |
| shipping_fee | DECIMAL(12,2) | DEFAULT 0 | Phí ship |
| tax_amount | DECIMAL(12,2) | DEFAULT 0 | Thuế |
| total_amount | DECIMAL(12,2) | NOT NULL | Tổng cộng |
| payment_method | payment_method | DEFAULT 'cod' | Phương thức thanh toán |
| payment_status | payment_status | DEFAULT 'pending' | Trạng thái thanh toán |
| payment_id | VARCHAR(100) | - | Payment gateway ID |
| paid_at | TIMESTAMPTZ | - | Thời gian thanh toán |
| shipping_address | JSONB | NOT NULL | Địa chỉ giao hàng |
| shipping_method | VARCHAR(50) | - | Phương thức vận chuyển |
| tracking_number | VARCHAR(100) | - | Mã tracking |
| notes | TEXT | - | Ghi chú |
| is_online | BOOLEAN | DEFAULT true | Đơn online/offline |
| referrer_id | UUID | FK profiles | Người giới thiệu |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Thời gian tạo |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Cập nhật cuối |

---

### 2.10 order_items (Order Line Items)

**Mục đích:** Chi tiết từng sản phẩm trong đơn hàng

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name_snapshot TEXT NOT NULL,
    variant_snapshot JSONB,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items are viewable by order owner or admin"
    ON order_items FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_id AND (o.user_id = auth.uid() OR auth.uid() IN (
                SELECT id FROM profiles WHERE role = 'admin'
            ))
        )
    );

CREATE POLICY "Order items created by order rules"
    ON order_items FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_id AND user_id = auth.uid()
        )
    );
```

**Fields Detail:**

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| id | UUID | PK | Order item ID |
| order_id | UUID | FK, NOT NULL | Order cha |
| product_id | UUID | FK, NOT NULL | Product ID |
| variant_id | UUID | FK | Variant ID |
| product_name_snapshot | TEXT | NOT NULL | Tên product (snapshot) |
| variant_snapshot | JSONB | - | Thông tin variant (snapshot) |
| quantity | INTEGER | NOT NULL, > 0 | Số lượng |
| unit_price | DECIMAL(12,2) | NOT NULL | Đơn giá |
| discount_amount | DECIMAL(12,2) | DEFAULT 0 | Giảm giá |
| subtotal | DECIMAL(12,2) | NOT NULL | Thành tiền |

**Snapshot Pattern:** Lưu snapshot để khi product/variant thay đổi thì order vẫn giữ nguyên thông tin.

---

### 2.11 favorites (User Wishlist)

**Mục đích:** Lưu trữ wishlist của user

```sql
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
    ON favorites FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view favorites"
    ON favorites FOR SELECT USING (true);
```

---

### 2.12 addresses (User Saved Addresses)

**Mục đích:** Lưu trữ địa chỉ giao hàng đã lưu của user

```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(50),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Vietnam',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = true;

-- RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
    ON addresses FOR ALL USING (auth.uid() = user_id);
```

---

### 2.13 banners (Homepage Banners)

**Mục đích:** Quản lý banner trên trang chủ

```sql
CREATE TYPE banner_position AS ENUM ('hero', 'mid', 'bottom', 'popup');
CREATE TYPE banner_device AS ENUM ('desktop', 'mobile', 'both');

CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_vi TEXT NOT NULL,
    title_en TEXT,
    subtitle_vi TEXT,
    subtitle_en TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link_url TEXT,
    link_type VARCHAR(20),
    position banner_position DEFAULT 'hero',
    device banner_device DEFAULT 'both',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are viewable by everyone"
    ON banners FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Admins can manage banners"
    ON banners FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

### 2.14 promotions (Discount Codes & Campaigns)

**Mục đích:** Quản lý khuyến mãi, mã giảm giá

```sql
CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed', 'free_shipping', 'buy_x_get_y');
CREATE TYPE promotion_status AS ENUM ('draft', 'active', 'scheduled', 'expired', 'disabled');

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT,
    type promotion_type NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    max_discount_amount DECIMAL(12, 2),
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    status promotion_status DEFAULT 'draft',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    applicable_products UUID[],
    applicable_categories UUID[],
    is_first_order_only BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active promotions are viewable by everyone"
    ON promotions FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage promotions"
    ON promotions FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 3. Enums & Types

### 3.1 Custom Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'moderator');

-- Order status flow
-- pending -> confirmed -> processing -> shipped -> delivered
--     |          |            |           |
--     v          v            v           v
-- cancelled  cancelled    cancelled   cancelled

-- Payment status
-- pending -> paid -> refunded
--     |      |
--     v      v
--   failed refunded
```

### 3.2 Generated Columns

```sql
-- Product discount percentage (computed)
ALTER TABLE products
ADD COLUMN discount_percentage DECIMAL(5,2)
GENERATED ALWAYS AS (
    CASE WHEN original_price > price AND original_price > 0
    THEN ROUND(((original_price - price) / original_price * 100)::NUMERIC, 2)
    ELSE 0 END
) STORED;

-- Order item subtotal (computed)
ALTER TABLE order_items
ADD COLUMN subtotal DECIMAL(12,2)
GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount_amount, 0)) STORED;
```

---

## 4. Indexes Summary

### 4.1 Performance Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_products_category_featured ON products(category_id, is_featured) WHERE status = 'active';
CREATE INDEX idx_products_category_new ON products(category_id, is_new) WHERE status = 'active';
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_cart_user_selected ON cart_items(user_id, is_selected) WHERE is_selected = true;

-- Covering indexes for faster reads
CREATE INDEX idx_products_list_covering ON products(status, category_id, created_at DESC)
INCLUDE (name_vi, price, slug, rating);

CREATE INDEX idx_inventory_availability ON inventory(variant_id, available_quantity)
WHERE available_quantity > 0;
```

### 4.2 Full-text Search Indexes

```sql
-- Vietnamese full-text search
CREATE INDEX idx_products_search_vietnamese ON products
USING GIN(to_tsvector('vietnamese', name_vi || ' ' || COALESCE(description_vi, '')));

-- English full-text search
CREATE INDEX idx_products_search_english ON products
USING GIN(to_tsvector('english', name_en || ' ' || COALESCE(description_en, '')));
```

---

## 5. Functions & Triggers

### 5.1 Utility Functions

```sql
-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.2 Business Logic Functions

```sql
-- Reserve inventory for checkout
CREATE OR REPLACE FUNCTION reserve_inventory(
    p_variant_id UUID,
    p_quantity INTEGER,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available INTEGER;
BEGIN
    -- Check available quantity
    SELECT available_quantity INTO v_available
    FROM inventory
    WHERE variant_id = p_variant_id
    FOR UPDATE;

    IF v_available >= p_quantity THEN
        UPDATE inventory
        SET reserved_quantity = reserved_quantity + p_quantity
        WHERE variant_id = p_variant_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release inventory on order cancellation
CREATE OR REPLACE FUNCTION release_inventory(
    p_variant_id UUID,
    p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory
    SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE variant_id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduct inventory on order confirmation
CREATE OR REPLACE FUNCTION deduct_inventory(
    p_variant_id UUID,
    p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory
    SET quantity = quantity - p_quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE variant_id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Supabase Storage

### 6.1 Storage Buckets

```sql
-- Product images (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
);

-- User avatars (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-avatars',
    'user-avatars',
    false,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
);

-- Category images (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'category-images',
    'category-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
);

-- Banners (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'banners',
    'banners',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/webp', 'image/png']
);
```

### 6.2 Storage Policies

```sql
-- Product images: public read, admin write
CREATE POLICY "Public read product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        ));

CREATE POLICY "Admin update product images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'product-images' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        ));

-- User avatars: owner read/write
CREATE POLICY "Owner read avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-avatars' AND name LIKE 'avatars/' || auth.uid()::TEXT || '%');

CREATE POLICY "Owner upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'user-avatars' AND name LIKE 'avatars/' || auth.uid()::TEXT || '/%');
```

---

## 7. Initial Seed Data

### 7.1 Admin User

```sql
-- Sau khi tạo user qua Supabase Auth, insert profile:
INSERT INTO profiles (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@adidas.vn',
    'Admin User',
    'admin'
);
```

### 7.2 Categories

```sql
INSERT INTO categories (name_vi, name_en, slug, type, sort_order) VALUES
('Giày Thể Thao', 'Sports Shoes', 'giay-the-thao', 'shoes', 1),
('Giày Chạy Bộ', 'Running Shoes', 'giay-chay-bo', 'shoes', 2),
('Giày Basketball', 'Basketball Shoes', 'giay-basketball', 'shoes', 3),
('Giày Lifestyle', 'Lifestyle Shoes', 'giay-lifestyle', 'shoes', 4),
('Áo Thun', 'T-Shirts', 'ao-thun', 'apparel', 5),
('Áo Polo', 'Polo Shirts', 'ao-polo', 'apparel', 6),
('Áo Khoác', 'Jackets', 'ao-khoac', 'apparel', 7),
('Quần Short', 'Shorts', 'quan-short', 'apparel', 8),
('Quần Dài', 'Pants', 'quan-dai', 'apparel', 9),
('Túi Xách', 'Bags', 'tui-xach', 'accessories', 10),
('Mũ Nón', 'Hats', 'mu-non', 'accessories', 11),
('Tất/Vớ', 'Socks', 'tat-vo', 'accessories', 12),
('Phụ Kiện', 'Accessories', 'phu-kien', 'accessories', 13);
```

---

## 8. Migration Files Structure

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql          -- Base tables
    ├── 002_seed_data.sql               -- Initial categories, admin
    ├── 003_rls_policies.sql            -- Security policies
    ├── 004_indexes.sql                 -- Performance indexes
    ├── 005_functions_triggers.sql      -- Business logic
    ├── 006_storage_buckets.sql         -- Supabase Storage
    ├── 007_product_variants_sizes.sql  -- Size/Color setup
    ├── 008_sample_products.sql        -- 100+ sample products
    └── 009_sample_inventory.sql        -- Sample inventory
```

---

## 9. Performance Considerations

### 9.1 Query Optimization
- Sử dụng **covering indexes** cho read-heavy queries
- **Partial indexes** cho active products, unpaid orders
- **Materialized views** cho analytics dashboard

### 9.2 Caching Strategy
- Redis cache cho product listings (TTL: 5 minutes)
- Redis cache cho category tree (TTL: 1 hour)
- Cache invalidation on product update

### 9.3 Concurrency Control
- **FOR UPDATE** locks khi modify inventory
- Redis distributed locks cho checkout process
- Optimistic locking với version columns

---

**Document Version:** 1.0
**Last Updated:** 2026-05-13
**Author:** Development Team
**Status:** Ready for Migration
