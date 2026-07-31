CREATE TABLE IF NOT EXISTS public.purchasing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL,
    item_description TEXT NOT NULL,
    supplier_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    date_purchased TIMESTAMPTZ NOT NULL,
    date_arrived TIMESTAMPTZ,
    remarks TEXT,
    created_by TEXT
);
