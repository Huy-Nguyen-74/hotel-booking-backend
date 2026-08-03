/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("bookings", {
    status: {
      type: "varchar(30)",
      notNull: true,
      default: "confirmed",
    },
    cancelled_at: {
      type: "timestamptz",
      notNull: false,
    },
    cancelled_by_user_id: {
      type: "integer",
      notNull: false,
      references: "users(id)", // The user (guest or staff) who cancelled the booking.
    },
  });

  pgm.addConstraint("bookings", "bookings_status_valid_chk", {
    check: "status IN ('confirmed', 'cancelled')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("bookings", "bookings_status_valid_chk");
  pgm.dropColumns("bookings", ["status", "cancelled_at", "cancelled_by_user_id"]);
};
