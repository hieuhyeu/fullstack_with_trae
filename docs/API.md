# API Documentation - RESTful API Specification
# Dự án: Adidas Clone Vietnam (adidas.vn)

---

## 1. API Overview

### 1.1 Base Configuration

| Environment | Base URL |
|------------|----------|
| Production | `https://api.adidas-clone.vn/v1` |
| Staging | `https://api-staging.adidas-clone.vn/v1` |
| Local | `http://localhost:3000/v1` |

### 1.2 Authentication

**Bearer Token Authentication:**
```http
Authorization: Bearer <access_token>
```

**Token Endpoints:**
- Access Token expiry: 1 hour
- Refresh Token expiry: 7 days

### 1.3 Common Headers

```http
Content-Type: application/json
Accept: application/json
X-Client-Version: 1.0.0
X-Request-ID: <uuid>
X-Client-ID: web|android|ios
```

### 1.4 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "status_code": 400
}
```

### 1.5 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

---

## 2. Authentication APIs

### 2.1 Register

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "Nguyễn Văn A",
  "phone": "0912345678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-xxx",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "customer"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

**Validation Rules:**
- `email`: Required, valid email format, unique
- `password`: Required, min 8 characters, must contain uppercase, lowercase, number
- `full_name`: Optional, max 100 characters
- `phone`: Optional, valid Vietnam phone format

---

### 2.2 Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-xxx",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "customer",
      "avatar_url": "https://..."
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

### 2.3 Google OAuth

**Endpoint:** `POST /auth/google`

**Request:**
```json
{
  "id_token": "google_id_token_here",
  "access_token": "google_access_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-xxx",
      "email": "user@gmail.com",
      "full_name": "User Name",
      "avatar_url": "https://lh3.googleusercontent.com/...",
      "role": "customer"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "is_new_user": true
  }
}
```

**OAuth Flow:**
1. Frontend redirect to Google OAuth
2. Get `id_token` from Google callback
3. Send to backend `/auth/google`
4. Backend verify token with Google
5. Create/update user in Supabase
6. Return JWT tokens

---

### 2.4 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 3600
  }
}
```

---

### 2.5 Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "phone": "0912345678",
    "avatar_url": "https://...",
    "role": "customer",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2.6 Update Profile

**Endpoint:** `PUT /auth/profile`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0987654321",
  "avatar_url": "https://storage.supabase.co/..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn B",
    "phone": "0987654321",
    "avatar_url": "https://storage.supabase.co/...",
    "role": "customer"
  }
}
```

---

### 2.7 Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.8 Change Password

**Endpoint:** `POST /auth/change-password`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 3. Product APIs

### 3.1 List Products

**Endpoint:** `GET /products`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 50) |
| `category` | string | - | Category slug |
| `search` | string | - | Search keyword |
| `sort` | string | `newest` | Sort option |
| `min_price` | number | - | Minimum price |
| `max_price` | number | - | Maximum price |
| `color` | string | - | Filter by color |
| `size` | string | - | Filter by size |
| `is_featured` | boolean | - | Featured products only |
| `is_new` | boolean | - | New products only |

**Sort Options:**
- `newest`: Newest first
- `price_asc`: Price low to high
- `price_desc`: Price high to low
- `popular`: Most popular
- `rating`: Highest rated

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-xxx",
      "name_vi": "Giày Ultraboost 22",
      "name_en": "Ultraboost 22 Shoes",
      "slug": "giay-ultraboost-22",
      "price": 4500000,
      "original_price": 5000000,
      "discount_percentage": 10,
      "rating": 4.8,
      "review_count": 256,
      "thumbnail_url": "https://...",
      "is_new": true,
      "is_featured": true,
      "category": {
        "id": "cat-xxx",
        "name_vi": "Giày Thể Thao",
        "slug": "giay-the-thao"
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### 3.2 Get Product Detail

**Endpoint:** `GET /products/:slug`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "name_vi": "Giày Ultraboost 22",
    "name_en": "Ultraboost 22 Shoes",
    "slug": "giay-ultraboost-22",
    "description_vi": "<p>Mô tả sản phẩm...</p>",
    "description_en": "<p>Product description...</p>",
    "price": 4500000,
    "original_price": 5000000,
    "discount_percentage": 10,
    "rating": 4.8,
    "review_count": 256,
    "sold_count": 1200,
    "view_count": 5000,
    "brand": "Adidas",
    "model": "Ultraboost",
    "sku": "GW1228",
    "tags": ["running", "comfort", "premium"],
    "is_featured": true,
    "is_new": true,
    "category": {
      "id": "cat-xxx",
      "name_vi": "Giày Thể Thao",
      "slug": "giay-the-thao",
      "parent": {
        "id": "cat-parent",
        "name_vi": "Giày",
        "slug": "giay"
      }
    },
    "images": [
      {
        "id": "img-xxx",
        "url": "https://...",
        "is_primary": true,
        "alt_text_vi": "Giày Ultraboost 22 - Ảnh 1"
      }
    ],
    "variants": [
      {
        "id": "var-xxx",
        "size": "42",
        "size_type": "standard",
        "color": "Core Black",
        "color_code": "#000000",
        "price": 4500000,
        "sku": "GW1228-42-Black",
        "is_available": true,
        "stock_quantity": 15
      }
    ],
    "available_sizes": ["38", "39", "40", "41", "42", "43", "44"],
    "available_colors": [
      {
        "color": "Core Black",
        "color_code": "#000000",
        "images": ["url1", "url2"]
      }
    ]
  }
}
```

