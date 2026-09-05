-- =====================================================
-- Test Fixtures
--
-- The records below are intentionally stable, as integration tests depend on these IDs.
-- As such, please refrain from modifying them.
--
-- If you must modify these records or IDs,
-- also do update the corresponding tests.
-- =====================================================


INSERT INTO hotels (id, name, city)
VALUES
  (10, 'Tokyo Grand Hotel', 'Tokyo'),
  (11, 'Osaka Bay Hotel', 'Osaka'),
  (12, 'Kyoto Garden Inn', 'Kyoto');

INSERT INTO rooms (id, hotel_id, type, price)
VALUES
  (1, 10, 'Single', 120),
  (2, 10, 'Double', 180),
  (3, 11, 'Single', 110),
  (4, 11, 'Double', 170),
  (5, 11, 'Quadruple', 320),
  (6, 12, 'Double', 160),
  (7, 12, 'Suite', 280);

INSERT INTO bookings (
  id,
  hotel_id,
  room_id,
  guest_name,
  check_in_date,
  check_out_date,
  nights,
  total_price
)
VALUES
(
  4,
  10,
  1,
  'Huy Nguyen',
  '2026-06-10',
  '2026-06-20',
  10,
  1200
),
(
  6,
  11,
  4,
  'John Smith',
  '2026-07-01',
  '2026-07-04',
  3,
  510
),
(
  7,
  10,
  2,
  'Validation Test',
  '2026-09-01',
  '2026-09-05',
  4,
  720
);

INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  password_hash,
  role,
  is_active
)
VALUES
(
  1,
  'Admin',
  'User',
  'admin@hotel.local',
  '$2b$10$49yx39SMtQdB3vKHON3druOiooCmgx3ZFBg2pDEzn4KNcH7t5S3XS',
  'admin',
  TRUE
),
(
  2,
  'Staff',
  'User',
  'staff@hotel.local',
  '$2b$10$mHcCO8u4np9xaP9GI2CBOuBgdC5KcAt9mpVQexh0RDwfD1El8HO/K',
  'staff',
  TRUE
),
(
  3,
  'Guest',
  'User',
  'guest@hotel.local',
  '$2b$10$3Rq34cYm/QL1kRDZbKY23uapvDxYOc.y1UboR2DoUVXnY4LRj1gtO',
  'guest',
  TRUE
);


SELECT setval(
  pg_get_serial_sequence('hotels', 'id'),
  (SELECT MAX(id) FROM hotels)
);

SELECT setval(
  pg_get_serial_sequence('rooms', 'id'),
  (SELECT MAX(id) FROM rooms)
);

SELECT setval(
  pg_get_serial_sequence('bookings', 'id'),
  (SELECT MAX(id) FROM bookings)
);

SELECT setval(
  pg_get_serial_sequence('users', 'id'),
  (SELECT MAX(id) FROM users)
);