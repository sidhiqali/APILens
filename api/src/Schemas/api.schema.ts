// src/Schemas/api.schema.ts
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

  @Prop()
  lastChecked: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: '1h' }) // 5m, 15m, 1h, 6h, 1d
  checkFrequency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 'unknown' }) // healthy, unhealthy, checking, error
  healthStatus: string;

  @Prop()
  lastHealthCheck: Date;

  @Prop()
  lastError: string;

  @Prop({ default: 0 })
  changeCount: number;

  @Prop()
  description: string;
}

export const ApiSchema = SchemaFactory.createForClass(Api);