---

### 3.3 Search Products

**Endpoint:** `GET /products/search`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required, min 2 chars) |
| `page` | integer | Page number |
| `per_page` | integer | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-xxx",
      "name_vi": "Giày Ultraboost 22",
      "slug": "giay-ultraboost-22",
      "price": 4500000,
      "thumbnail_url": "https://..."
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

**Search Features:**
- Full-text search tiếng Việt (using `to_tsvector`)
- Fuzzy matching
- Autocomplete suggestions (when `suggestions=true`)

---

### 3.4 Get Featured Products

**Endpoint:** `GET /products/featured`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 12 | Number of products |
| `category` | string | - | Filter by category |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-xxx",
      "name_vi": "Giày Ultraboost 22",
      "slug": "giay-ultraboost-22",
      "price": 4500000,
      "thumbnail_url": "https://...",
      "is_featured": true
    }
  ]
}
```

---

### 3.5 Get New Arrivals

**Endpoint:** `GET /products/new`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 12 | Number of products |
| `category` | string | - | Filter by category |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...]
}
```

---

### 3.6 Get Related Products

**Endpoint:** `GET /products/:slug/related`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 8 | Number of products |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-xxx",
      "name_vi": "...",
      "slug": "...",
      "price": 4500000,
      "thumbnail_url": "https://..."
    }
  ]
}
```

---

### 3.7 Product Autocomplete

**Endpoint:** `GET /products/autocomplete`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (min 2 chars) |
| `limit` | integer | Max suggestions (default 10) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-xxx",
      "name_vi": "Giày Ultraboost 22",
      "slug": "giay-ultraboost-22",
      "category": "Giày Thể Thao",
      "price": 4500000,
      "thumbnail_url": "https://..."
    }
  ]
}
```

---

## 4. Category APIs

### 4.1 List Categories

**Endpoint:** `GET /categories`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type (shoes, apparel, accessories) |
| `include_children` | boolean | Include subcategories |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-xxx",
      "name_vi": "Giày",
      "name_en": "Shoes",
      "slug": "giay",
      "image_url": "https://...",
      "icon": "shoe-icon",
      "product_count": 150,
      "children": [
        {
          "id": "cat-child",
          "name_vi": "Giày Chạy Bộ",
          "slug": "giay-chay-bo",
          "product_count": 45
        }
      ]
    }
  ]
}
```

---

### 4.2 Get Category Detail

**Endpoint:** `GET /categories/:slug`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cat-xxx",
    "name_vi": "Giày Thể Thao",
    "name_en": "Sports Shoes",
    "slug": "giay-the-thao",
    "description": "...",
    "image_url": "https://...",
    "parent": {
      "id": "cat-parent",
      "name_vi": "Giày",
      "slug": "giay"
    },
    "children": [...],
    "breadcrumb": [
      { "name": "Giày", "slug": "giay" },
      { "name": "Giày Thể Thao", "slug": "giay-the-thao" }
    ]
  }
}
```

