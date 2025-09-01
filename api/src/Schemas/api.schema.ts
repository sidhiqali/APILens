import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Api extends Document {
  @Prop({ required: true })
  apiName: string;

  @Prop({ required: true })
  openApiUrl: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  version: string;

  @Prop({ type: Object })
  latestSpec: any;

  @Prop({ index: true })
  lastChecked: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: '1h' })
  checkFrequency: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ default: 'unknown', index: true })
  healthStatus: string;

  @Prop()
  lastHealthCheck: Date;

  @Prop({ index: true })
  lastError: string;

  @Prop({ default: 0 })
  changeCount: number;

  @Prop()
  description: string;
}

export const ApiSchema = SchemaFactory.createForClass(Api);
