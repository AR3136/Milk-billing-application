-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper trigger function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 2. CUSTOMERS
-- ============================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    milk_type VARCHAR(10) NOT NULL CHECK (milk_type IN ('cow', 'buffalo', 'mixed')),
    default_quantity NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    rate_per_liter NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_customers_modtime
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 3. MILK RATES (Temporal/Quality-based pricing)
-- ============================================================
CREATE TABLE milk_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milk_type VARCHAR(10) NOT NULL CHECK (milk_type IN ('cow', 'buffalo', 'mixed')),
    base_rate NUMERIC(5,2) NOT NULL,       -- Base price per liter
    fat_standard NUMERIC(4,2),             -- Standard Fat % e.g. 6.0
    snf_standard NUMERIC(4,2),             -- Standard SNF % e.g. 8.5
    rate_per_fat NUMERIC(4,2),             -- Premium/Deduction rate per Fat % deviation
    rate_per_snf NUMERIC(4,2),             -- Premium/Deduction rate per SNF % deviation
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_milk_rates_modtime
    BEFORE UPDATE ON milk_rates
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 4. MILK ENTRIES
-- ============================================================
CREATE TABLE milk_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    shift VARCHAR(10) NOT NULL CHECK (shift IN ('morning', 'evening')),
    quantity NUMERIC(6,2) NOT NULL CHECK (quantity > 0),
    fat NUMERIC(4,2),                      -- Measured fat %
    snf NUMERIC(4,2),                      -- Measured SNF %
    rate_applied NUMERIC(5,2) NOT NULL,    -- Final price/liter applied
    amount NUMERIC(8,2) NOT NULL,          -- quantity * rate_applied
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_milk_entries_modtime
    BEFORE UPDATE ON milk_entries
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 5. BILLS
-- ============================================================
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_quantity NUMERIC(8,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    balance_forward NUMERIC(10,2) DEFAULT 0.00 NOT NULL, -- Dues from previous cycles
    net_payable NUMERIC(10,2) NOT NULL,     -- total_amount + balance_forward
    status VARCHAR(15) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'generated', 'sent', 'paid', 'partially_paid', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_bills_modtime
    BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 6. BILL LINE ITEMS (Itemized invoices details mapping)
-- ============================================================
CREATE TABLE bill_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    milk_entry_id UUID UNIQUE NOT NULL REFERENCES milk_entries(id) ON DELETE RESTRICT,
    quantity NUMERIC(6,2) NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    amount NUMERIC(8,2) NOT NULL
);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL, -- optional mapping to invoice
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(15) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque')),
    reference_number VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_payments_modtime
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 8. EXPENSES
-- ============================================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(20) NOT NULL CHECK (category IN ('feed', 'transport', 'equipment', 'salary', 'maintenance', 'veterinary', 'other')),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    receipt_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_expenses_modtime
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(15) NOT NULL CHECK (type IN ('sms', 'whatsapp', 'in_app')),
    recipient VARCHAR(50) NOT NULL,        -- Phone or email
    message TEXT NOT NULL,
    status VARCHAR(15) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 10. BUSINESS SETTINGS (Configuration)
-- ============================================================
CREATE TABLE business_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_settings_modtime
    BEFORE UPDATE ON business_settings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 11. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,           -- e.g. 'INSERT_MILK_ENTRY', 'GENERATE_BILL'
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,                      -- State prior to change
    new_values JSONB,                      -- State after change
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- PERFORMANCE INDEXES (DDL Optimization)
-- ============================================================

-- Customers
CREATE INDEX idx_customers_active ON customers(id) WHERE deleted_at IS NULL;

-- Milk Entries
CREATE INDEX idx_milk_entries_search ON milk_entries(customer_id, date, shift) WHERE deleted_at IS NULL;
CREATE INDEX idx_milk_entries_date ON milk_entries(date) WHERE deleted_at IS NULL;

-- Bills
CREATE INDEX idx_bills_customer ON bills(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bills_date ON bills(from_date, to_date) WHERE deleted_at IS NULL;

-- Payments
CREATE INDEX idx_payments_customer ON payments(customer_id, payment_date) WHERE deleted_at IS NULL;

-- Milk Rates
CREATE INDEX idx_milk_rates_dates ON milk_rates(milk_type, effective_from, effective_to);

-- Audit logs
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
