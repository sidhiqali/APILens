import { Document, Types } from 'mongoose';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id?: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
