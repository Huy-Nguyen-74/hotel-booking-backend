export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "staff";
}
