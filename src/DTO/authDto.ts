import { SafeUser } from "../types/auth";

export function toAuthDto(user: SafeUser) {
  return {
    userId: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
  };
}