---

### 4.3 Get Products by Category

**Endpoint:** `GET /categories/:slug/products`

**Query Parameters:** Same as `/products` endpoint

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "category": {
      "id": "cat-xxx",
      "name_vi": "Giày Thể Thao",
      "slug": "giay-the-thao"
    },
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## 5. Cart APIs

### 5.1 Get Cart

**Endpoint:** `GET /cart`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cart-xxx",
    "items": [
      {
        "id": "item-xxx",
        "product": {
          "id": "prod-xxx",
          "name_vi": "Giày Ultraboost 22",
          "slug": "giay-ultraboost-22",
          "thumbnail_url": "https://..."
        },
        "variant": {
          "id": "var-xxx",
          "size": "42",
          "color": "Core Black",
          "color_code": "#000000",
          "sku": "GW1228-42-Black"
        },
        "quantity": 2,
        "unit_price": 4500000,
        "subtotal": 9000000,
        "is_available": true,
        "stock_quantity": 15
      }
    ],
    "item_count": 2,
    "subtotal": 9000000,
    "discount_amount": 0,
    "shipping_fee": 0,
    "total": 9000000
  }
}
```

---

### 5.2 Add to Cart

**Endpoint:** `POST /cart/items`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "product_id": "prod-xxx",
  "variant_id": "var-xxx",
  "quantity": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "item-xxx",
    "product_id": "prod-xxx",
    "variant_id": "var-xxx",
    "quantity": 1,
    "unit_price": 4500000,
    "subtotal": 4500000
  },
  "message": "Product added to cart"
}
```

**Error Cases:**
- `400`: Invalid product_id or variant_id
- `400`: Quantity exceeds limit (max 10)
- `400`: Product not available
- `400`: Insufficient stock
- `409`: Item already in cart (will update quantity)

---

### 5.3 Update Cart Item

**Endpoint:** `PUT /cart/items/:item_id`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "quantity": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "item-xxx",
    "quantity": 3,
    "unit_price": 4500000,
    "subtotal": 13500000
  },
  "message": "Cart updated"
}
```

**Error Cases:**
- `400`: Quantity must be between 1 and 10
- `400`: Insufficient stock

---

### 5.4 Remove from Cart

**Endpoint:** `DELETE /cart/items/:item_id`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### 5.5 Clear Cart

**Endpoint:** `DELETE /cart`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

### 5.6 Apply Promo Code

**Endpoint:** `POST /cart/promo`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "code": "SUMMER2024"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "code": "SUMMER2024",
    "type": "percentage",
    "value": 10,
    "discount_amount": 135000,
    "message": "Promo code applied successfully"
  }
}
```

**Error Cases:**
- `400`: Invalid promo code
- `400`: Promo code expired
- `400`: Minimum order amount not met
- `400`: Promo code usage limit reached

---

### 5.7 Remove Promo Code

**Endpoint:** `DELETE /cart/promo`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Promo code removed"
}
```

---

## 6. Order APIs

### 6.1 Create Order (Checkout)

**Endpoint:** `POST /orders`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "shipping_address": {
    "full_name": "Nguyễn Văn A",
    "phone": "0912345678",
    "address_line1": "123 Đường ABC",
    "address_line2": "Phường XYZ",
    "ward": "Phường 1",
    "district": "Quận 1",
    "city": "TP Hồ Chí Minh",
    "postal_code": "700000",
    "country": "Vietnam"
  },
  "payment_method": "cod",
  "shipping_method": "standard",
  "notes": "Giao giờ hành chính"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "order-xxx",
    "order_number": "ORD-20240115-ABC12345",
    "status": "pending",
    "total_amount": 9150000,
    "payment_method": "cod",
    "payment_status": "pending",
    "shipping_address": {...},
    "items": [...],
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Order created successfully"
}
```

