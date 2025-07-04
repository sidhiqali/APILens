import { Exclude } from 'class-transformer';
import { UserDocument } from 'src/types/user.type';

export class UserResponseDto {
  _id: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseDto {
  message: string;
  user: UserDocument;
  token: string;
}

export class RegisterResponseDto {
  message: string;
  user: UserDocument;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
}
