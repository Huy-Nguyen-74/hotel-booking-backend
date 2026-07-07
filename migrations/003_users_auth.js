/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    first_name: { type: "varchar(100)", notNull: true },
    last_name: { type: "varchar(100)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    role: { type: "varchar(30)", notNull: true, default: "staff" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });

  pgm.addConstraint("users", "users_first_name_not_blank_chk", "CHECK (btrim(first_name) <> '')");
  pgm.addConstraint("users", "users_last_name_not_blank_chk", "CHECK (btrim(last_name) <> '')");
  pgm.addConstraint("users", "users_email_not_blank_chk", "CHECK (btrim(email) <> '')");
  pgm.addConstraint("users", "users_role_valid_chk", "CHECK (role IN ('admin', 'staff'))");
};

exports.down = (pgm) => {
  pgm.dropTable("users", { ifExists: true, cascade: true });
};