**Error Cases:**
- `400`: Cart is empty
- `400`: Invalid shipping address
- `400`: Item out of stock (distributed lock failed)
- `400`: Price changed since added to cart

**Business Logic:**
1. Validate cart items
2. Reserve inventory (Redis lock)
3. Create order
4. Create order_items (snapshot product info)
5. Deduct inventory
6. Clear cart
7. Return order confirmation

---

### 6.2 List Orders

**Endpoint:** `GET /orders`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 10 | Items per page |
| `status` | string | - | Filter by status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-xxx",
      "order_number": "ORD-20240115-ABC12345",
      "status": "delivered",
      "total_amount": 9150000,
      "item_count": 2,
      "thumbnail_url": "https://...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 15,
    "total_pages": 2
  }
}
```

---

### 6.3 Get Order Detail

**Endpoint:** `GET /orders/:order_id`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "order-xxx",
    "order_number": "ORD-20240115-ABC12345",
    "status": "shipped",
    "status_timeline": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z",
        "note": null
      },
      {
        "status": "confirmed",
        "timestamp": "2024-01-15T11:00:00Z",
        "note": "Order confirmed"
      },
      {
        "status": "shipped",
        "timestamp": "2024-01-16T09:00:00Z",
        "note": "Tracking: GHTK123456"
      }
    ],
    "subtotal": 9000000,
    "discount_amount": 0,
    "shipping_fee": 150000,
    "total_amount": 9150000,
    "payment_method": "cod",
    "payment_status": "pending",
    "shipping_address": {...},
    "shipping_method": "standard",
    "tracking_number": "GHTK123456",
    "items": [
      {
        "id": "item-xxx",
        "product": {
          "id": "prod-xxx",
          "name_vi": "Giày Ultraboost 22",
          "slug": "giay-ultraboost-22",
          "thumbnail_url": "https://..."
        },
        "variant": {
          "size": "42",
          "color": "Core Black"
        },
        "quantity": 2,
        "unit_price": 4500000,
        "subtotal": 9000000
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T09:00:00Z"
  }
}
```

---

### 6.4 Cancel Order

**Endpoint:** `PUT /orders/:order_id/cancel`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "reason": "Không muốn mua nữa"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "order-xxx",
    "status": "cancelled"
  },
  "message": "Order cancelled successfully"
}
```

**Error Cases:**
- `400`: Order cannot be cancelled (status not allowed)
- `403`: Not your order

**Business Logic:**
1. Validate order ownership
2. Check if cancellable (pending/confirmed only)
3. Update order status to cancelled
4. Restore inventory (release reserved quantity)
5. Return confirmation

---

## 7. Address APIs

### 7.1 List Addresses

**Endpoint:** `GET /addresses`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr-xxx",
      "label": "Nhà riêng",
      "full_name": "Nguyễn Văn A",
      "phone": "0912345678",
      "address_line1": "123 Đường ABC",
      "address_line2": "Phường XYZ",
      "ward": "Phường 1",
      "district": "Quận 1",
      "city": "TP Hồ Chí Minh",
      "postal_code": "700000",
      "is_default": true
    }
  ]
}
```

---

### 7.2 Create Address

**Endpoint:** `POST /addresses`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "label": "Nhà riêng",
  "full_name": "Nguyễn Văn A",
  "phone": "0912345678",
  "address_line1": "123 Đường ABC",
  "address_line2": "Phường XYZ",
  "ward": "Phường 1",
  "district": "Quận 1",
  "city": "TP Hồ Chí Minh",
  "postal_code": "700000",
  "is_default": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "addr-xxx",
    "label": "Nhà riêng",
    "full_name": "Nguyễn Văn A",
    "is_default": true
  }
}
```

---

### 7.3 Update Address

**Endpoint:** `PUT /addresses/:address_id`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:** Same as create

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "addr-xxx",
    "label": "Công ty",
    ...
  }
}
```

