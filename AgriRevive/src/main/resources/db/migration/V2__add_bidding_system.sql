ALTER TABLE biomass_listings
ADD COLUMN listing_type VARCHAR(20) NOT NULL DEFAULT 'FIXED', -- FIXED | AUCTION
ADD COLUMN highest_bid_amount NUMERIC(12,2),
ADD COLUMN highest_bidder_id BIGINT REFERENCES users(id),
ADD COLUMN auction_end_time TIMESTAMP;

CREATE TABLE bids (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT       NOT NULL REFERENCES biomass_listings(id),
    bidder_id   BIGINT       NOT NULL REFERENCES users(id),
    amount      NUMERIC(12,2) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);