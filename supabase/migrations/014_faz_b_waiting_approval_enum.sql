-- Faz B: add waiting_approval enum value (own migration — PG cannot use new enum in same txn)

alter type public.work_order_status add value if not exists 'waiting_approval';