---

### 7.4 Delete Address

**Endpoint:** `DELETE /addresses/:address_id`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Address deleted"
}
```

---

### 7.5 Set Default Address

**Endpoint:** `PUT /addresses/:address_id/default`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Default address updated"
}
```

---

## 8. Wishlist APIs

### 8.1 List Favorites

**Endpoint:** `GET /favorites`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "fav-xxx",
      "product": {
        "id": "prod-xxx",
        "name_vi": "Giày Ultraboost 22",
        "slug": "giay-ultraboost-22",
        "price": 4500000,
        "thumbnail_url": "https://..."
      },
      "created_at": "2024-01-10T12:00:00Z"
    }
  ]
}
```

---

### 8.2 Add to Favorites

**Endpoint:** `POST /favorites`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "product_id": "prod-xxx"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Added to favorites"
}
```

---

### 8.3 Remove from Favorites

**Endpoint:** `DELETE /favorites/:product_id`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

---

## 9. Review APIs

### 9.1 List Product Reviews

**Endpoint:** `GET /products/:slug/reviews`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 10 | Items per page |
| `rating` | integer | - | Filter by rating (1-5) |
| `sort` | string | `newest` | Sort by (newest, rating_high, rating_low) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "review-xxx",
      "user": {
        "id": "user-xxx",
        "full_name": "Nguyễn Văn B",
        "avatar_url": "https://..."
      },
      "rating": 5,
      "comment": "Sản phẩm rất tốt, giao hàng nhanh!",
      "images": ["https://..."],
      "created_at": "2024-01-15T10:30:00Z",
      "helpful_count": 12
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 256,
    "total_pages": 26,
    "average_rating": 4.8,
    "rating_distribution": {
      "5": 200,
      "4": 40,
      "3": 10,
      "2": 4,
      "1": 2
    }
  }
}
```

---

### 9.2 Create Review

**Endpoint:** `POST /products/:slug/reviews`

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "rating": 5,
  "comment": "Sản phẩm rất tốt, giao hàng nhanh!",
  "images": ["https://storage.supabase.co/..."],
  "order_id": "order-xxx"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "review-xxx",
    "rating": 5,
    "comment": "Sản phẩm rất tốt, giao hàng nhanh!"
  },
  "message": "Review submitted successfully"
}
```

**Validation Rules:**
- User must have purchased the product
- Only one review per user per product
- Rating required (1-5)
- Comment optional (min 10 chars if provided)

---

## 10. Banner APIs

### 10.1 Get Active Banners

**Endpoint:** `GET /banners`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `position` | string | Filter by position (hero, mid, bottom) |
| `device` | string | Filter by device (desktop, mobile, both) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hero": [
      {
        "id": "banner-xxx",
        "title_vi": "Summer Sale 2024",
        "subtitle_vi": "Giảm đến 50%",
        "image_url": "https://...",
        "mobile_image_url": "https://...",
        "link_url": "/collections/summer-sale",
        "sort_order": 1
      }
    ],
    "mid": [...],
    "bottom": [...]
  }
}
```

---

## 11. Admin APIs

### 11.1 Admin: Product Management

#### List All Products (Admin)

**Endpoint:** `GET /admin/products`

**Headers:**
```http
Authorization: Bearer <access_token> (admin role required)
```

**Query Parameters:** Same as `/products` + `status`, `sku`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "meta": {...}
}
```

---

#### Create Product

**Endpoint:** `POST /admin/products`

**Headers:**
```http
Authorization: Bearer <access_token> (admin role required)
```

