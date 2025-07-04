import { IUser, UserDocument } from 'src/types/user.type';

export function toSafeUser(user: UserDocument): IUser {
  return {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
