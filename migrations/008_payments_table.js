/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Stores payment attempts (Stripe PaymentIntents) linked to bookings.
  pgm.createTable("payments", {
    id: "id",
    booking_id: {
      type: "integer",
      notNull: true,
      references: "bookings(id)", // Foreign key to bookings.id
      onDelete: "RESTRICT", // Prevent deleting bookings that still have payment history.
    },
    stripe_payment_intent_id: { type: "varchar(255)", notNull: true, unique: true },
    amount: { type: "integer", notNull: true },
    currency: { type: "varchar(3)", notNull: true, default: "JPY" },
    status: { type: "varchar(20)", notNull: true, default: "pending" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });

  pgm.addConstraint("payments", "payments_amount_positive_chk", {
    check: "amount > 0", // Amount must be greater than zero.
  });

  pgm.addConstraint("payments", "payments_status_valid_chk", {
    check: "status IN ('pending', 'succeeded', 'failed')",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("payments", { ifExists: true, cascade: true });
};