**Request:**
```json
{
  "name_vi": "Giày Ultraboost 22",
  "name_en": "Ultraboost 22 Shoes",
  "description_vi": "...",
  "description_en": "...",
  "price": 4500000,
  "original_price": 5000000,
  "category_id": "cat-xxx",
  "brand": "Adidas",
  "model": "Ultraboost",
  "sku": "GW1228",
  "tags": ["running", "premium"],
  "status": "active",
  "is_featured": true,
  "is_new": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "prod-xxx",
    "name_vi": "Giày Ultraboost 22",
    "slug": "giay-ultraboost-22",
    "..."
  }
}
```

---

#### Update Product

**Endpoint:** `PUT /admin/products/:product_id`

**Request:** Partial update allowed

**Response (200 OK):**
```json
{
  "success": true,
  "data": {...}
}
```

---

#### Delete Product

**Endpoint:** `DELETE /admin/products/:product_id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

### 11.2 Admin: Variant Management

#### Create Variant

**Endpoint:** `POST /admin/products/:product_id/variants`

**Request:**
```json
{
  "size": "42",
  "size_type": "standard",
  "color": "Core Black",
  "color_code": "#000000",
  "sku": "GW1228-42-Black",
  "price_modifier": 0,
  "inventory": {
    "quantity": 100,
    "warehouse_id": "wh-xxx"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "var-xxx",
    "...": "..."
  }
}
```

---

#### Bulk Update Inventory

**Endpoint:** `PUT /admin/inventory/bulk`

**Request:**
```json
{
  "updates": [
    {
      "variant_id": "var-xxx",
      "quantity": 50,
      "adjustment": -10
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "variant_id": "var-xxx",
      "new_quantity": 40
    }
  ]
}
```

---

### 11.3 Admin: Order Management

#### List All Orders (Admin)

**Endpoint:** `GET /admin/orders`

**Headers:**
```http
Authorization: Bearer <access_token> (admin role required)
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `per_page` | integer | Items per page |
| `status` | string | Filter by status |
| `payment_status` | string | Filter by payment |
| `search` | string | Search order number |
| `date_from` | date | Filter from date |
| `date_to` | date | Filter to date |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-xxx",
      "order_number": "ORD-20240115-ABC12345",
      "user": {
        "id": "user-xxx",
        "email": "user@example.com",
        "full_name": "Nguyễn Văn A"
      },
      "status": "pending",
      "total_amount": 9150000,
      "item_count": 2,
      "payment_status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {...}
}
```

---

#### Update Order Status

**Endpoint:** `PUT /admin/orders/:order_id/status`

**Request:**
```json
{
  "status": "shipped",
  "note": "Đã giao cho đơn vị vận chuyển",
  "tracking_number": "GHTK123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "order-xxx",
    "status": "shipped",
    "tracking_number": "GHTK123456"
  }
}
```

**Status Flow:**
```
pending → confirmed → processing → shipped → delivered
    ↓         ↓           ↓
 cancelled  cancelled   cancelled
```

---

### 11.4 Admin: User Management

#### List Users

**Endpoint:** `GET /admin/users`

**Headers:**
```http
Authorization: Bearer <access_token> (admin role required)
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `per_page` | integer | Items per page |
| `role` | string | Filter by role |
| `search` | string | Search email/name |
| `is_active` | boolean | Filter by active status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-xxx",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "customer",
      "order_count": 15,
      "total_spent": 45000000,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {...}
}
```

---

#### Update User Role

**Endpoint:** `PUT /admin/users/:user_id/role`

**Request:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User role updated"
}
```

---

### 11.5 Admin: Analytics Dashboard

#### Dashboard Stats

**Endpoint:** `GET /admin/analytics/dashboard`

**Headers:**
```http
Authorization: Bearer <access_token> (admin role required)
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Period (today, week, month, year) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 150000000,
      "growth_percentage": 15.5,
      "comparison": 130000000
    },
    "orders": {
      "total": 1250,
      "pending": 45,
      "processing": 120,
      "completed": 1085
    },
    "customers": {
      "total": 850,
      "new": 45,
      "active": 320
    },
    "products": {
      "total": 350,
      "out_of_stock": 12,
      "low_stock": 25
    },
    "top_products": [
      {
        "id": "prod-xxx",
        "name_vi": "Giày Ultraboost 22",
        "sold_count": 150,
        "revenue": 675000000
      }
    ],
    "recent_orders": [...]
  }
}
```

