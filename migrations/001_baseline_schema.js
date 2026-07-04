/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Stores hotels managed by the system.
  pgm.createTable("hotels", {
    id: "id",
    name: { type: "varchar(255)", notNull: true },
    city: { type: "varchar(255)", notNull: true },
  });

  // Each room belongs to exactly one hotel.
  pgm.createTable("rooms", {
    id: "id",
    hotel_id: {
      type: "integer",
      notNull: true,
      references: "hotels(id)", // Foreign key to hotels.id
    },
    type: { type: "varchar(100)", notNull: true },
    price: { type: "integer", notNull: true },
  });

  // Each booking reserves one room in one hotel.
  pgm.createTable("bookings", {
    id: "id",
    hotel_id: {
      type: "integer",
      notNull: true,
      references: "hotels(id)", // Foreign key to hotels.id
    },
    room_id: {
      type: "integer",
      notNull: true,
      references: "rooms(id)", // Foreign key to rooms.id
    },
    guest_name: { type: "text", notNull: true },
    check_in_date: { type: "date", notNull: true },
    check_out_date: { type: "date", notNull: true },
    nights: { type: "integer", notNull: true },
    total_price: { type: "integer", notNull: true },
  });
};

exports.down = (pgm) => {
  // Roll back in reverse dependency order to avoid FK violations.
  pgm.dropTable("bookings", { ifExists: true, cascade: true });
  pgm.dropTable("rooms", { ifExists: true, cascade: true });
  pgm.dropTable("hotels", { ifExists: true, cascade: true });
};
