DO $$
DECLARE
  user_id UUID := '502c69fc-70a1-70b1-b0a2-8d10e369cba7';
  cart1_id UUID;
  cart2_id UUID;
  order1_id UUID := '00000000-0000-0000-0000-000000000001';
  order2_id UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
  -- Clean tables in correct order (due to foreign key constraints)
  DELETE FROM orders;
  DELETE FROM cart_items;
  DELETE FROM carts;
  -- Insert first cart and get its ID
  INSERT INTO carts (id, user_id, status)
  VALUES (DEFAULT, user_id, 'OPEN')
  RETURNING id INTO cart1_id;

  -- Insert second cart and get its ID
  INSERT INTO carts (id, user_id, status)
  VALUES (DEFAULT, user_id, 'ORDERED')
  RETURNING id INTO cart2_id;

  INSERT INTO cart_items (cart_id, product_id, count)
  VALUES
    (cart1_id, '7567ec4b-b10c-45c5-9345-fc73c48a8000', 2),
    (cart1_id, '7567ec4b-b10c-45c5-9345-fc73c48a8005', 5),
    (cart2_id, '7567ec4b-b10c-45c5-9345-fc73c48a8000', 3);

  INSERT INTO orders (
    id, user_id, cart_id, 
    payment, delivery, comments, 
    status, total, created_at
  )
  VALUES
    (
      order1_id, user_id, cart1_id,
      '{"method": "credit_card", "transactionId": "txn_12345"}'::jsonb,
      '{"address": "some address", "firstName": "Name", "lastName": "Surname", "comment": ""}'::jsonb,
      'New order',
      'CREATED',
      57.93, -- 2*8.99 (id:8000) + 5*7.99 (id:8005)
      NOW() - INTERVAL '2 days'
    ),
    (
      order2_id, user_id, cart2_id,
      '{"method": "paypal", "transactionId": "txn_67890"}'::jsonb,
      '{"address": "another address", "firstName": "John", "lastName": "Doe", "comment": "Ship fast!"}'::jsonb,
      'Fancy order',
      'SHIPPED',
      26.97, -- 3*8.99 (id:8000)
      NOW() - INTERVAL '1 day'
    );
END $$;
