CREATE TABLE users(
	id				BIGSERIAL PRIMARY KEY,
	name				VARCHAR(100) NOT NULL,
	email			VARCHAR(100) NOT NULL,
	phone			VARCHAR(15) NOT NULL,
	password_hash 	VARCHAR(100) NOT NULL,
	role				VARCHAR(20) NOT NULL,
	status			VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
	organization_name VARCHAR(150),
	state			VARCHAR(50),
	district			VARCHAR(80),
	address			VARCHAR(255),
	created_at		TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at	 	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE residue_types(
	id				BIGSERIAL PRIMARY KEY,
	name				VARCHAR(100) NOT NULL UNIQUE,
	description 		TEXT
);
CREATE TABLE biomass_listings(
	id				BIGSERIAL PRIMARY KEY,
	farmer_id		BIGINT		NOT NULL REFERENCES users(id),
	residue_type_id 	BIGINT		NOT NULL REFERENCES residue_types(id),
	title			VARCHAR(150) NOT NULL,
	description 		TEXT,
	quantity_available	NUMERIC(12,2) NOT NULL CHECK (quantity_available>=0),
	price_per_tonne	NUMERIC(12,2) NOT NULL,
	quality_grade   VARCHAR(10) NOT NULL,
	moisture_percent NUMERIC(5,2),
	 state              VARCHAR(50)  NOT NULL,
    district           VARCHAR(80)  NOT NULL,
    pickup_address     VARCHAR(255) NOT NULL,
    available_from     DATE         NOT NULL,
    image_path         VARCHAR(255),
    status             VARCHAR(20)  NOT NULL, 
    ai_verified_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING', 
    admin_remarks      VARCHAR(255),
    version            BIGINT       NOT NULL DEFAULT 0,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE eco_products (
    id                 BIGSERIAL PRIMARY KEY,
    industry_id        BIGINT       NOT NULL REFERENCES users(id),
    name               VARCHAR(150) NOT NULL,
    description        TEXT,
    price              NUMERIC(12,2) NOT NULL,
    stock_quantity     INTEGER      NOT NULL CHECK (stock_quantity >= 0),
    image_path         VARCHAR(255),
    status             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE', 
    version            BIGINT       NOT NULL DEFAULT 0, 
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE orders (
    id                    BIGSERIAL PRIMARY KEY,
    order_type            VARCHAR(20)  NOT NULL,
    buyer_id              BIGINT       NOT NULL REFERENCES users(id),
    seller_id             BIGINT       NOT NULL REFERENCES users(id),
    listing_id            BIGINT       NOT NULL, 
    quantity              NUMERIC(12,2) NOT NULL,
    price_per_unit        NUMERIC(12,2) NOT NULL,
    total_amount          NUMERIC(12,2) NOT NULL,
    status                VARCHAR(20)  NOT NULL,
    preferred_pickup_date DATE,
    pickup_date           DATE,
    vehicle_number        VARCHAR(50),
    pickup_notes          VARCHAR(255),
    delivery_address      VARCHAR(255) NOT NULL,
    buyer_note            VARCHAR(500),
    rejection_reason      VARCHAR(255),
    delivery_remarks      VARCHAR(255),
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT       NOT NULL UNIQUE REFERENCES orders(id),
    amount          NUMERIC(12,2) NOT NULL,
    provider        VARCHAR(50)  NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    status          VARCHAR(20)  NOT NULL,
    paid_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at     TIMESTAMP,
    refunded_at     TIMESTAMP
);
CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT       NOT NULL UNIQUE REFERENCES orders(id),
    seller_id   BIGINT       NOT NULL REFERENCES users(id),
    reviewer_id BIGINT       NOT NULL REFERENCES users(id),
    rating      INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE subsidy_claims (
    id          BIGSERIAL PRIMARY KEY,
    farmer_id   BIGINT       NOT NULL REFERENCES users(id),
    order_id    BIGINT       NOT NULL UNIQUE REFERENCES orders(id),
    amount      NUMERIC(12,2) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING', 
    remarks     VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);


