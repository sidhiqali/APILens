import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken: string;

  @Prop()
  emailVerificationExpires: Date;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  @Prop()
  refreshToken: string;

  @Prop()
  refreshTokenExpires: Date;

  @Prop()
  lastLoginAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: Object,
    default: {
      email: true,
      breakingChanges: true,
      nonBreakingChanges: false,
      apiErrors: true,
    },
  })
  notificationPreferences: {
    email: boolean;
    breakingChanges: boolean;
    nonBreakingChanges: boolean;
    apiErrors: boolean;
  };

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  avatar: string;

  @Prop()
  timezone: string;

  @Prop({ default: 'en' })
  language: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
