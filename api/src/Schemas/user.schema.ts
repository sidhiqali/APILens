import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
