/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("bookings", {
    guest_user_id: {
      type: "integer",
      notNull: false,
      references: "users(id)", // Null for bookings made on behalf of an unregistered guest.
    },
    created_by_user_id: {
      type: "integer",
      notNull: false, // Nullable so pre-existing seed/legacy bookings remain valid.
      references: "users(id)", // The authenticated actor (admin/staff/guest) who created the booking.
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("bookings", ["guest_user_id", "created_by_user_id"]);
};
