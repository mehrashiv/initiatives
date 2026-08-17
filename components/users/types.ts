import type { Role } from "@/types";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface NewUserFormValues {
  email: string;
  password: string;
  role: Role;
}
