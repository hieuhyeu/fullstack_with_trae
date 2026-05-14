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
  v_auth_user uuid;
  v_order_id uuid;
  v_subtotal numeric(12,2);
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'Unauthorized';
  end if;

  if p_user_id is null or p_user_id <> v_auth_user then
    raise exception 'Forbidden';
  end if;

  if p_shipping_address is null then
    raise exception 'Invalid shipping address';
  end if;

  if not exists (select 1 from public.cart_items ci where ci.user_id = v_auth_user and ci.is_selected = true) then
    raise exception 'Cart is empty';
  end if;

  perform 1
  from public.cart_items ci
  join public.inventory i on i.variant_id = ci.variant_id
  where ci.user_id = v_auth_user and ci.is_selected = true
    and (i.quantity - i.reserved_quantity) < ci.quantity;

  if found then
    raise exception 'Insufficient stock';
  end if;

  select coalesce(sum(p.price * ci.quantity), 0)
  into v_subtotal
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = v_auth_user and ci.is_selected = true;

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
    v_auth_user,
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
  where ci.user_id = v_auth_user and ci.is_selected = true;

  update public.inventory i
  set quantity = i.quantity - ci.quantity
  from public.cart_items ci
  where ci.user_id = v_auth_user and ci.is_selected = true
    and ci.variant_id = i.variant_id;

  delete from public.cart_items where user_id = v_auth_user;

  return v_order_id;
end;
$$;

create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_status order_status;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'Unauthorized';
  end if;

  select o.status
  into v_status
  from public.orders o
  where o.id = p_order_id and o.user_id = v_auth_user;

  if not found then
    raise exception 'Not found';
  end if;

  if v_status not in ('pending', 'confirmed') then
    raise exception 'Order cannot be cancelled';
  end if;

  update public.orders
  set status = 'cancelled',
      notes = case
        when p_reason is null or length(trim(p_reason)) = 0 then notes
        when notes is null or length(trim(notes)) = 0 then p_reason
        else notes || ' | cancel_reason: ' || p_reason
      end
  where id = p_order_id;

  update public.inventory i
  set quantity = i.quantity + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.variant_id = i.variant_id;
end;
$$;