---

#### Revenue Chart

**Endpoint:** `GET /admin/analytics/revenue`

**Headers:**
```http
Authorization: Bearer <access_token> (admin role required)
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Period (7d, 30d, 90d, 1y) |
| `group_by` | string | Group by (day, week, month) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "revenue": 5000000,
      "orders": 12,
      "visitors": 2500
    }
  ]
}
```

---

## 12. Webhook APIs

### 12.1 Order Status Update

**Endpoint:** `POST /webhooks/order-status`

**Purpose:** Notify external systems when order status changes

**Headers:**
```http
X-Webhook-Secret: <webhook_secret>
Content-Type: application/json
```

**Payload:**
```json
{
  "event": "order.status_updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "order-xxx",
    "order_number": "ORD-20240115-ABC12345",
    "previous_status": "confirmed",
    "new_status": "shipped",
    "tracking_number": "GHTK123456"
  }
}
```

---

## 13. Error Codes

### 13.1 Authentication Errors

| Code | Message | HTTP Status |
|------|---------|-------------|
| `AUTH_TOKEN_EXPIRED` | Token has expired | 401 |
| `AUTH_TOKEN_INVALID` | Invalid token | 401 |
| `AUTH_USER_NOT_FOUND` | User not found | 404 |
| `AUTH_EMAIL_EXISTS` | Email already registered | 409 |
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password | 401 |
| `AUTH_GOOGLE_FAILED` | Google authentication failed | 401 |

### 13.2 Validation Errors

| Code | Message | HTTP Status |
|------|---------|-------------|
| `VALIDATION_ERROR` | Validation failed | 400 |
| `VALIDATION_EMAIL_INVALID` | Invalid email format | 400 |
| `VALIDATION_PASSWORD_WEAK` | Password too weak | 400 |
| `VALIDATION_REQUIRED` | Field is required | 400 |

### 13.3 Business Logic Errors

| Code | Message | HTTP Status |
|------|---------|-------------|
| `CART_EMPTY` | Cart is empty | 400 |
| `PRODUCT_OUT_OF_STOCK` | Product out of stock | 400 |
| `INVENTORY_CONFLICT` | Cannot reserve inventory | 409 |
| `ORDER_CANNOT_CANCEL` | Order cannot be cancelled | 400 |
| `REVIEW_EXISTS` | You have already reviewed this product | 409 |
| `PROMO_INVALID` | Invalid promo code | 400 |
| `PROMO_EXPIRED` | Promo code has expired | 400 |

### 13.4 Permission Errors

| Code | Message | HTTP Status |
|------|---------|-------------|
| `PERMISSION_DENIED` | Permission denied | 403 |
| `ADMIN_REQUIRED` | Admin access required | 403 |
| `OWNER_REQUIRED` | You don't own this resource | 403 |

---

## 14. Rate Limiting

### 14.1 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 5 requests | 1 minute |
| Search | 30 requests | 1 minute |
| Cart Operations | 20 requests | 1 minute |
| Admin APIs | 200 requests | 1 minute |

### 14.2 Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

---

## 15. Pagination

### 15.1 Cursor-based Pagination (Recommended for large datasets)

**Request:**
```http
GET /products?cursor=eyJpZCI6MTIzfQ&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "next_cursor": "eyJpZCI6MTQzfQ",
    "has_more": true
  }
}
```

### 15.2 Offset-based Pagination

**Request:**
```http
GET /products?page=2&per_page=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 2,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": true
  }
}
```

---

## 16. OpenAPI Specification

Full OpenAPI 3.0 specification available at:
- Local: `http://localhost:3000/api/docs`
- Staging: `https://api-staging.adidas-clone.vn/api/docs`
- Production: `https://api.adidas-clone.vn/api/docs`

---

**Document Version:** 1.0
**Last Updated:** 2026-05-13
**Author:** Development Team
**Status:** Ready for Implementation
