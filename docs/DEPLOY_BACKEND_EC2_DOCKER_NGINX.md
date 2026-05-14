# Deploy backend (EC2 + Docker + Nginx)

## 1) Chuẩn bị EC2

- Tạo EC2 (Ubuntu) và gán Elastic IP
- Security Group inbound:
  - 22 (SSH) giới hạn IP của bạn
  - 80 (HTTP) từ 0.0.0.0/0
  - 443 (HTTPS) từ 0.0.0.0/0 (nếu sau này dùng domain + SSL)

## 2) Cài Docker + Compose + Nginx trên EC2

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nginx
sudo systemctl enable --now docker nginx
```

Tuỳ chọn (để không cần sudo khi chạy docker):

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 3) Deploy source code lên EC2

Ví dụ:

```bash
git clone <YOUR_REPO_URL> adidas-clone
cd adidas-clone/backend
```

## 4) Tạo file env cho backend

Tạo file `backend/.env` trên EC2 (không commit):

```env
PORT=3000
CORS_ORIGIN=https://<your-site>.netlify.app

SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379
```

## 5) Chạy backend bằng Docker Compose

```bash
docker compose up -d --build
docker compose ps
```

Kiểm tra backend (trên EC2):

```bash
curl -s http://127.0.0.1:3000/v1/health
```

## 6) Cấu hình Nginx reverse proxy tới container

Copy file cấu hình mẫu trong repo vào Nginx:

```bash
sudo cp ../deploy/nginx/adidas-backend.conf /etc/nginx/sites-available/adidas-backend
sudo ln -sf /etc/nginx/sites-available/adidas-backend /etc/nginx/sites-enabled/adidas-backend
sudo rm -f /etc/nginx/sites-enabled/default
```

Test và reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Kiểm tra từ máy bạn (thay `ELASTIC_IP`):

```bash
curl -s http://ELASTIC_IP/v1/health
```

## 7) HTTPS (khuyến nghị)

Nếu bạn muốn HTTPS chuẩn, cách tốt nhất là dùng domain (ví dụ `api.yourdomain.com`) trỏ về Elastic IP rồi dùng Let’s Encrypt (Certbot).

