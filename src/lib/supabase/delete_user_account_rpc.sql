-- RUN THIS QUERY IN YOUR SUPABASE SQL EDITOR
-- This function deletes all user data securely and removes the auth user account
-- so you can sign up again with the exact same email address.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser/admin privileges to delete from auth.users
AS $$
DECLARE
  calling_user_id UUID;
BEGIN
  -- Get the UUID of the user making the RPC call
  calling_user_id := auth.uid();

  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete all payments associated with this user
  DELETE FROM public.payments WHERE user_id = calling_user_id;

  -- 2. Delete all milk entries associated with this user
  DELETE FROM public.milk_entries WHERE user_id = calling_user_id;

  -- 3. Delete all bills and their line items for this user's customers
  DELETE FROM public.bill_line_items WHERE bill_id IN (
    SELECT id FROM public.bills WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = calling_user_id
    )
  );
  DELETE FROM public.bills WHERE customer_id IN (
    SELECT id FROM public.customers WHERE user_id = calling_user_id
  );

  -- 4. Delete all customers associated with this user
  DELETE FROM public.customers WHERE user_id = calling_user_id;

  -- 5. Delete all expenses associated with this user
  DELETE FROM public.expenses WHERE user_id = calling_user_id;

  -- 6. Delete audit logs associated with this user
  DELETE FROM public.audit_logs WHERE user_id = calling_user_id;

  -- 7. Delete the auth user itself from Supabase auth schemas
  DELETE FROM auth.users WHERE id = calling_user_id;
END;
$$;
