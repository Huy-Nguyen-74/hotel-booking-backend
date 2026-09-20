/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("rooms", {
    capacity: {
      type: "integer",
      notNull: false, // Temporarily nullable so existing rows can be backfilled below.
    },
  });

  // Backfill existing rooms with a capacity based on their room type.
  pgm.sql(`
    UPDATE rooms
    SET capacity = CASE type
      WHEN 'Single' THEN 1
      WHEN 'Double' THEN 2
      WHEN 'Quadruple' THEN 4
      WHEN 'Suite' THEN 2
      ELSE 2
    END
    WHERE capacity IS NULL
  `);

  pgm.alterColumn("rooms", "capacity", { notNull: true });

  pgm.addConstraint("rooms", "rooms_capacity_positive_chk", {
    check: "capacity > 0", // Room capacity must be a positive integer.
  });

  pgm.addColumns("bookings", {
    guest_count: {
      type: "integer",
      notNull: false, // Temporarily nullable so existing rows can be backfilled below.
    },
  });

  // Backfill existing bookings with a default guest count of 1.
  pgm.sql(`UPDATE bookings SET guest_count = 1 WHERE guest_count IS NULL`);

  pgm.alterColumn("bookings", "guest_count", { notNull: true });

  pgm.addConstraint("bookings", "bookings_guest_count_positive_chk", {
    check: "guest_count > 0", // Guest count must be a positive integer.
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("bookings", "bookings_guest_count_positive_chk");
  pgm.dropColumns("bookings", ["guest_count"]);
  pgm.dropConstraint("rooms", "rooms_capacity_positive_chk");
  pgm.dropColumns("rooms", ["capacity"]);
};
