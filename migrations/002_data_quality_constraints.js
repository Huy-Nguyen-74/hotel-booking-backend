exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addConstraint("hotels", "hotels_name_not_blank_chk", {
    check: "btrim(name) <> ''", // Hotel name cannot be blank/whitespace.
  });

  pgm.addConstraint("hotels", "hotels_city_not_blank_chk", {
    check: "btrim(city) <> ''", // Hotel city cannot be blank/whitespace.
  });

  pgm.addConstraint("rooms", "rooms_type_not_blank_chk", {
    check: "btrim(type) <> ''", // Room type cannot be blank/whitespace.
  });

  pgm.addConstraint("rooms", "rooms_price_positive_chk", {
    check: "price > 0", // Room price must be a positive integer.
  });

  pgm.addConstraint("bookings", "bookings_guest_name_not_blank_chk", {
    check: "btrim(guest_name) <> ''", // Guest name cannot be blank/whitespace.
  });

  pgm.addConstraint("bookings", "bookings_date_range_chk", {
    check: "check_out_date > check_in_date", // Check-out must be after check-in.
  });

  pgm.addConstraint("bookings", "bookings_nights_positive_chk", {
    check: "nights > 0", // Nights must be greater than zero.
  });

  pgm.addConstraint("bookings", "bookings_total_price_positive_chk", {
    check: "total_price > 0", // Total booking price must be greater than zero.
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("bookings", "bookings_total_price_positive_chk"); // Remove positive total price check.
  pgm.dropConstraint("bookings", "bookings_nights_positive_chk"); // Remove positive nights check.
  pgm.dropConstraint("bookings", "bookings_date_range_chk"); // Remove date range ordering check.
  pgm.dropConstraint("bookings", "bookings_guest_name_not_blank_chk"); // Remove non-blank guest name check.
  pgm.dropConstraint("rooms", "rooms_price_positive_chk"); // Remove positive room price check.
  pgm.dropConstraint("rooms", "rooms_type_not_blank_chk"); // Remove non-blank room type check.
  pgm.dropConstraint("hotels", "hotels_city_not_blank_chk"); // Remove non-blank hotel city check.
  pgm.dropConstraint("hotels", "hotels_name_not_blank_chk"); // Remove non-blank hotel name check.
};