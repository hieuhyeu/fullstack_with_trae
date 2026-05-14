# Tạo database + mock data (Supabase cloud)

## Về việc “cào” dữ liệu/ảnh trên internet

- Không khuyến nghị cào ảnh/dữ liệu từ adidas.vn hay nguồn có bản quyền để đưa vào demo/production.
- Seed trong repo này tạo dữ liệu giả lập và dùng URL ảnh tạo tự động (không lấy asset thương hiệu).
- Nếu bạn muốn dùng ảnh thật: chỉ nên dùng ảnh bạn sở hữu hoặc nguồn có giấy phép rõ ràng.

## 1) Apply schema lên Supabase

Schema nằm ở:
- [001_init.sql](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/supabase/migrations/001_init.sql)

### Cách A (khuyến nghị): Supabase CLI

1) Cài Supabase CLI (Windows)
- Cách phổ biến: dùng Scoop hoặc Chocolatey, hoặc cài theo hướng dẫn chính thức của Supabase.

2) Login + link project

```bash
supabase login
supabase link --project-ref dkiyebouwluyswjmqfor
```

3) Chạy migrations lên remote

```bash
supabase db push
```

Trong quá trình chạy CLI có thể yêu cầu DB password (lấy ở Supabase Dashboard → Project Settings → Database).

### Cách B: Supabase Dashboard (SQL Editor)

Nếu bạn chưa cài CLI, có thể copy toàn bộ nội dung `001_init.sql` và chạy trong SQL Editor.

## 2) Seed mock data 100+ sản phẩm

Seed script:
- [seed.ts](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/backend/src/seed.ts)

### Chuẩn bị env cho backend

Tạo file `backend/.env`:

```env
SUPABASE_URL=https://dkiyebouwluyswjmqfor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379

SEED_PRODUCTS=120
SEED_RESET=true
```

### Chạy seed

```bash
cd backend
npm install
npm run seed
```

Kết quả sẽ in ra số lượng bản ghi đã tạo.

## 3) Test API local (Express)

Chạy backend:

```bash
cd backend
npm run dev
```

Test:
- `GET http://localhost:3000/v1/health`
- `GET http://localhost:3000/v1/categories`
- `GET http://localhost:3000/v1/products?limit=20&offset=0`
- `GET http://localhost:3000/v1/products?q=alpha`

