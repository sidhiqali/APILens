import { Document, Types } from 'mongoose';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  refreshTokenExpires?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  notificationPreferences: {
    email: boolean;
    breakingChanges: boolean;
    nonBreakingChanges: boolean;
    apiErrors: boolean;
  };
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id?: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  isActive: boolean;
  notificationPreferences: {
    email: boolean;
    breakingChanges: boolean;
    nonBreakingChanges: boolean;
    apiErrors: boolean;
  };
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}
