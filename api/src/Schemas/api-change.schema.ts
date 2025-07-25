import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface ChangeDetail {
  path: string;
  changeType: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
  description: string;
}

@Schema({ timestamps: true })
export class ApiChange extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Api', required: true })
  apiId: Types.ObjectId;

  @Prop({ required: true })
  fromVersion: string;

  @Prop({ required: true })
  toVersion: string;

  @Prop({
    required: true,
    enum: ['breaking', 'non-breaking', 'deprecation', 'addition'],
  })
  changeType: string;

  @Prop({
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity: string;

  @Prop({ type: Array, required: true })
  changes: ChangeDetail[];

  @Prop({ required: true })
  detectedAt: Date;

  @Prop({ default: false })
  acknowledged: boolean;

  @Prop()
  acknowledgedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acknowledgedBy: Types.ObjectId;

  @Prop()
  summary: string;

  @Prop({ default: 0 })
  impactScore: number; // 0-100 based on severity and change type
}

export const ApiChangeSchema = SchemaFactory.createForClass(ApiChange);
