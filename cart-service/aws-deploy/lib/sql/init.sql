DO $$
BEGIN
  DROP TABLE IF EXISTS orders CASCADE;
  DROP TABLE IF EXISTS cart_items CASCADE;
  DROP TABLE IF EXISTS carts CASCADE;
  DROP TABLE IF EXISTS users CASCADE;

  DROP TYPE IF EXISTS order_status;
  DROP TYPE IF EXISTS cart_status;

  CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');
  CREATE TYPE order_status AS ENUM ('OPEN', 'APPROVED', 'CONFIRMED', 'SENT', 'COMPLETED', 'CANCELLED');

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL
  );

  ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

  CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status cart_status NOT NULL DEFAULT 'OPEN'
  );

  CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    count INTEGER NOT NULL CHECK (count > 0),
    PRIMARY KEY (cart_id, product_id)
  );

  CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cart_id UUID NOT NULL REFERENCES carts(id),
    payment JSONB NOT NULL,
    delivery JSONB NOT NULL,
    comments TEXT,
    status order_status NOT NULL DEFAULT 'OPEN',
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
END $$;
