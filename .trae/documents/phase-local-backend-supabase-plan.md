# Kế hoạch: chạy backend local + test DB/API (chuẩn bị cho deploy sau)

## Summary

Mục tiêu trước mắt là chạy được backend Node/Express ở local, kết nối Supabase (cloud) + Redis Upstash, và có các endpoint “smoke test” để xác nhận:

* server chạy ổn

* truy vấn DB hoạt động (schema đã apply)

* redis kết nối được

Chưa triển khai frontend trong giai đoạn này (test bằng curl/Postman trước). Sau khi ổn mới chuyển sang dockerize + deploy EC2.

## Current State Analysis (repo hiện tại)

* Root repo có:

  * Netlify Functions API tối thiểu: [api.ts](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/netlify/functions/api.ts) + libs (cors/env/redis/supabase)

  * Cấu hình Netlify redirect `/api/*` → functions: [netlify.toml](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/netlify.toml)

  * `public/index.html` chỉ là trang tĩnh demo

  * `.env.example` đã có các biến môi trường chính: [.env.example](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/.env.example)

* Đã có backend Express tối thiểu trong `backend/`:

  * Entry: [backend/src/index.ts](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/backend/src/index.ts)

  * Redis client: [backend/src/lib/redis.ts](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/backend/src/lib/redis.ts)

  * Supabase admin client: [backend/src/lib/supabase.ts](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/backend/src/lib/supabase.ts)

  * Dockerfile/compose đã có, nhưng giai đoạn này ưu tiên chạy Node script local trước.

* Spec DB nằm trong: [DATAMODEL.md](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/docs/DATAMODEL.md)

## Goal & Success Criteria

* Backend local chạy được bằng Node script (không cần Docker) và lắng nghe trên `http://localhost:3000`.

* DB schema được áp dụng lên Supabase cloud theo [DATAMODEL.md](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/docs/DATAMODEL.md).

* Các endpoint test tối thiểu trả về đúng:

  * `GET /v1/health` → 200

  * `GET /v1/redis/ping` → 200 (khi có `REDIS_URL`)

  * `GET /v1/categories` → trả về danh sách categories (ít nhất 4 bản ghi mẫu)

  * `GET /v1/products` → trả về danh sách sản phẩm (seed tối thiểu để test)

## Assumptions & Decisions

* Chọn kiến trúc A: frontend deploy Netlify sau; backend Express là nguồn API chính (local → deploy server riêng).

* DB mode: Supabase cloud (không chạy Postgres local).

* Redis: dùng `REDIS_URL` dạng `rediss://...` (Upstash).

* Bắt buộc rotate secrets đã lộ trước đó (Supabase keys, Google secret, Redis password). Nếu không rotate thì không đạt tiêu chí an toàn tối thiểu để tiếp tục phát triển.

## Proposed Changes (sẽ thực hiện khi thoát Plan mode)

### 1) Chuẩn hoá Supabase CLI + migrations trong repo

**Files/thư mục dự kiến thêm:**

* `supabase/config.toml`

* `supabase/migrations/*_init.sql`

* `supabase/seed.sql` (hoặc `supabase/seed/*.sql` tuỳ cấu trúc)

**Nội dung:**

* Chuyển toàn bộ SQL trong [DATAMODEL.md](file:///c:/Users/Admin/Desktop/trae/Adidas_clone/docs/DATAMODEL.md) thành migration(s) có thứ tự:

  * types/enums

  * tables

  * indexes

  * triggers/functions (search\_vector, updated\_at, …)

  * RLS + policies

* Tạo seed data tối thiểu để test nhanh:

  * 4 categories (giày/áo/quần/phụ kiện)

  * 10–20 products + vài variants + inventory (chưa cần 100+ ở bước này)

**Yêu cầu đầu vào để CLI chạy được với Supabase cloud:**

* Supabase CLI cài trên máy bạn (Windows)

* `supabase login` (cần Supabase access token)

* `supabase link --project-ref dkiyebouwluyswjmqfor`

* Thông tin DB password/connection mà CLI yêu cầu để `db push` (lấy trong Supabase Dashboard → Project Settings → Database)

### 2) Backend Express: bổ sung “smoke test endpoints” dùng Supabase

**Files sẽ chỉnh:**

* `backend/src/index.ts`

* Có thể thêm `backend/src/routes/*.ts` để tách route (nếu cần)

**Nội dung:**

* Thêm client Supabase admin (đã có) để query các bảng public.

* Thêm endpoints:

  * `GET /v1/categories`: select danh sách categories

  * `GET /v1/products`: select danh sách products (có limit/offset đơn giản)

* Chuẩn hoá response theo format đơn giản `{ success, data, error }` (đang dùng dạng này ở health/redis)

### 3) Chuẩn hoá hướng dẫn chạy local

**Files sẽ chỉnh/thêm:**

* Cập nhật `.env.example` (nhấn mạnh `SUPABASE_URL` không có `/rest/v1/`, tách rõ anon vs service role)

* Thêm `docs/RUN_LOCAL_BACKEND.md`

**Nội dung:**

* Hướng dẫn tạo `backend/.env` và chạy:

  * `npm install`

  * `npm run dev`

* Hướng dẫn test bằng curl/Postman cho các endpoint.

### 4) (Để sau) Dockerize + deploy EC2

* Dockerfile/compose và Nginx config đã có sẵn trong repo, nhưng sẽ chỉ “bật” sau khi local test pass.

* Khi chuyển sang deploy:

  * dùng Elastic IP + Nginx reverse proxy

  * thêm domain + HTTPS (Let’s Encrypt) nếu cần

## Verification (các bước kiểm chứng sau khi implement)

### A) Verify DB migrations

* Xác nhận migrations chạy thành công lên Supabase cloud.

* Vào Supabase Table Editor kiểm tra tables + RLS enabled.

* Chạy seed và xác nhận có dữ liệu mẫu (categories/products/variants/inventory).

### B) Verify backend local

* Chạy backend local.

* Test:

  * `GET http://localhost:3000/v1/health`

  * `GET http://localhost:3000/v1/redis/ping` (nếu có `REDIS_URL`)

  * `GET http://localhost:3000/v1/categories`

  * `GET http://localhost:3000/v1/products?limit=20&offset=0`

### C) Verify error cases tối thiểu

* Không set `REDIS_URL` → `/v1/redis/ping` trả 501 với mã lỗi `REDIS_NOT_CONFIGURED`.

* DB chưa migrate/seed → `/v1/categories` trả lỗi 5xx (thể hiện rõ message) để debug nhanh.

## Risks / Notes

* Không rotate keys/secret đã lộ: rủi ro bị chiếm quyền Supabase/Google/Redis. Đây là blocker an toàn bắt buộc.

* RLS: nếu backend dùng service role thì bypass RLS; giai đoạn smoke test OK, nhưng về sau cần tách rõ endpoint public (anon) vs admin (service role) và cơ chế auth thực.

