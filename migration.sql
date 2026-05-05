-- ─────────────────────────────────────────────────────────────
-- Grails MVP — Supabase Migration
-- Run this entire file in Supabase SQL Editor
-- Dashboard → SQL Editor → paste all → Run
-- ─────────────────────────────────────────────────────────────

-- Enums
CREATE TYPE condition_grade     AS ENUM ('MINT','VERY_GOOD','GOOD','FAIR');
CREATE TYPE listing_status      AS ENUM ('ACTIVE','UNDER_OFFER','SOLD','WITHDRAWN');
CREATE TYPE proof_type          AS ENUM ('INVOICE_UPLOAD','EMAIL_PARSE','MANUAL_REVIEW','UNVERIFIED');
CREATE TYPE verification_status AS ENUM ('VERIFIED','PENDING_REVIEW','UNVERIFIED');
CREATE TYPE offer_status        AS ENUM ('PENDING','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN');
CREATE TYPE token_status        AS ENUM ('PENDING','MINTING','MINTED','FAILED','QUEUED');
CREATE TYPE escrow_status       AS ENUM ('UNCLAIMED','CLAIMED','EXPIRED');

-- Avant Arte Catalogue
CREATE TABLE aa_catalogue (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  artist              TEXT NOT NULL,
  year                INT,
  edition_size        INT NOT NULL,
  medium              TEXT,
  dimensions          TEXT,
  image_url           TEXT,
  emoji               TEXT,
  release_date        TIMESTAMPTZ,
  retail_price_pence  INT,
  is_active           BOOLEAN DEFAULT true,
  featured            BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Listings
CREATE TABLE listings (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  catalogue_id        TEXT NOT NULL REFERENCES aa_catalogue(id),
  seller_id           TEXT NOT NULL,
  edition_number      INT NOT NULL,
  ask_price_pence     INT,
  open_to_offers      BOOLEAN DEFAULT true,
  condition_grade     condition_grade,
  condition_notes     TEXT,
  photos              TEXT[] DEFAULT '{}',
  status              listing_status DEFAULT 'ACTIVE',
  proof_type          proof_type DEFAULT 'UNVERIFIED',
  proof_url           TEXT,
  proof_email_id      TEXT,
  verification_status verification_status DEFAULT 'UNVERIFIED',
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_listings_catalogue_status ON listings(catalogue_id, status);
CREATE INDEX idx_listings_seller           ON listings(seller_id);

-- Offers
CREATE TABLE offers (
  id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  catalogue_id              TEXT NOT NULL REFERENCES aa_catalogue(id),
  listing_id                TEXT REFERENCES listings(id),
  buyer_id                  TEXT NOT NULL,
  amount_pence              INT NOT NULL,
  expires_at                TIMESTAMPTZ NOT NULL,
  status                    offer_status DEFAULT 'PENDING',
  stripe_payment_intent_id  TEXT DEFAULT 'pi_pending',
  stripe_payment_method_id  TEXT,
  buyer_message             TEXT,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_offers_catalogue_status ON offers(catalogue_id, status);
CREATE INDEX idx_offers_listing          ON offers(listing_id);
CREATE INDEX idx_offers_buyer            ON offers(buyer_id);
CREATE INDEX idx_offers_expiry           ON offers(expires_at, status);

-- Sales
CREATE TABLE sales (
  id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id                TEXT UNIQUE NOT NULL REFERENCES listings(id),
  offer_id                  TEXT UNIQUE NOT NULL REFERENCES offers(id),
  sale_price_pence          INT NOT NULL,
  platform_fee_pence        INT NOT NULL,
  royalty_pence             INT NOT NULL,
  seller_net_pence          INT NOT NULL,
  stripe_payment_intent_id  TEXT,
  stripe_transfer_id        TEXT,
  stripe_charge_id          TEXT,
  buyer_wallet_address      TEXT,
  origin_token_id           TEXT,
  origin_token_tx_hash      TEXT,
  token_status              token_status DEFAULT 'PENDING',
  token_minted_at           TIMESTAMPTZ,
  token_mint_attempts       INT DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sales_token_status ON sales(token_status);

-- Royalty Escrow
CREATE TABLE royalty_escrow (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sale_id             TEXT UNIQUE NOT NULL REFERENCES sales(id),
  artist_name         TEXT NOT NULL,
  artist_email        TEXT,
  amount_pence        INT NOT NULL,
  status              escrow_status DEFAULT 'UNCLAIMED',
  claimed_by_user_id  TEXT,
  claimed_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Price History
CREATE TABLE price_sales (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  catalogue_id      TEXT NOT NULL REFERENCES aa_catalogue(id),
  sale_price_pence  INT NOT NULL,
  sale_date         TIMESTAMPTZ NOT NULL,
  source            TEXT DEFAULT 'grails',
  verified          BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_price_sales_catalogue ON price_sales(catalogue_id, sale_date);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE aa_catalogue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sales    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read catalogue"   ON aa_catalogue FOR SELECT USING (true);
CREATE POLICY "public read price sales" ON price_sales  FOR SELECT USING (true);
CREATE POLICY "public read listings"    ON listings     FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "public read offers"      ON offers       FOR SELECT USING (status = 'PENDING');
CREATE POLICY "auth insert listings"    ON listings     FOR INSERT WITH CHECK (true);
CREATE POLICY "auth insert offers"      ON offers       FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update listings"    ON listings     FOR UPDATE USING (true);
CREATE POLICY "auth update offers"      ON offers       FOR UPDATE USING (true);
CREATE POLICY "service insert sales"    ON sales        FOR INSERT WITH CHECK (true);
CREATE POLICY "service insert escrow"   ON royalty_escrow FOR INSERT WITH CHECK (true);
CREATE POLICY "service insert price"    ON price_sales  FOR INSERT WITH CHECK (true);

-- ─── SEED CATALOGUE ───────────────────────────────────────────
INSERT INTO aa_catalogue (id, slug, title, artist, year, edition_size, medium, dimensions, emoji, retail_price_pence, is_active, featured) VALUES
('aa-001','jonas-wood-untitled-plant',     'Untitled (Plant)',   'Jonas Wood',            2022,75, 'Archival pigment print','70 x 56 cm','🌿',85000, true,true),
('aa-002','hurvin-anderson-pool-study',    'Pool Study',         'Hurvin Anderson',        2023,50, 'Archival pigment print','60 x 80 cm','🏊',120000,true,true),
('aa-003','henry-taylor-untitled',         'Untitled Figure',    'Henry Taylor',           2022,100,'Screenprint',           '50 x 40 cm','🎨',65000, true,true),
('aa-004','cecily-brown-summer',           'Summer Study',       'Cecily Brown',           2023,60, 'Etching',               '45 x 55 cm','☀️',95000, true,true),
('aa-005','lynette-yiadom-boakye-evening', 'Evening Passage',    'Lynette Yiadom-Boakye', 2023,75, 'Lithograph',            '65 x 50 cm','🌙',110000,true,true),
('aa-006','peter-doig-red-house',          'Red House',          'Peter Doig',             2022,50, 'Archival pigment print','80 x 60 cm','🏠',180000,true,false);

-- ─── SEED PRICE HISTORY ───────────────────────────────────────
INSERT INTO price_sales (catalogue_id, sale_price_pence, sale_date, source) VALUES
('aa-001',90000, '2024-06-01','seeded'),
('aa-001',95000, '2024-08-15','seeded'),
('aa-001',105000,'2024-11-20','seeded'),
('aa-001',115000,'2025-01-10','seeded'),
('aa-002',125000,'2024-05-01','seeded'),
('aa-002',140000,'2024-09-01','seeded'),
('aa-002',155000,'2025-02-01','seeded'),
('aa-003',68000, '2024-07-01','seeded'),
('aa-003',72000, '2024-10-01','seeded'),
('aa-003',79000, '2025-01-01','seeded'),
('aa-004',98000, '2024-06-01','seeded'),
('aa-004',108000,'2024-10-01','seeded'),
('aa-004',115000,'2025-02-01','seeded'),
('aa-005',112000,'2024-07-01','seeded'),
('aa-005',125000,'2024-11-01','seeded'),
('aa-005',135000,'2025-03-01','seeded'),
('aa-006',185000,'2024-04-01','seeded'),
('aa-006',210000,'2024-10-01','seeded'),
('aa-006',220000,'2025-03-01','seeded');
