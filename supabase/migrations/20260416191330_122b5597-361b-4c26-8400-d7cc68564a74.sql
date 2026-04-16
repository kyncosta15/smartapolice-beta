UPDATE public.fleet_change_requests
SET status = 'aberto',
    payload = payload - 'auto_aprovado_via_codigo' - 'auto_aprovado_em',
    updated_at = now()
WHERE id = '7d08832c-1ebb-4601-8b47-236212784e9b';