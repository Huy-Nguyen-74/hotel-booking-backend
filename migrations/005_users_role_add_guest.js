/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropConstraint("users", "users_role_valid_chk");
  pgm.addConstraint("users", "users_role_valid_chk", "CHECK (role IN ('admin', 'staff', 'guest'))");
};

exports.down = (pgm) => {
  pgm.dropConstraint("users", "users_role_valid_chk");
  pgm.addConstraint("users", "users_role_valid_chk", "CHECK (role IN ('admin', 'staff'))");
};
