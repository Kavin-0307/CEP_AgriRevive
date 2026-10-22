INSERT INTO residue_types (name, description) VALUES
  ('Rice straw', 'Paddy straw from harvest'),
  ('Wheat straw', 'Low-moisture wheat straw'),
  ('Bagasse', 'Fibrous sugarcane residue'),
  ('Cotton stalk', 'Bundled cotton stalks'),
  ('Groundnut shells', 'Dry screened groundnut shells'),
  ('Maize residue', 'Mixed maize cobs and husk'),
  ('Other residue', 'General agricultural residue')
ON CONFLICT (name) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email));

-- 3. Performance indexes on Foreign Keys
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON biomass_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON biomass_listings(status);
CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id);