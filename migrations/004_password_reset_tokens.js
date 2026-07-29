/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Stores one active password reset token per user.
  pgm.createTable("password_reset_tokens", {
    id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      unique: true,
      references: "users(id)", // Foreign key to users.id
      onDelete: "CASCADE",
    },
    token_hash: { type: "text", notNull: true, unique: true },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("password_reset_tokens", { ifExists: true, cascade: true });
};
