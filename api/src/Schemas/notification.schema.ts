import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Api' })
  apiId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ApiChange' })
  changeId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['api_change', 'api_error', 'api_recovered', 'system'],
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity: string;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  readAt: Date;

  @Prop({ type: Object })
  metadata: any;

  @Prop({ default: [] })
  channels: string[]; // ['email', 'webhook', 'in-app']

  @Prop({ default: [] })
  deliveryStatus: {
    channel: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
  }[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
