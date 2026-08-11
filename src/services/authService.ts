import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { AppError } from "../errors/AppError";
import { 
  findUserWithPasswordByEmail,
  updateSelfInfo as repositoryUpdateSelfInfo,
  storePasswordResetToken as repositoryStorePasswordResetToken,
  findUserIdByPasswordResetToken as repositoryFindUserIdByPasswordResetToken,
  deletePasswordResetToken as repositoryDeletePasswordResetToken 
} from "../repositories/userRepository";
import { SafeUser } from "../types/auth";

function generateToken(user: SafeUser) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "1h" }
  );
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserWithPasswordByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.is_active) {
    throw new AppError("User is inactive", 403);
  }

  const { password_hash, ...safeUser } = user;

  return {
    token: generateToken(safeUser),
    user: safeUser,
  };
}

/*
Password reset functionality

Request endpoint:
create token
→ hash token
→ calculate expiry
→ store userId + tokenHash + expiry
→ return/send raw token

Confirm endpoint:
receive raw token + new password
→ hash token
→ find record
→ check expiry
→ update password
→ delete that reset-token row

*/

export async function requestPasswordReset(email: string) {
  const message = "If the email exists, a password reset link will be sent";
  
  const user = await findUserWithPasswordByEmail(email);
  if (!user) {
    return { message };
  }

  // Create the raw password-reset token
  const resetToken = randomBytes(32).toString("hex");

  // Create the hash that will later be stored
  const tokenHash = createHash("sha256")
  .update(resetToken)
  .digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  await repositoryStorePasswordResetToken(user.id, tokenHash, expiresAt);

  if (process.env.NODE_ENV !== "test") {
    return { message };
  }

  // Automated tests only
  return { message, resetToken }; 

  // Alert: In a real application, you would send the resetToken to the user's email instead of returning it in the response.
  // Otherwise, anyone could see the token and reset the password without authorization.
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const tokenHash = createHash("sha256")
  .update(token)
  .digest("hex");

  const user = await repositoryFindUserIdByPasswordResetToken(tokenHash);
  if (!user || user.expires_at < new Date()) {
    throw new AppError("Invalid or expired password reset token", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updatedUser = await repositoryUpdateSelfInfo(user.user_id, undefined, undefined, hashedPassword);

  // Delete the whole password reset token record after successful password reset
  await repositoryDeletePasswordResetToken(tokenHash);
  
  return updatedUser;
}






