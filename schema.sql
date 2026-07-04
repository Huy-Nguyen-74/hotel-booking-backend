-- Reference-only schema snapshot.
-- Source of truth is the migrations folder.
-- To build schema in environments, run migrations instead of this file.

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id),
  type VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  guest_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INTEGER NOT NULL,
  total_price INTEGER NOT NULL
);