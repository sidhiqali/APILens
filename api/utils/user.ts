// utils/user.ts
import { IUser, UserDocument } from 'src/types/user.type';

export function toSafeUser(user: UserDocument): IUser {
  return {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    isActive: user.isActive,
    notificationPreferences: user.notificationPreferences,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    timezone: user.timezone,
    language: user.language,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
