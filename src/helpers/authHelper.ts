// This helper function is used to generate the Authorization header for API requests that require authentication.
// It takes a token as an argument and returns an object containing the Authorization header in the format expected by the authentication middleware.
// If the token is not provided, it throws an error to ensure that tests do not proceed without proper authentication.

import { AppError } from "../errors/AppError";

export function authHeaders(token: string) {
  // Builds the Authorization header required by the protected booking routes.
  if (!token) {
    throw new AppError("Authentication token not initialized for tests", 500); // Fails fast if a test tries to call a protected route before login happened.
  }

  return {
    Authorization: `Bearer ${token}`, // This is the exact header format the auth middleware expects.
  };
}

