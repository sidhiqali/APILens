export interface CreateUserData {
  email: string;
  password: string;
  role: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  isEmailVerified?: boolean;
}
