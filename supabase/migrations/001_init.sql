create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('customer', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'category_type') then
    create type category_type as enum ('shoes', 'apparel', 'accessories', 'collections');
  end if;

  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type product_status as enum ('draft', 'active', 'discontinued');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone varchar(20),
  avatar_url text,
  role user_role default 'customer',
  is_active boolean default true,
  email_verified boolean default false,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_vi text not null,
  name_en text not null,
  slug text unique not null,
  description text,
  type category_type default 'apparel',
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  icon varchar(50),
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_parent on public.categories(parent_id);
create index if not exists idx_categories_type on public.categories(type);
create index if not exists idx_categories_active on public.categories(is_active) where is_active = true;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name_vi text not null,
  name_en text not null,
  slug text unique not null,
  description_vi text,
  description_en text,
  price numeric(12,2) not null,
  compare_at_price numeric(12,2),
  status product_status default 'draft',
  is_featured boolean default false,
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_featured on public.products(is_featured) where is_featured = true;
create index if not exists idx_products_search on public.products using gin(search_vector);

create or replace function public.products_update_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector(
      'simple',
      coalesce(new.name_vi, '') || ' ' ||
      coalesce(new.name_en, '') || ' ' ||
      coalesce(new.description_vi, '') || ' ' ||
      coalesce(new.description_en, '')
    );
  return new;
end;
$$;

drop trigger if exists trg_products_search_vector on public.products;
create trigger trg_products_search_vector
before insert or update on public.products
for each row execute function public.products_update_search_vector();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_product_images_product_id on public.product_images(product_id);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  size text not null,
  color text not null,
  created_at timestamptz default now()
);

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_size on public.product_variants(size);
create index if not exists idx_product_variants_color on public.product_variants(color);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants(id) on delete cascade,
  quantity integer not null default 0,
  reserved_quantity integer not null default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_inventory_variant_id on public.inventory(variant_id);

drop trigger if exists trg_inventory_updated_at on public.inventory;
create trigger trg_inventory_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
on public.categories for select
using (true);

drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
on public.products for select
using (true);

drop policy if exists "Product images are viewable by everyone" on public.product_images;
create policy "Product images are viewable by everyone"
on public.product_images for select
using (true);

drop policy if exists "Product variants are viewable by everyone" on public.product_variants;
create policy "Product variants are viewable by everyone"
on public.product_variants for select
using (true);

drop policy if exists "Inventory is viewable by everyone" on public.inventory;
create policy "Inventory is viewable by everyone"
on public.inventory for select
using (true);

drop policy if exists "Only admins can insert categories" on public.categories;
create policy "Only admins can insert categories"
on public.categories for insert
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can update categories" on public.categories;
create policy "Only admins can update categories"
on public.categories for update
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can delete categories" on public.categories;
create policy "Only admins can delete categories"
on public.categories for delete
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can insert products" on public.products;
create policy "Only admins can insert products"
on public.products for insert
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can update products" on public.products;
create policy "Only admins can update products"
on public.products for update
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can delete products" on public.products;
create policy "Only admins can delete products"
on public.products for delete
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can manage product images" on public.product_images;
create policy "Only admins can manage product images"
on public.product_images for all
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can manage product variants" on public.product_variants;
create policy "Only admins can manage product variants"
on public.product_variants for all
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Only admins can manage inventory" on public.inventory;
create policy "Only admins can manage inventory"
on public.inventory for all
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

