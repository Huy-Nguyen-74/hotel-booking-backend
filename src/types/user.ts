// This is the shape of the user input before hashing the password, used for creating a user
export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
};

export type DbStoreUserData = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

// Full user data returned from the database, including the password hash
export type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: "admin" | "staff" | "guest";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};


// This is the shape of the safe user data returned from the database, excluding the password hash
export type SafeUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "staff" | "guest";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

