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

INSERT INTO rooms (id, hotel_id, type, price, capacity)
VALUES
  (1, 10, 'Single', 120, 1),
  (2, 10, 'Double', 180, 2),
  (3, 11, 'Single', 110, 1),
  (4, 11, 'Double', 170, 2),
  (5, 11, 'Quadruple', 320, 4),
  (6, 12, 'Double', 160, 2),
  (7, 12, 'Suite', 280, 2);


-- Additional demo rooms: same room types can appear multiple times in each hotel.
-- Existing fixture IDs (1–7) and bookings remain unchanged.
INSERT INTO rooms (id, hotel_id, type, price, capacity)
VALUES
  (8, 10, 'Single', 125, 1),
  (9, 10, 'Single', 130, 1),
  (10, 10, 'Single', 135, 1),
  (11, 10, 'Single', 140, 1),
  (12, 10, 'Double', 185, 2),
  (13, 10, 'Double', 190, 2),
  (14, 10, 'Double', 195, 2),
  (15, 10, 'Double', 205, 2),
  (16, 10, 'Twin', 175, 2),
  (17, 10, 'Twin', 185, 2),
  (18, 10, 'Twin', 195, 2),
  (19, 10, 'Suite', 290, 2),
  (20, 10, 'Suite', 320, 2),
  (21, 10, 'Triple', 230, 3),
  (22, 10, 'Quadruple', 350, 4),
  (23, 11, 'Single', 115, 1),
  (24, 11, 'Single', 120, 1),
  (25, 11, 'Single', 125, 1),
  (26, 11, 'Single', 130, 1),
  (27, 11, 'Double', 175, 2),
  (28, 11, 'Double', 180, 2),
  (29, 11, 'Double', 190, 2),
  (30, 11, 'Double', 200, 2),
  (31, 11, 'Twin', 165, 2),
  (32, 11, 'Twin', 175, 2),
  (33, 11, 'Twin', 185, 2),
  (34, 11, 'Suite', 275, 2),
  (35, 11, 'Suite', 305, 2),
  (36, 11, 'Triple', 220, 3),
  (37, 11, 'Quadruple', 335, 4),
  (38, 12, 'Single', 105, 1),
  (39, 12, 'Single', 115, 1),
  (40, 12, 'Single', 125, 1),
  (41, 12, 'Double', 165, 2),
  (42, 12, 'Double', 175, 2),
  (43, 12, 'Double', 185, 2),
  (44, 12, 'Double', 195, 2),
  (45, 12, 'Twin', 150, 2),
  (46, 12, 'Twin', 160, 2),
  (47, 12, 'Twin', 170, 2),
  (48, 12, 'Suite', 285, 2),
  (49, 12, 'Suite', 310, 2),
  (50, 12, 'Triple', 210, 3),
  (51, 12, 'Quadruple', 300, 4),
  (52, 12, 'Quadruple', 330, 4);

INSERT INTO bookings (
  id,
  hotel_id,
  room_id,
  guest_name,
  check_in_date,
  check_out_date,
  nights,
  total_price,
  guest_count
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
  1200,
  1
),
(
  6,
  11,
  4,
  'John Smith',
  '2026-07-01',
  '2026-07-04',
  3,
  510,
  2
),
(
  7,
  10,
  2,
  'Validation Test',
  '2026-09-01',
  '2026-09-05',
  4,
  720,
  2
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