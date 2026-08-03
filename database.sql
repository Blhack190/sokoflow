-- =============================================================================
-- SOKO FLOW COMPLETE DATABASE SCHEMA & SUPER ADMIN AUDIT SYSTEM
-- Database Target: Supabase PostgreSQL Engine
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('SELLER', 'CUSTOMER', 'ADMIN');
CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN_STAFF', 'SUPPORT_STAFF');
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPING', 'ARRIVED', 'DELIVERED', 'CANCELLED');
CREATE TYPE import_status AS ENUM ('CREATED', 'SUPPLIER_CONFIRMED', 'PAYMENT_SENT', 'SHIPPING', 'CUSTOMS', 'ARRIVED', 'DELIVERED');

-- 1. USERS & PROFILES
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'SELLER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STORES
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    momo_number VARCHAR(50) NOT NULL DEFAULT '0551690560',
    momo_account_name VARCHAR(150) NOT NULL DEFAULT 'CHARLES ALBERT QUIST',
    whatsapp_phone VARCHAR(50) NOT NULL DEFAULT '+233202824902',
    whatsapp_group_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT NOT NULL,
    import_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. IMPORT BATCHES
CREATE TABLE public.import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. SF-001
    origin_country VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    status import_status DEFAULT 'CREATED',
    estimated_arrival DATE,
    shipping_cost DECIMAL(12,2) DEFAULT 0.00,
    customs_fee DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ORDERS
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL,
    status order_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DATA BUNDLES (36 PACKAGES DIRECT PRICES)
CREATE TABLE public.data_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network VARCHAR(50) NOT NULL, -- mtn, airteltigo, telecel
    bundle_name VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    direct_price DECIMAL(10,2) NOT NULL
);

-- 7. SUPER ADMIN AUDIT LOGS
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_identity VARCHAR(150) NOT NULL,
    role admin_role NOT NULL DEFAULT 'SUPER_ADMIN',
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. STORE VERIFICATION REQUESTS
CREATE TABLE public.store_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    document_urls JSONB,
    status VARCHAR(50) DEFAULT 'PENDING',
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_identity VARCHAR(150)
);

-- INDEXES FOR SPEED
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_import_batch_code ON public.import_batches(batch_code);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Stores Viewable" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Public Products Viewable" ON public.products FOR SELECT USING (true);