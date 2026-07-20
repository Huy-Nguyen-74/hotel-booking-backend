export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "staff";
}

export type SafeUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
