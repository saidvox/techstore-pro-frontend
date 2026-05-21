export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  emailVerified?: boolean;
}
