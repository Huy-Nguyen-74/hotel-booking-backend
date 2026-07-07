-- Reference-only schema snapshot.
-- Source of truth is the migrations folder.
-- To build schema in environments, run migrations instead of this file.

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (BTRIM(name) <> ''),
  city VARCHAR(255) NOT NULL CHECK (BTRIM(city) <> '')
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id),
  type VARCHAR(100) NOT NULL CHECK (BTRIM(type) <> ''),
  price INTEGER NOT NULL CHECK (price > 0)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  guest_name TEXT NOT NULL CHECK (BTRIM(guest_name) <> ''),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL CHECK (check_out_date > check_in_date),
  nights INTEGER NOT NULL CHECK (nights > 0),
  total_price INTEGER NOT NULL CHECK (total_price > 0)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL CHECK (BTRIM(first_name) <> ''),
  last_name VARCHAR(100) NOT NULL CHECK (BTRIM(last_name) <> ''),
  email VARCHAR(255) NOT NULL UNIQUE CHECK (BTRIM(email) <> ''),
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);