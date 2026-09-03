-- =====================================================================
-- Pharmacy Inventory Management System — PostgreSQL Schema
-- Normalized to 3NF: categories and suppliers are referenced by id from
-- medicines (no duplicated category/supplier text on the medicine row).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE
                   CONSTRAINT users_email_gmail_check
                   CHECK (email ~* '^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$'),
  password_hash  TEXT NOT NULL,
  role           VARCHAR(20) NOT NULL DEFAULT 'staff'
                   CHECK (role IN ('admin', 'staff')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfills the constraint onto a users table created before this rule
-- existed, so `npm run migrate` upgrades existing databases too. This will
-- fail loudly (as it should) if existing rows already violate the rule —
-- update or remove any non-Gmail user rows first in that case.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_gmail_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_gmail_check
      CHECK (email ~* '^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL UNIQUE,
  description  TEXT,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(150),
  phone        VARCHAR(30)
                 CONSTRAINT suppliers_phone_pk_check
                 CHECK (phone IS NULL OR phone ~ '^(\+92[0-9]{10}|0[0-9]{10}|\+92-[0-9]{3}-[0-9]{7})$'),
  address      TEXT,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfills this constraint onto a suppliers table created before this
-- rule existed, so `npm run migrate` upgrades existing databases too.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_phone_pk_check'
  ) THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_phone_pk_check
      CHECK (phone IS NULL OR phone ~ '^(\+92[0-9]{10}|0[0-9]{10}|\+92-[0-9]{3}-[0-9]{7})$');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- MEDICINES  (Product = Medicine)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  generic_name   VARCHAR(150),
  sku            VARCHAR(60) NOT NULL UNIQUE,
  description    TEXT,
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id    INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  price          NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  quantity       INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  minimum_stock  INTEGER NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
  image_url      TEXT,
  is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- MEDICINE BATCHES  (a medicine can have many batches / expiry lots)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicine_batches (
  id              SERIAL PRIMARY KEY,
  medicine_id     INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  batch_number    VARCHAR(80) NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  purchase_price  NUMERIC(10, 2) CHECK (purchase_price >= 0),
  expiry_date     DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (medicine_id, batch_number)
);

-- ---------------------------------------------------------------------
-- INVENTORY HISTORY  (every stock mutation is logged here)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_history (
  id                  SERIAL PRIMARY KEY,
  medicine_id         INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  transaction_type    VARCHAR(10) NOT NULL CHECK (transaction_type IN ('IN', 'OUT')),
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  previous_quantity   INTEGER NOT NULL CHECK (previous_quantity >= 0),
  new_quantity        INTEGER NOT NULL CHECK (new_quantity >= 0),
  reason              VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- INDEXES — support search / filter / sort at scale
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_medicines_sku          ON medicines (sku);
CREATE INDEX IF NOT EXISTS idx_medicines_name          ON medicines (name);
CREATE INDEX IF NOT EXISTS idx_medicines_category_id   ON medicines (category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_supplier_id   ON medicines (supplier_id);
CREATE INDEX IF NOT EXISTS idx_medicines_price         ON medicines (price);
CREATE INDEX IF NOT EXISTS idx_medicines_quantity      ON medicines (quantity);
CREATE INDEX IF NOT EXISTS idx_medicines_created_at    ON medicines (created_at);
CREATE INDEX IF NOT EXISTS idx_medicines_is_deleted    ON medicines (is_deleted);
-- Trigram-free but still useful case-insensitive search index
CREATE INDEX IF NOT EXISTS idx_medicines_name_lower    ON medicines (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_medicines_generic_lower ON medicines (LOWER(generic_name));

CREATE INDEX IF NOT EXISTS idx_batches_expiry_date     ON medicine_batches (expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id     ON medicine_batches (medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number    ON medicine_batches (batch_number);

CREATE INDEX IF NOT EXISTS idx_history_medicine_id     ON inventory_history (medicine_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at      ON inventory_history (created_at);
CREATE INDEX IF NOT EXISTS idx_history_user_id         ON inventory_history (user_id);
CREATE INDEX IF NOT EXISTS idx_history_type            ON inventory_history (transaction_type);

CREATE INDEX IF NOT EXISTS idx_users_email             ON users (email);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger (keeps updated_at accurate everywhere)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_medicines_updated_at ON medicines;
CREATE TRIGGER trg_medicines_updated_at BEFORE UPDATE ON medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_batches_updated_at ON medicine_batches;
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON medicine_batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();