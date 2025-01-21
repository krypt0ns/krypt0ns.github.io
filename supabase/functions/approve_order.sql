create or replace function approve_order(
    p_order_id uuid,
    p_user_id text,
    p_price numeric,
    p_payment_method text,
    p_listing_id uuid,
    p_account_details jsonb
) returns void as $$
begin
    -- Update order status
    update orders
    set status = 'Completed',
        completed_at = now(),
        account_details = p_account_details
    where id = p_order_id;

    -- If payment method is balance, deduct from user
    if p_payment_method = 'balance' then
        update users
        set balance = balance - p_price
        where username = p_user_id;
    end if;
end;
$$ language plpgsql security definer; 