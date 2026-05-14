do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('cod', 'bank_transfer', 'momo', 'vnpay');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
end $$;

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 10),
  is_selected boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, product_id, variant_id)
);

create index if not exists idx_cart_user on public.cart_items(user_id);
create index if not exists idx_cart_product on public.cart_items(product_id);
create index if not exists idx_cart_variant on public.cart_items(variant_id);

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(50) unique not null,
  user_id uuid not null references public.profiles(id),
  status order_status default 'pending',
  subtotal numeric(12,2) not null,
  discount_amount numeric(12,2) default 0,
  shipping_fee numeric(12,2) default 0,
  tax_amount numeric(12,2) default 0,
  total_amount numeric(12,2) not null,
  payment_method payment_method default 'cod',
  payment_status payment_status default 'pending',
  payment_id varchar(100),
  paid_at timestamptz,
  shipping_address jsonb not null,
  shipping_method varchar(50),
  tracking_number varchar(100),
  notes text,
  is_online boolean default true,
  referrer_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_payment on public.orders(payment_status);

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
begin
  new.order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(new.id::text, 1, 8));
  return new;
end;
$$;

drop trigger if exists trg_generate_order_number on public.orders;
create trigger trg_generate_order_number
before insert on public.orders
for each row execute function public.generate_order_number();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid references public.product_variants(id),
  product_name_snapshot text not null,
  variant_snapshot jsonb,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  discount_amount numeric(12,2) default 0,
  subtotal numeric(12,2) not null,
  created_at timestamptz default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);

alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users can view own cart" on public.cart_items;
create policy "Users can view own cart"
on public.cart_items for select
using (auth.uid() = user_id);

drop policy if exists "Users can add to own cart" on public.cart_items;
create policy "Users can add to own cart"
on public.cart_items for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cart" on public.cart_items;
create policy "Users can update own cart"
on public.cart_items for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own cart items" on public.cart_items;
create policy "Users can delete own cart items"
on public.cart_items for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
on public.orders for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own pending orders" on public.orders;
create policy "Users can update own pending orders"
on public.orders for update
using (auth.uid() = user_id and status = 'pending');

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
on public.orders for select
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
on public.orders for update
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Order items are viewable by order owner or admin" on public.order_items;
create policy "Order items are viewable by order owner or admin"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (
      o.user_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  )
);

drop policy if exists "Order items created by order rules" on public.order_items;
create policy "Order items created by order rules"
on public.order_items for insert
with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

create or replace function public.create_order_from_cart(
  p_user_id uuid,
  p_shipping_address jsonb,
  p_payment_method payment_method default 'cod',
  p_shipping_method varchar default 'standard',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(12,2);
begin
  if p_shipping_address is null then
    raise exception 'Invalid shipping address';
  end if;

  if not exists (select 1 from public.cart_items ci where ci.user_id = p_user_id and ci.is_selected = true) then
    raise exception 'Cart is empty';
  end if;

  perform 1
  from public.cart_items ci
  join public.inventory i on i.variant_id = ci.variant_id
  where ci.user_id = p_user_id and ci.is_selected = true
    and (i.quantity - i.reserved_quantity) < ci.quantity;

  if found then
    raise exception 'Insufficient stock';
  end if;

  select coalesce(sum(p.price * ci.quantity), 0)
  into v_subtotal
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_user_id and ci.is_selected = true;

  insert into public.orders (
    order_number,
    user_id,
    status,
    subtotal,
    total_amount,
    payment_method,
    payment_status,
    shipping_address,
    shipping_method,
    notes
  )
  values (
    'TEMP',
    p_user_id,
    'pending',
    v_subtotal,
    v_subtotal,
    p_payment_method,
    'pending',
    p_shipping_address,
    p_shipping_method,
    p_notes
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    variant_id,
    product_name_snapshot,
    variant_snapshot,
    quantity,
    unit_price,
    subtotal
  )
  select
    v_order_id,
    ci.product_id,
    ci.variant_id,
    p.name_vi,
    jsonb_build_object('size', v.size, 'color', v.color),
    ci.quantity,
    p.price,
    p.price * ci.quantity
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  left join public.product_variants v on v.id = ci.variant_id
  where ci.user_id = p_user_id and ci.is_selected = true;

  update public.inventory i
  set quantity = i.quantity - ci.quantity
  from public.cart_items ci
  where ci.user_id = p_user_id and ci.is_selected = true
    and ci.variant_id = i.variant_id;

  delete from public.cart_items where user_id = p_user_id;

  return v_order_id;
end;
$$;

