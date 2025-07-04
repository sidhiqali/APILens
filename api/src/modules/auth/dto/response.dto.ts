import { Exclude } from 'class-transformer';
import { IUser } from 'src/types/user.type';

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
  user: IUser;
  token: string;
}

export class RegisterResponseDto {
  message: string;
  user: IUser;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
}
