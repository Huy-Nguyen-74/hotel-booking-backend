// This is the shape of the user input before hashing the password, used for creating a user
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

// This is the shape of the user data returned from the database, including the password hash
export type DatabaseUserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// This is the shape of the user data returned from the database, after being converted to camelCase and without the password hash
export type ReturnedUserData = {
  id: DatabaseUserRow["id"];
  firstName: DatabaseUserRow["first_name"];
  lastName: DatabaseUserRow["last_name"];
  email: DatabaseUserRow["email"];
  role: DatabaseUserRow["role"];
  isActive: DatabaseUserRow["is_active"];
  createdAt: DatabaseUserRow["created_at"];
  updatedAt: DatabaseUserRow["updated_at"];
}

